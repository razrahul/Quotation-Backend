import { Quote } from "../models/quote.model";
import QuoteAsset from "../models/quoteAsset.model";
import { QuotePayload } from "../types/quotePayload";
const {
  uploadQuoteAssetToCloudinary,
  deleteCloudinaryAsset,
} = require("./cloudinary.service");

type UploadedQuoteFiles = {
  companyLogo?: Express.Multer.File[];
  signature?: Express.Multer.File[];
};

function normalizeAssetPayload(
  asset?: QuotePayload["companyLogo"] | QuotePayload["signature"] | null
) {
  if (!asset?.url || !(asset.publicId || asset.public_id)) {
    return null;
  }

  const publicId = asset.publicId || asset.public_id;

  return {
    name: asset.name || "asset",
    url: asset.url,
    provider: asset.provider || "cloudinary",
    publicId,
    public_id: publicId,
  };
}

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

export async function syncQuoteAssets(
  quote: Quote,
  payload: QuotePayload,
  files?: UploadedQuoteFiles
) {
  const existingAssets = await QuoteAsset.findAll({ where: { quoteId: quote.id } });
  const existingByKind = new Map(existingAssets.map((asset) => [asset.kind, asset]));

  const nextCompanyLogo = normalizeAssetPayload(payload.companyLogo);
  const nextSignature = normalizeAssetPayload(payload.signature);

  const companyLogoFile = files?.companyLogo?.[0];
  const signatureFile = files?.signature?.[0];

  const uploadedLogo = companyLogoFile
    ? await uploadQuoteAssetToCloudinary(companyLogoFile, "company-logo")
    : null;
  const uploadedSignature = signatureFile
    ? await uploadQuoteAssetToCloudinary(signatureFile, "signature")
    : null;

  const finalAssets = {
    companyLogo: uploadedLogo
      ? {
          name: companyLogoFile?.originalname || payload.companyLogo?.name || "company-logo",
          url: uploadedLogo.url,
          provider: uploadedLogo.provider,
          publicId: uploadedLogo.publicId,
          public_id: uploadedLogo.publicId,
        }
      : nextCompanyLogo,
    signature: uploadedSignature
      ? {
          name: signatureFile?.originalname || payload.signature?.name || "signature",
          url: uploadedSignature.url,
          provider: uploadedSignature.provider,
          publicId: uploadedSignature.publicId,
          public_id: uploadedSignature.publicId,
        }
      : nextSignature,
  };

  const assetsToDelete = [
    { kind: "logo" as const, existing: existingByKind.get("logo"), next: finalAssets.companyLogo },
    {
      kind: "signature" as const,
      existing: existingByKind.get("signature"),
      next: finalAssets.signature,
    },
  ].filter(
    ({ existing, next }) =>
      existing?.publicId && (!next || next.publicId !== existing.publicId)
  );

  await QuoteAsset.destroy({ where: { quoteId: quote.id } });

  for (const asset of assetsToDelete) {
    await deleteCloudinaryAsset(asset.existing?.publicId);
  }

  const assetEntries = [
    { kind: "logo" as const, asset: finalAssets.companyLogo },
    { kind: "signature" as const, asset: finalAssets.signature },
  ].filter((entry) => entry.asset?.url && entry.asset?.publicId);

  const nextPayload = {
    ...payload,
    companyLogo: finalAssets.companyLogo,
    signature: finalAssets.signature,
  } as QuotePayload;

  await quote.update({ payload: { ...quote.payload, ...nextPayload } as QuotePayload });

  if (assetEntries.length) {
    await QuoteAsset.bulkCreate(
      assetEntries.map(({ kind, asset }) => ({
        quoteId: quote.id,
        kind,
        provider: asset?.provider || "cloudinary",
        url: asset?.url || "",
        publicId: asset?.publicId || asset?.public_id || "",
        metadata: asset
          ? {
              name: asset.name,
            }
          : null,
      }))
    );
  }
}
