import { Request, Response } from "express";
import { Quote } from "../models/quote.model";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  renderQuoteHtml,
  generatePdfBufferFromHtml,
} from "../services/pdf.service";
import {
  buildQuoteValues,
  syncQuoteAssets,
  updateQuoteById,
  validateQuoteInput,
} from "../services/quote.service";
import DownloadLog from "../models/download.model";
import { success, error } from "../utils/response";
import { QuotePayload } from "../types/quotePayload";

function parseQuotePayload(rawPayload: unknown): QuotePayload | undefined {
  if (!rawPayload) {
    return undefined;
  }

  if (typeof rawPayload === "string") {
    return JSON.parse(rawPayload) as QuotePayload;
  }

  return rawPayload as QuotePayload;
}

function getQuoteFiles(req: Request) {
  const files = req.files as
    | {
        companyLogo?: Express.Multer.File[];
        signature?: Express.Multer.File[];
      }
    | undefined;

  return {
    companyLogo: files?.companyLogo,
    signature: files?.signature,
  };
}

/* ===============================
   Create Public Quote (Guest)
================================ */
export async function createQuote(req: AuthRequest, res: Response) {
  try {
    if(!req.userId) return error(res, "Login required", 401);

    const { quoteName, quoteNo, quoteDate } = req.body;
    const payload = parseQuotePayload(req.body.payload);
    const validationError = validateQuoteInput({ quoteNo, quoteDate, payload });
    //here company details and client details are not mandatory as user may just want to preview the quote without filling those details. Hence not passing requirePartyDetails flag
    if (validationError) {
      return error(res, validationError, 400);
    }

    const quote = await Quote.create(
      buildQuoteValues({
        quoteName,
        quoteNo,
        quoteDate,
        payload: payload as QuotePayload,
        status: "FINAL",
        userId: req.userId,
      })
    );
    await syncQuoteAssets(quote, payload as QuotePayload, getQuoteFiles(req));

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

export async function updateQuote(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) return error(res, "Login required", 401);

    const quote = await Quote.findByPk(Number(req.params.id));
    if (!quote) return error(res, "Quote not found", 404);

    if (quote.userId && quote.userId !== req.userId) {
      return error(res, "This quote does not belong to you", 403);
    }

    const { quoteName, quoteNo, quoteDate } = req.body;
    const payload = parseQuotePayload(req.body.payload);
    const validationError = validateQuoteInput({
      quoteNo,
      quoteDate,
      payload,
      requirePartyDetails: true,
    });

    if (validationError) {
      return error(res, validationError, 400);
    }

    if (!quote.userId) {
      quote.userId = req.userId;
    }

    const updatedQuote = await updateQuoteById({
      quote,
      quoteName,
      quoteNo,
      quoteDate,
      payload: payload as QuotePayload,
    });
    await syncQuoteAssets(updatedQuote, payload as QuotePayload, getQuoteFiles(req));

    return success(res, "Quote updated", updatedQuote);
  } catch (err: any) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return error(res, "Quotation number already exists", 409);
    }
    return error(res, err.message, 500);
  }
}

export async function finalizeQuote(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) return error(res, "Login required", 401);

    const { quoteName, quoteNo, quoteDate } = req.body;
    const payload = parseQuotePayload(req.body.payload);
    const validationError = validateQuoteInput({
      quoteNo,
      quoteDate,
      payload,
      requirePartyDetails: true,
    });

    if (validationError) {
      return error(res, validationError, 400);
    }

    const quote = await Quote.create(
      buildQuoteValues({
        quoteName,
        quoteNo,
        quoteDate,
        payload: payload as QuotePayload,
        status: "FINAL",
        userId: req.userId,
      })
    );
    await syncQuoteAssets(quote, payload as QuotePayload, getQuoteFiles(req));

    const html = await renderQuoteHtml(quote);
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
    if (err.name === "SequelizeUniqueConstraintError") {
      return error(res, "Quotation number already exists", 409);
    }
    return error(res, err.message, 500);
  }
}
