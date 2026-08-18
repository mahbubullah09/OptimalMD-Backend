import type { Request, Response } from "express";
import { z } from "zod";
import { type AuthPayload, signToken } from "../middleware/auth.js";
import { AdminUser, verifyPassword } from "../models/AdminUser.js";
import { ApiError } from "../utils/ApiError.js";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

/**
 * POST /api/auth/login
 *
 * Returns the JWT in the body rather than setting a cookie: the admin UI is
 * served by Next.js on a different origin, and its route handler stores this
 * token in a first-party httpOnly cookie of its own.
 */
export async function login(req: Request, res: Response) {
  const { email, password } = loginSchema.parse(req.body);

  const user = await AdminUser.findOne({ email: email.toLowerCase() }).select("+passwordHash");

  // Same message and roughly the same work either way, so the response can't
  // be used to enumerate which addresses have accounts.
  const failed = () => ApiError.unauthorized("Incorrect email or password");

  if (!user) {
    // Burn comparable time so a missing user isn't measurably faster.
    await verifyPassword(password, "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv");
    throw failed();
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw failed();
  if (!user.isActive) throw ApiError.forbidden("This account has been deactivated");

  user.lastLoginAt = new Date();
  await user.save();

  const payload: AuthPayload = {
    sub: String(user._id),
    email: user.email,
    role: user.role,
  };

  res.json({ token: signToken(payload), user: user.toJSON() });
}

/** GET /api/auth/me */
export async function me(req: Request, res: Response) {
  const user = await AdminUser.findById(req.auth?.sub);
  if (!user) throw ApiError.unauthorized();
  res.json({ user: user.toJSON() });
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(10, "Use at least 10 characters"),
});

/** POST /api/auth/change-password */
export async function changePassword(req: Request, res: Response) {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

  const user = await AdminUser.findById(req.auth?.sub).select("+passwordHash");
  if (!user) throw ApiError.unauthorized();

  const ok = await verifyPassword(currentPassword, user.passwordHash);
  if (!ok) throw ApiError.badRequest("Current password is incorrect");

  const { hashPassword } = await import("../models/AdminUser.js");
  user.passwordHash = await hashPassword(newPassword);
  await user.save();

  res.json({ ok: true });
}
