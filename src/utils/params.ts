import type { Request } from "express";
import { ApiError } from "./ApiError.js";

/**
 * Express 5 types route params as `string | string[]` because a wildcard can
 * match repeatedly. Our routes only use single-segment params, so narrow once
 * here instead of casting at every call site.
 */
export function param(req: Request, name: string): string {
  const value = (req.params as Record<string, string | string[] | undefined>)[name];
  if (typeof value === "string" && value.length > 0) return value;
  throw ApiError.badRequest(`Missing route parameter "${name}"`);
}
