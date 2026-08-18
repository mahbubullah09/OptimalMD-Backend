import type { Request, Response } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import {
  Page,
  SECTION_TYPES,
  type SeoAttrs,
  TWITTER_CARDS,
  WEBPAGE_TYPES,
} from "../models/Page.js";
import { revalidatePage } from "../services/revalidate.js";
import { ApiError } from "../utils/ApiError.js";
import { param } from "../utils/params.js";

/**
 * Caps are sanity limits, not SEO advice.
 *
 * Search engines truncate titles around 60 characters and descriptions around
 * 160, but longer values are legal and the live site already uses a 76-char
 * title and a 290-char description. Enforcing the display length here would
 * make existing content uneditable, so the admin UI shows advisory character
 * counters instead and the API only rejects genuinely absurd input.
 */
const schemaOrgSchema = z.object({
  organization: z.object({ enabled: z.boolean() }).optional(),
  webPage: z
    .object({ enabled: z.boolean(), type: z.enum(WEBPAGE_TYPES) })
    .optional(),
  faq: z
    .object({
      enabled: z.boolean(),
      items: z.array(z.object({ question: z.string().min(1), answer: z.string().min(1) })),
    })
    .optional(),
  breadcrumbs: z
    .object({
      enabled: z.boolean(),
      items: z.array(z.object({ name: z.string().min(1), url: z.string().min(1) })),
    })
    .optional(),
});

const seoSchema = z.object({
  title: z.string().max(300).optional(),
  author: z.string().max(200).optional(),
  language: z.string().max(20).optional(),
  customMeta: z
    .array(z.object({ name: z.string().min(1).max(100), content: z.string().max(1000) }))
    .optional(),
  description: z.string().max(1000).optional(),
  canonical: z.string().url().optional().or(z.literal("")),
  keywords: z.array(z.string()).optional(),
  ogTitle: z.string().max(300).optional(),
  ogDescription: z.string().max(1000).optional(),
  ogImage: z.string().url().optional().or(z.literal("")),
  twitterCard: z.enum(TWITTER_CARDS).optional(),
  noindex: z.boolean().optional(),
  nofollow: z.boolean().optional(),
  schema: schemaOrgSchema.optional(),
});

const sectionSchema = z.object({
  key: z.string().min(1),
  type: z.enum(SECTION_TYPES),
  order: z.number().int().min(0),
  enabled: z.boolean().optional(),
  data: z.record(z.string(), z.unknown()).default({}),
});

/** GET /api/pages — list, without section bodies. */
export async function listPages(_req: Request, res: Response) {
  const pages = await Page.find().select("slug name seo updatedAt publishedAt").sort("slug").lean();
  res.json({ pages });
}

/** GET /api/pages/:slug — full page, used by both the site and the admin. */
export async function getPage(req: Request, res: Response) {
  const slug = param(req, "slug").toLowerCase();
  const page = await Page.findOne({ slug }).lean();
  if (!page) throw ApiError.notFound(`No page with slug "${slug}"`);
  res.json({ page });
}

const updatePageSchema = z
  .object({
    name: z.string().min(1).optional(),
    seo: seoSchema.optional(),
    sections: z.array(sectionSchema).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Nothing to update" });

/** PUT /api/pages/:slug */
export async function updatePage(req: Request, res: Response) {
  const slug = param(req, "slug").toLowerCase();
  const patch = updatePageSchema.parse(req.body);

  const page = await Page.findOne({ slug });
  if (!page) throw ApiError.notFound(`No page with slug "${slug}"`);

  if (patch.name !== undefined) page.name = patch.name;
  if (patch.seo) {
    // Plain-object copy of the current subdocument, so spreading it does not
    // drag Mongoose internals into the assignment.
    const current = JSON.parse(JSON.stringify(page.seo)) as SeoAttrs;

    page.seo = {
      ...current,
      ...patch.seo,
      // Nested objects would otherwise be replaced wholesale by a partial patch.
      schema: { ...current.schema, ...(patch.seo.schema ?? {}) },
    } as SeoAttrs;

    page.markModified("seo");
  }
  if (patch.sections) {
    // Reject duplicate keys up front — the array has no unique index of its own
    // and a duplicate would make section edits ambiguous.
    const keys = patch.sections.map((s) => s.key);
    const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
    if (dupes.length > 0) {
      throw ApiError.badRequest(`Duplicate section keys: ${[...new Set(dupes)].join(", ")}`);
    }
    page.sections = patch.sections.map((s) => ({ ...s, enabled: s.enabled ?? true }));
  }

  if (req.auth) page.updatedBy = new Types.ObjectId(req.auth.sub);
  await page.save();

  // Best-effort: a failed revalidate must not fail the save.
  const revalidated = await revalidatePage(page.slug);

  res.json({ page: page.toJSON(), revalidated });
}

const patchSectionSchema = z.object({
  order: z.number().int().min(0).optional(),
  enabled: z.boolean().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

/** PATCH /api/pages/:slug/sections/:key — edit one section without resending the page. */
export async function updateSection(req: Request, res: Response) {
  const slug = param(req, "slug").toLowerCase();
  const key = param(req, "key");
  const patch = patchSectionSchema.parse(req.body);

  const page = await Page.findOne({ slug });
  if (!page) throw ApiError.notFound(`No page with slug "${slug}"`);

  const section = page.sections.find((s) => s.key === key);
  if (!section) throw ApiError.notFound(`No section "${key}" on page "${slug}"`);

  if (patch.order !== undefined) section.order = patch.order;
  if (patch.enabled !== undefined) section.enabled = patch.enabled;
  if (patch.data !== undefined) section.data = patch.data;

  page.markModified("sections");
  if (req.auth) page.updatedBy = new Types.ObjectId(req.auth.sub);
  await page.save();

  const revalidated = await revalidatePage(page.slug);
  res.json({ page: page.toJSON(), revalidated });
}
