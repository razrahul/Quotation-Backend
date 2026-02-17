import { Request, Response } from "express";
import { Quote } from "../models/quote.model";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  renderQuoteHtml,
  generatePdfBufferFromHtml,
} from "../services/pdf.service";
import DownloadLog from "../models/download.model";
import { success, error } from "../utils/response";
import { QuotePayload } from "../types/quotePayload";

/* ===============================
   Helpers
================================ */

// Backend-side total calculation (NEVER trust frontend)
function calculateTotals(payload: QuotePayload) {
  const subTotal = payload.items.reduce((sum, i) => sum + i.qty * i.rate, 0);

  const gstAmount = payload.gst ? (subTotal * payload.gst.percentage) / 100 : 0;

  const discountAmount = payload.discount?.amount ?? 0;

  const grandTotal = subTotal + gstAmount - discountAmount;

  return {
    subTotal,
    grandTotal,
  };
}

/* ===============================
   Create Public Quote (Guest)
================================ */
export async function createQuote(req: Request, res: Response) {
  try {
    const { quoteNo, quoteDate, payload } = req.body;

    if (!quoteNo) {
      return error(res, "Quotation number is required", 400);
    }

    if (!quoteDate) {
      return error(res, "Quotation date is required", 400);
    }

    if (!payload || !payload.items?.length) {
      return error(res, "Invalid quote payload", 400);
    }

    const { grandTotal } = calculateTotals(payload);

    const quote = await Quote.create({
      quoteNo,
      quoteDate, // 👈 USER PROVIDED DATE
      status: "DRAFT",
      currency: "INR",
      totalAmount: String(grandTotal),
      payload,
      userId: null,
    });

    return success(res, "Quote created", quote, 201);
  } catch (err: any) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return error(res, "Quotation number already exists", 409);
    }
    return error(res, err.message, 500);
  }
}

/* ===============================
   Get Quote (Public Preview)
================================ */
export async function getQuote(req: Request, res: Response) {
  try {
    const quote = await Quote.findByPk(Number(req.params.id));
    if (!quote) return error(res, "Quote not found", 404);

    const data = quote.toJSON();
    
    if (typeof data.payload === "string") {
      data.payload = JSON.parse(data.payload);
    }

    return success(res, "Quote fetched", quote);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

/* ===============================
   Save Quote (Login required)
================================ */
export async function saveQuoteForUser(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) return error(res, "Login required", 401);

    const quote = await Quote.findByPk(Number(req.params.id));
    if (!quote) return error(res, "Quote not found", 404);

    if (quote.userId && quote.userId !== req.userId) {
      return error(res, "Access denied", 403);
    }

    quote.userId = req.userId;
    await quote.save();

    return success(res, "Quote saved to account", quote);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

/* ===============================
   Download Quote (FINAL)
================================ */
export async function downloadQuote(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) return error(res, "Login required", 401);

    const quote = await Quote.findByPk(Number(req.params.id));
    if (!quote) return error(res, "Quote not found", 404);

    if (quote.userId && quote.userId !== req.userId) {
      return error(res, "This quote does not belong to you", 403);
    }

    // Claim quote if guest
    if (!quote.userId) {
      quote.userId = req.userId;
    }

    quote.status = "FINAL";
    await quote.save();

    const html = renderQuoteHtml(quote);
    const pdfBuffer = await generatePdfBufferFromHtml(html);

    await DownloadLog.create({
      quoteId: quote.id,
      userId: req.userId,
      downloadedAt: new Date(),
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${quote.quoteNo}.pdf"`
    );

    return res.send(pdfBuffer);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}

/* ===============================
   User Dashboard
================================ */
export async function userQuotesList(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) return error(res, "Login required", 401);

    const quotes = await Quote.findAll({
      where: { userId: req.userId },
      order: [["createdAt", "DESC"]],
    });

    return success(res, "Quotes fetched", quotes);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}


export async function finalizeQuote(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) return error(res, "Login required", 401);

    const { quoteNo, quoteDate, payload } = req.body;

    const { grandTotal } = calculateTotals(payload);

    const quote = await Quote.create({
      quoteNo,
      quoteDate,
      status: "FINAL",
      currency: "INR",
      totalAmount: String(grandTotal),
      payload,
      userId: req.userId,
    });

    const html = renderQuoteHtml(quote);
    const pdfBuffer = await generatePdfBufferFromHtml(html);

    await DownloadLog.create({
      quoteId: quote.id,
      userId: req.userId,
      downloadedAt: new Date(),
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${quote.quoteNo}.pdf"`
    );

    return res.send(pdfBuffer);
  } catch (err: any) {
    return error(res, err.message, 500);
  }
}
