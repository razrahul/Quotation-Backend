/* ================= COMPANY ================= */
export interface CompanyDetails {
  name: string;                 // required
  phone?: string;
  gstin?: string | null;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

/* ================= CLIENT ================= */
export interface ClientDetails {
  name: string;                 // required
  phone?: string;
  gstin?: string | null;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

/* ================= ITEM ================= */
export interface QuoteItem {
  name: string;                 // Item / Service name
  qty: number;                  // Quantity
  unit: string;                 // Nos / Service / Hrs
  rate: number;                 // Per unit
  amount: number;               // qty * rate
}

/* ================= TAX ================= */
export interface GstDetails {
  percentage: number;           // 18
  amount: number;               // calculated
}

/* ================= DISCOUNT ================= */
export interface DiscountDetails {
  type: "PERCENT" | "FLAT";
  value: number;
  amount: number;
}

/* ================= MAIN PAYLOAD ================= */
export interface QuotePayload {
  company: CompanyDetails;
  client: ClientDetails;
  items: QuoteItem[];

  gst?: GstDetails;
  discount?: DiscountDetails;

  subTotal: number;
  grandTotal: number;

  terms?: string;
  notes?: string;

  meta?: {
    quotationDate?: string;
    dueDate?: string;
  };
}
