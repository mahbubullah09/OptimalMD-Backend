import { model, Schema, Types } from "mongoose";

/**
 * Site-wide content: the navigation bar and the footer.
 *
 * A singleton, addressed by a fixed `key` rather than an id, because there is
 * exactly one navbar for the site. Storing it as a page section would mean
 * copying the menu into every page and keeping the copies in step.
 *
 * `nav` and `footer` are Mixed for the same reason section data is: their
 * shapes belong to the frontend components that render them, and pinning them
 * down here would mean a migration every time a column gains a field. The
 * controller validates on the way in.
 */

export const GLOBALS_KEY = "site";

export interface GlobalsAttrs {
  key: string;
  nav: Record<string, unknown>;
  footer: Record<string, unknown>;
  updatedBy?: Types.ObjectId;
}

const globalsSchema = new Schema<GlobalsAttrs>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: GLOBALS_KEY,
      index: true,
    },
    nav: { type: Schema.Types.Mixed, default: {} },
    footer: { type: Schema.Types.Mixed, default: {} },
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

export const Globals = model<GlobalsAttrs>("Globals", globalsSchema);
