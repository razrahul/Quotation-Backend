// src/routes/quote.routes.ts
import { Router } from "express";
import {
  createQuote,
  getQuote,
  saveQuoteForUser,
  downloadQuote,
  userQuotesList,
  finalizeQuote,
  updateQuote,
} from "../controllers/quote.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { quoteUploadFields } from "../middleware/upload.middleware";

const router = Router();

router.post("/",requireAuth, quoteUploadFields, createQuote);             // create/preview public
router.get("/:id", getQuote);              // preview
router.post("/:id/save", requireAuth, saveQuoteForUser); // attach to user
router.get("/:id/download", requireAuth, downloadQuote); // protected download
router.put("/:id", requireAuth, quoteUploadFields, updateQuote); // update existing quote

//finalize quote
router.post("/finalize", requireAuth, quoteUploadFields, finalizeQuote);

// dashboard endpoints
router.get("/user/me/list", requireAuth, userQuotesList);

export default router;
