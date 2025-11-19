// src/controllers/quote.controller.ts
import { Request, Response } from "express";
import { Quote } from "../models";
import {
  renderQuoteHtml,
  generatePdfBufferFromHtml,
} from "../services/pdf.service";
import { AuthRequest } from "../middleware/auth.middleware";
import DownloadLog from "../models/download.model";
import { success, error } from "../utils/response";


// ===============================
// Create Public Quote (No Login)
// ===============================
export async function createQuote(req: Request, res: Response) {
  try {
    const { title, data } = req.body;
    if (!title || !data) return error(res, "Title and data are required", 400);

    // If client accidentally sent data as string, parse it.
    const payload = typeof data === "string" ? JSON.parse(data) : data;

    const q = await Quote.create({ title, payload, userId: null });
    return success(res, "Quote created successfully", q, 201);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

// ===============================
// Get Quote (Public)
// ===============================
// src/controllers/quote.controller.ts (getQuote snippet)
export async function getQuote(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    const q = await Quote.findByPk(id);

    if (!q) return error(res, "Quote not found", 404);

    // ensure payload is object
    const quoteObj = q.toJSON ? q.toJSON() : { ...q };
    if (typeof quoteObj.payload === "string") {
      try {
        quoteObj.payload = JSON.parse(quoteObj.payload);
      } catch (e) {
        // leave as-is if parse fails
      }
    }

    return success(res, "Quote fetched successfully", quoteObj);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

// =============================================
// Save Quote (Requires Login)
// -- userId assigned to quote
// =============================================
export async function saveQuoteForUser(req: AuthRequest, res: Response) {
  try {
    const uid = req.userId;
    if (!uid) return error(res, "Login required", 401);

    const { id } = req.params;
    const quote = await Quote.findByPk(Number(id));
    if (!quote) return error(res, "Quote not found", 404);

    // If already saved to same user, we still return success (idempotent)
    if (quote.userId === uid) {
      // noop
    } else {
      quote.userId = uid;
      await quote.save();
    }

    // safe toJSON and ensure payload is object
    const quoteObj: any = quote.toJSON ? quote.toJSON() : { ...quote };
    if (typeof quoteObj.payload === "string") {
      try {
        quoteObj.payload = JSON.parse(quoteObj.payload as string);
      } catch (err) {
        // parsing failed — leave as-is or set to empty object
        quoteObj.payload = quoteObj.payload;
      }
    }

    return success(res, "Quote saved to your account", quoteObj);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

// =============================================
// Download Quote (Requires Login)
// - If quote.userId == null → assign to user
// - If quote belongs to another user → block
// =============================================
export async function downloadQuote(req: AuthRequest, res: Response) {
  try {
    const uid = req.userId;
    if (!uid) return error(res, "Login required", 401);

    const id = Number(req.params.id);
    if (!id || Number.isNaN(id)) return error(res, "Invalid quote id", 400);

    // Atomically claim the quote if unowned to avoid race conditions
    const [affectedRows] = await Quote.update(
      { userId: uid },
      { where: { id, userId: null } }
    );

    // Fetch the fresh record
    const quote = await Quote.findByPk(id);
    if (!quote) return error(res, "Quote not found", 404);

    // If we didn't claim it just now, ensure it belongs to current user
    if (affectedRows === 0 && quote.userId !== uid) {
      return error(res, "This quote does not belong to you", 403);
    }

    // Ensure payload is a JS object for the template
    let payloadObj: any;
    const rawPayload = (quote as any).payload;
    if (typeof rawPayload === "string") {
      try {
        payloadObj = JSON.parse(rawPayload);
      } catch {
        payloadObj = { raw: rawPayload };
      }
    } else {
      payloadObj = rawPayload ?? {};
    }

    // Render HTML and create PDF buffer
    const html = renderQuoteHtml(quote.title, payloadObj);

    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await generatePdfBufferFromHtml(html);
    } catch (pdfErr: any) {
      console.error("PDF generation failed:", pdfErr);
      return error(
        res,
        "Failed to generate PDF",
        500,
        pdfErr?.message || pdfErr
      );
    }

    // Log download (best-effort)
    try {
      await DownloadLog.create({
        quoteId: quote.id,
        userId: uid,
        downloadedAt: new Date(),
      });
    } catch (logErr) {
      console.warn("Download log error (ignored):", logErr);
    }

    // Send PDF with correct headers (browser will download)
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="quote-${quote.id}.pdf"`
    );
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    return res.send(pdfBuffer);
  } catch (err: any) {
    console.error("downloadQuote unexpected error:", err);
    return error(res, err.message || "Server error", 500);
  }
}

// =============================================
// User Dashboard: List User Quotes
// =============================================
export async function userQuotesList(req: AuthRequest, res: Response) {
  try {
    const uid = req.userId;
    if (!uid) return error(res, "Login required", 401);

    const quotes = await Quote.findAll({
      where: { userId: uid },
      order: [["createdAt", "DESC"]],
    });

    return success(res, "Quotes fetched successfully", quotes);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

// =============================================
// User Dashboard: Download History
// =============================================
export async function userDownloadHistory(req: AuthRequest, res: Response) {
  try {
    const uid = req.userId;
    if (!uid) return error(res, "Login required", 401);

    const logs = await DownloadLog.findAll({
      where: { userId: uid },
      order: [["downloadedAt", "DESC"]],
    });

    return success(res, "Download history fetched successfully", logs);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}
