// src/routes/quote.routes.ts
import { Router } from "express";
import {
  createQuote,
  getQuote,
  saveQuoteForUser,
  downloadQuote,
  userQuotesList,
  userDownloadHistory
} from "../controllers/quote.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/", createQuote);             // create/preview public
router.get("/:id", getQuote);              // preview
router.post("/:id/save", requireAuth, saveQuoteForUser); // attach to user
router.get("/:id/download", requireAuth, downloadQuote); // protected download

// dashboard endpoints
router.get("/user/me/list", requireAuth, userQuotesList);
router.get("/user/me/downloads", requireAuth, userDownloadHistory);

export default router;
