import { model, Schema, Types } from "mongoose";

/**
 * A page is an ordered list of sections plus its SEO metadata.
 *
 * `data` is deliberately schemaless: each section type owns its own shape
 * (the hero's feature lists look nothing like the FAQ tabs), and locking that
 * down in Mongoose would mean a migration every time a section gains a field.
 * The admin UI validates per-section on the way in.
 */
export const SECTION_TYPES = [
  "hero",
  "careCoverage",
  "audiences",
  "network",
  "noList",
  "appPromo",
  "whyOptimalMD",
  "givesBack",
  "finalCta",
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

export interface SectionAttrs {
  /** Stable identifier, unique within the page. */
  key: string;
  type: SectionType;
  order: number;
  enabled: boolean;
  data: Record<string, unknown>;
}

export const WEBPAGE_TYPES = ["WebPage", "AboutPage", "ContactPage", "CollectionPage"] as const;
export type WebPageType = (typeof WEBPAGE_TYPES)[number];

export const TWITTER_CARDS = ["summary", "summary_large_image"] as const;
export type TwitterCard = (typeof TWITTER_CARDS)[number];

/**
 * Structured data is modelled as typed toggles rather than a free-text JSON-LD
 * box, so an editor can add an FAQ block or breadcrumbs from a form and the
 * emitted JSON-LD is always valid.
 */
export interface SchemaAttrs {
  organization: { enabled: boolean };
  webPage: { enabled: boolean; type: WebPageType };
  faq: { enabled: boolean; items: { question: string; answer: string }[] };
  breadcrumbs: { enabled: boolean; items: { name: string; url: string }[] };
}

export interface MetaTagAttrs {
  name: string;
  content: string;
}

export interface SeoAttrs {
  title?: string;
  author?: string;
  language: string;
  customMeta: MetaTagAttrs[];
  description?: string;
  canonical?: string;
  keywords: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard: TwitterCard;
  noindex: boolean;
  nofollow: boolean;
  structuredData: SchemaAttrs;
}

export interface PageAttrs {
  slug: string;
  name: string;
  seo: SeoAttrs;
  sections: SectionAttrs[];
  publishedAt?: Date;
  updatedBy?: Types.ObjectId;
}

const sectionSchema = new Schema<SectionAttrs>(
  {
    key: { type: String, required: true, trim: true },
    type: { type: String, enum: SECTION_TYPES, required: true },
    order: { type: Number, required: true, default: 0 },
    enabled: { type: Boolean, default: true },
    data: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

const schemaOrgSchema = new Schema<SchemaAttrs>(
  {
    organization: {
      enabled: { type: Boolean, default: true },
    },
    webPage: {
      enabled: { type: Boolean, default: true },
      type: { type: String, enum: WEBPAGE_TYPES, default: "WebPage" },
    },
    faq: {
      enabled: { type: Boolean, default: false },
      items: {
        type: [
          new Schema(
            {
              question: { type: String, required: true, trim: true },
              answer: { type: String, required: true, trim: true },
            },
            { _id: false },
          ),
        ],
        default: [],
      },
    },
    breadcrumbs: {
      enabled: { type: Boolean, default: false },
      items: {
        type: [
          new Schema(
            {
              name: { type: String, required: true, trim: true },
              url: { type: String, required: true, trim: true },
            },
            { _id: false },
          ),
        ],
        default: [],
      },
    },
  },
  { _id: false },
);

const seoSchema = new Schema<SeoAttrs>(
  {
    title: { type: String, trim: true },
    author: { type: String, trim: true },
    language: { type: String, trim: true, default: "en" },
    customMeta: {
      type: [
        new Schema(
          {
            name: { type: String, required: true, trim: true },
            content: { type: String, required: true, trim: true },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    description: { type: String, trim: true },
    canonical: { type: String, trim: true },
    keywords: { type: [String], default: [] },
    ogTitle: { type: String, trim: true },
    ogDescription: { type: String, trim: true },
    ogImage: { type: String, trim: true },
    twitterCard: { type: String, enum: TWITTER_CARDS, default: "summary_large_image" },
    noindex: { type: Boolean, default: false },
    nofollow: { type: Boolean, default: false },
    /*
     * Named structuredData, not schema: "schema" is a reserved Mongoose
     * document property. As a path name it overwrites the subdocument's own
     * .schema reference while defaults are being applied, after which the
     * next array default reads undefined.indexedPaths() and validation
     * fails with an error naming neither cause.
     */
    structuredData: { type: schemaOrgSchema, default: () => ({}) },
  },
  { _id: false },
);

const pageSchema = new Schema<PageAttrs>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    seo: { type: seoSchema, default: () => ({}) },
    sections: { type: [sectionSchema], default: [] },
    publishedAt: { type: Date },
    updatedBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Sections are always read in display order.
pageSchema.pre("save", function sortSections(next) {
  if (this.isModified("sections")) {
    this.sections.sort((a, b) => a.order - b.order);
  }
  next();
});

export const Page = model<PageAttrs>("Page", pageSchema);
