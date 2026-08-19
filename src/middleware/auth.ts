import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { type AdminRole, AdminUser } from "../models/AdminUser.js";
import { ApiError } from "../utils/ApiError.js";

export interface AuthPayload {
  sub: string;
  email: string;
  role: AdminRole;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

const bearerFrom = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
};

/**
 * Verifies the Bearer token and confirms the account still exists and is
 * active — so deactivating a user takes effect immediately rather than when
 * their token happens to expire.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = bearerFrom(req);
    if (!token) throw ApiError.unauthorized();

    let payload: AuthPayload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    } catch {
      throw ApiError.unauthorized("Session expired or invalid");
    }

    const user = await AdminUser.findById(payload.sub).lean();
    if (!user || !user.isActive) throw ApiError.unauthorized("Account is no longer active");

    req.auth = { sub: String(user._id), email: user.email, role: user.role };
    next();
  } catch (err) {
    next(err);
  }
}

