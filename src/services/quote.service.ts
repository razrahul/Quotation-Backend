import { Quote } from "../models/quote.model";
import { QuotePayload } from "../types/quotePayload";

export function calculateTotals(payload: QuotePayload) {
  const subTotal = payload.items.reduce((sum, item) => sum + item.qty * item.rate, 0);
  const gstAmount = payload.gst ? (subTotal * payload.gst.percentage) / 100 : 0;
  const discountAmount = payload.discount?.amount ?? 0;
  const grandTotal = subTotal + gstAmount - discountAmount;

  return {
    subTotal,
    gstAmount,
    discountAmount,
    grandTotal,
  };
}

export function normalizePayload(payload: QuotePayload): QuotePayload {
  const items = Array.isArray(payload.items)
    ? payload.items.map((item) => ({
        ...item,
        amount: item.qty * item.rate,
      }))
    : [];

  const { subTotal, gstAmount, discountAmount, grandTotal } = calculateTotals({
    ...payload,
    items,
  });

  return {
    ...payload,
    items,
    subTotal,
    grandTotal,
    gst: payload.gst
      ? {
          ...payload.gst,
          amount: gstAmount,
        }
      : undefined,
    discount: payload.discount
      ? {
          ...payload.discount,
          amount: discountAmount,
        }
      : undefined,
  };
}

export function validateQuoteInput({
  quoteNo,
  quoteDate,
  payload,
  requirePartyDetails = false,
}: {
  quoteNo?: string;
  quoteDate?: string;
  payload?: QuotePayload;
  requirePartyDetails?: boolean;
}) {
  if (!quoteNo) {
    return "Quotation number is required";
  }

  if (!quoteDate) {
    return "Quotation date is required";
  }

  if (!payload || !payload.items?.length) {
    return "Invalid quote payload";
  }

  if (requirePartyDetails && (!payload.company?.name || !payload.client?.name)) {
    return "Company and client details are required";
  }

  return null;
}

export function buildQuoteValues({
  quoteName,
  quoteNo,
  quoteDate,
  payload,
  status = "DRAFT",
  userId = null,
}: {
  quoteName?: string;
  quoteNo: string;
  quoteDate: string;
  payload: QuotePayload;
  status?: "DRAFT" | "FINAL";
  userId?: number | null;
}) {
  const normalizedPayload = normalizePayload(payload);
  const { grandTotal } = calculateTotals(normalizedPayload);

  return {
    quoteName,
    quoteNo,
    quoteDate: new Date(quoteDate),
    status,
    currency: "INR",
    totalAmount: String(grandTotal),
    payload: normalizedPayload,
    userId,
  };
}

export async function updateQuoteById({
  quote,
  quoteName,
  quoteNo,
  quoteDate,
  payload,
}: {
  quote: Quote;
  quoteName?: string;
  quoteNo: string;
  quoteDate: string;
  payload: QuotePayload;
}) {
  const nextValues = buildQuoteValues({
    quoteName,
    quoteNo,
    quoteDate,
    payload,
    status: quote.status,
    userId: quote.userId,
  });

  await quote.update(nextValues);
  await quote.reload();

  return quote;
}
