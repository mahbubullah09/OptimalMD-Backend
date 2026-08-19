import type { Request, Response } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { Globals, GLOBALS_KEY } from "../models/Globals.js";
import { revalidatePage } from "../services/revalidate.js";
import { ApiError } from "../utils/ApiError.js";
import { param } from "../utils/params.js";

/**
 * The navbar and footer, shared by every page.
 *
 * Validation mirrors the pages controller: shapes are checked deeply enough
 * that a malformed menu cannot be stored, but not so tightly that adding a
 * field to a footer column needs a backend release.
 */

const linkSchema = z.object({
  label: z.string().max(200),
  href: z.string().max(2000),
});

const HEX = /^#[0-9a-fA-F]{3,8}$/;

/**
 * A chosen colour, matching the frontend's ColorSpec.
 *
 * Hex values are pattern-checked here as well as in the renderer: these end up
 * in a style attribute, and a value that only the renderer refuses would be
 * stored and then silently ignored, which reads as a bug rather than a
 * rejection.
 */
const colorSpecSchema = z.union([
  z.object({ kind: z.literal("tone"), tone: z.enum(["blue", "green"]) }),
  z.object({ kind: z.literal("solid"), color: z.string().regex(HEX) }),
  z.object({
    kind: z.literal("gradient"),
    from: z.string().regex(HEX),
    to: z.string().regex(HEX),
    angle: z.number().min(0).max(360),
  }),
]);

const appearanceSchema = z
  .object({
    background: colorSpecSchema.nullish(),
    buttonFill: colorSpecSchema.nullish(),
    buttonText: colorSpecSchema.nullish(),
  })
  .optional();

const imageSchema = z.object({
  src: z.string().max(2000),
  alt: z.string().max(500),
  title: z.string().max(300).optional(),
  description: z.string().max(1000).optional(),
  // Rendered size in pixels; absent means "scale naturally".
  width: z.number().int().positive().max(4000).optional(),
  height: z.number().int().positive().max(4000).optional(),
});

/**
 * Menu items nest, so the schema does too.
 *
 * Depth is capped: the navbar renders three levels, and an unbounded recursive
 * schema would accept a payload deep enough to be a denial-of-service on the
 * renderer as much as on the parser.
 */
const MAX_DEPTH = 3;

const navItemSchema = (depth: number): z.ZodType<unknown> =>
  z.object({
    label: z.string().max(200),
    href: z.string().max(2000).default(""),
    children:
      depth >= MAX_DEPTH
        ? z.array(z.never()).max(0).default([])
        : z.array(z.lazy(() => navItemSchema(depth + 1))).default([]),
    alignRight: z.boolean().optional(),
    flyoutLeft: z.boolean().optional(),
  });

const actionSchema = linkSchema.extend({ appearance: appearanceSchema });

const navSchema = z.object({
  logo: imageSchema,
  homeHref: z.string().max(2000),
  entries: z.array(navItemSchema(1)).max(50),
  login: actionSchema,
  cta: actionSchema,
  appearance: appearanceSchema,
});

const footerSchema = z.object({
  logo: imageSchema,
  blurb: z.string().max(2000),
  badge: imageSchema,
  social: z
    .array(
      z.object({
        platform: z.enum(["facebook", "instagram", "youtube", "linkedin", "x"]),
        href: z.string().max(2000),
      }),
    )
    .max(10),
  columns: z
    .array(
      z.object({
        groups: z
          .array(z.object({ title: z.string().max(200), links: z.array(linkSchema).max(60) }))
          .max(6),
      }),
    )
    .max(8),
  contact: z.object({
    title: z.string().max(200),
    items: z
      .array(
        z.object({
          icon: z.enum(["phone", "mail", "pin"]),
          title: z.string().max(200),
          body: z.string().max(2000),
        }),
      )
      .max(10),
  }),
  legal: z.object({
    copyright: z.string().max(500),
    links: z.array(linkSchema).max(20),
    note: z.string().max(300),
  }),
  appearance: appearanceSchema,
});

const PARTS = { nav: navSchema, footer: footerSchema } as const;
type Part = keyof typeof PARTS;

const isPart = (value: string): value is Part => value in PARTS;

/** GET /api/globals — public, so the site can render its chrome. */
export async function getGlobals(_req: Request, res: Response) {
  const globals = await Globals.findOne({ key: GLOBALS_KEY });
  // An absent document is not an error: the frontend falls back to its own
  // defaults, which is what keeps the site rendering before anything is saved.
  res.json({ globals: globals ? globals.toJSON() : null });
}

/** PUT /api/globals/:part — replace the navbar or the footer. */
export async function updateGlobalsPart(req: Request, res: Response) {
  const part = param(req, "part");
  if (!isPart(part)) throw ApiError.notFound(`No globals part "${part}"`);

  const data = PARTS[part].parse(req.body);

  const globals =
    (await Globals.findOne({ key: GLOBALS_KEY })) ?? new Globals({ key: GLOBALS_KEY });

  globals.set(part, data);
  globals.markModified(part);
  if (req.auth) globals.updatedBy = new Types.ObjectId(req.auth.sub);
  await globals.save();

  // The chrome is on every page, so the whole site is stale after this. The
  // frontend's revalidate handler treats this slug as "everything".
  const revalidated = await revalidatePage("*");

  res.json({ globals: globals.toJSON(), revalidated });
}
