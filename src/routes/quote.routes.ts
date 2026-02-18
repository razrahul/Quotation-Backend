// src/routes/quote.routes.ts
import { Router } from "express";
import {
  createQuote,
  getQuote,
  saveQuoteForUser,
  downloadQuote,
  userQuotesList,
  finalizeQuote
} from "../controllers/quote.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/", createQuote);             // create/preview public
router.get("/:id", getQuote);              // preview
router.post("/:id/save", requireAuth, saveQuoteForUser); // attach to user
router.get("/:id/download", requireAuth, downloadQuote); // protected download

//finalize quote
router.post("/finalize", requireAuth, finalizeQuote);

// dashboard endpoints
router.get("/user/me/list", requireAuth, userQuotesList);

export default router;
