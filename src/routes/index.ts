import { Router } from "express";
import rateLimit from "express-rate-limit";
import { changePassword, login, me } from "../controllers/auth.controller.js";
import {
  getPage,
  listPages,
  updatePage,
  updateSection,
} from "../controllers/pages.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/** Tight limit on credential submission; everything else uses the app-wide one. */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many login attempts. Try again in 15 minutes." },
});

export const router = Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// ---- auth ----
router.post("/auth/login", loginLimiter, asyncHandler(login));
router.get("/auth/me", requireAuth, asyncHandler(me));
router.post("/auth/change-password", requireAuth, asyncHandler(changePassword));

// ---- content ----
// Reads are public so the site can fetch without a token; writes need auth.
router.get("/pages", asyncHandler(listPages));
router.get("/pages/:slug", asyncHandler(getPage));
router.put("/pages/:slug", requireAuth, asyncHandler(updatePage));
router.patch("/pages/:slug/sections/:key", requireAuth, asyncHandler(updateSection));
