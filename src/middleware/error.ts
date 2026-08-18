import type { NextFunction, Request, Response } from "express";
import { MongoServerError } from "mongodb";
import { Error as MongooseError } from "mongoose";
import { ZodError } from "zod";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(ApiError.notFound(`No route for ${req.method} ${req.originalUrl}`));
}

/**
 * Single place that turns any thrown value into a JSON response.
 * Client errors keep their message; anything unrecognised is reported as a
 * generic 500 so internal details never reach the caller.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: err.message, details: err.details });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed",
      details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
    return;
  }

  if (err instanceof MongooseError.ValidationError) {
    res.status(400).json({
      error: "Validation failed",
      details: Object.values(err.errors).map((e) => ({ path: e.path, message: e.message })),
    });
    return;
  }

  if (err instanceof MongooseError.CastError) {
    res.status(400).json({ error: `Malformed value for "${err.path}"` });
    return;
  }

  if (err instanceof MongoServerError && err.code === 11000) {
    res.status(409).json({ error: "That value is already taken", details: err.keyValue });
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    ...(env.isProduction ? {} : { details: err instanceof Error ? err.message : String(err) }),
  });
}
