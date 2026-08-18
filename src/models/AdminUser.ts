import bcrypt from "bcryptjs";
import { type HydratedDocument, model, Schema } from "mongoose";

/**
 * Roles are stored now but not yet enforced beyond "must be signed in".
 * Per-role permissions can layer on top without a migration.
 */
export const ADMIN_ROLES = ["admin", "editor"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export interface AdminUserAttrs {
  email: string;
  name: string;
  passwordHash: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt?: Date;
}

const adminUserSchema = new Schema<AdminUserAttrs>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    // Never selected by default, so a stray .find() can't leak hashes.
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ADMIN_ROLES, default: "admin" },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export type AdminUserDoc = HydratedDocument<AdminUserAttrs>;

export const AdminUser = model<AdminUserAttrs>("AdminUser", adminUserSchema);

const BCRYPT_ROUNDS = 12;

export const hashPassword = (plain: string) => bcrypt.hash(plain, BCRYPT_ROUNDS);

export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);
