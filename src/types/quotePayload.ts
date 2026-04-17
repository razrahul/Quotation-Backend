export interface CompanyDetails {
  name: string;
  phone?: string;
  gstin?: string | null;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface ClientDetails {
  name: string;
  phone?: string;
  gstin?: string | null;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface QuoteItem {
  name: string;
  qty: number;
  unit: string;
  rate: number;
  amount: number;
}

export interface GstDetails {
  percentage: number;
  amount: number;
}

export interface DiscountDetails {
  type: "PERCENT" | "FLAT";
  value: number;
  amount: number;
}

export interface QuoteAssetPayload {
  name?: string;
  url?: string;
  dataUrl?: string;
  provider?: string;
  publicId?: string;
  public_id?: string;
}

export interface QuoteFieldPayload {
  label: string;
  value: string;
}

export interface QuoteDesignPayload {
  accentColor?: string;
  language?: string;
  headingFont?: string;
  bodyFont?: string;
  headingFontSize?: number;
  bodyFontSize?: number;
  paperSize?: "A4" | "Letter";
  marginPreset?: "compact" | "normal" | "wide";
  textScale?: "small" | "normal" | "large";
}

export interface QuoteTaxConfigPayload {
  taxType?: string;
  placeOfSupply?: string;
  gstMode?: "igst" | "cgst_sgst";
  reverseCharge?: boolean;
}

export interface QuotePayload {
  company: CompanyDetails;
  client: ClientDetails;
  items: QuoteItem[];
  gst?: GstDetails | null;
  discount?: DiscountDetails;
  subTotal: number;
  grandTotal: number;
  terms?: string;
  notes?: string;
  companyLogo?: QuoteAssetPayload | null;
  signature?: QuoteAssetPayload | null;
  headerFields?: QuoteFieldPayload[];
  additionalFields?: QuoteFieldPayload[];
  design?: QuoteDesignPayload;
  taxConfig?: QuoteTaxConfigPayload;
  meta?: {
    quotationDate?: string;
    dueDate?: string;
    validUntil?: string;
    showTotalInWords?: boolean;
    showTotalInWordsLabel?: string;
  };
}
