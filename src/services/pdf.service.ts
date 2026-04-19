import { existsSync } from "fs";
import * as puppeteer from "puppeteer";

const DEFAULT_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
];

function resolveChromeExecutablePath(): string | undefined {
  const configuredPath =
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    process.env.CHROME_BIN ||
    process.env.GOOGLE_CHROME_BIN;

  if (configuredPath && existsSync(configuredPath)) {
    return configuredPath;
  }

  try {
    const bundledPath = puppeteer.executablePath();
    if (bundledPath && existsSync(bundledPath)) {
      return bundledPath;
    }
  } catch (_) {}

  const fallbackPaths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/snap/bin/chromium",
  ];

  return fallbackPaths.find((candidatePath) => existsSync(candidatePath));
}

export async function generatePdfBufferFromHtml(html: string): Promise<Buffer> {
  let browser: puppeteer.Browser | null = null;

  try {
    const executablePath = resolveChromeExecutablePath();

    browser = await puppeteer.launch({
      headless: true,
      args: DEFAULT_ARGS,
      timeout: 60000,
      ...(executablePath ? { executablePath } : {}),
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 60000 });

    const pdfData = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
      preferCSSPageSize: true,
    });

    return Buffer.from(pdfData);
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (_) {}
    }
  }
}

function numberToWords(value: number) {
  const units = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const convertBelowThousand = (num: number): string => {
    if (num < 20) return units[num];
    if (num < 100) {
      return `${tens[Math.floor(num / 10)]}${num % 10 ? ` ${units[num % 10]}` : ""}`;
    }
    return `${units[Math.floor(num / 100)]} Hundred${num % 100 ? ` ${convertBelowThousand(num % 100)}` : ""}`;
  };

  if (value === 0) return "Zero Rupees Only";

  const parts: string[] = [];
  const crore = Math.floor(value / 10000000);
  const lakh = Math.floor((value % 10000000) / 100000);
  const thousand = Math.floor((value % 100000) / 1000);
  const hundred = value % 1000;

  if (crore) parts.push(`${convertBelowThousand(crore)} Crore`);
  if (lakh) parts.push(`${convertBelowThousand(lakh)} Lakh`);
  if (thousand) parts.push(`${convertBelowThousand(thousand)} Thousand`);
  if (hundred) parts.push(convertBelowThousand(hundred));

  return `${parts.join(" ").trim()} Rupees Only`;
}

export function renderQuoteHtml(quote: any) {
  const p = quote.payload || {};
  const items = p.items || [];
  const accent = p.design?.accentColor || "#0f4c81";
  const headingFont = p.design?.headingFont || "Open Sans";
  const bodyFont = p.design?.bodyFont || "Open Sans";
  const headingFontSize = p.design?.headingFontSize || 20;
  const bodyFontSize = p.design?.bodyFontSize || 14;
  const totalInWords =
    p.meta?.showTotalInWordsLabel ||
    numberToWords(Math.round(Number(p.grandTotal || 0)));

  const rows = items
    .map(
      (item: any, index: number) => `
      <tr>
        <td class="center">${index + 1}</td>
        <td>${escapeHtml(item.name)}</td>
        <td class="center">${item.qty}</td>
        <td class="center">${escapeHtml(item.unit || "")}</td>
        <td class="right">Rs. ${item.rate}</td>
        <td class="right">Rs. ${item.amount}</td>
      </tr>`
    )
    .join("");

  const headerFields = (p.headerFields || [])
    .map(
      (field: any) => `
      <div class="meta-row">
        <span>${escapeHtml(field.label || "Field")}</span>
        <strong>${escapeHtml(field.value || "-")}</strong>
      </div>`
    )
    .join("");

  const additionalFields = (p.additionalFields || [])
    .map(
      (field: any) => `
      <div class="field-pair">
        <span>${escapeHtml(field.label || "Field")}</span>
        <strong>${escapeHtml(field.value || "-")}</strong>
      </div>`
    )
    .join("");

  const companyLogo = p.companyLogo?.url || p.companyLogo?.dataUrl;
  const signature = p.signature?.url || p.signature?.dataUrl;

  return `
  <html>
    <head>
      <style>
        body {
          font-family: "${bodyFont}", "Segoe UI", Arial, sans-serif;
          font-size: ${bodyFontSize}px;
          color: #0f172a;
          padding: 0;
          margin: 0;
          background: #fff;
        }

        @page {
          size: A4;
          margin: 0;
        }

        .container {
          border: 1px solid rgba(15, 76, 129, 0.08);
          border-radius: 0;
          padding: 16px;
          background: linear-gradient(180deg, ${accent}10 0%, #ffffff 18%);
          box-sizing: border-box;
          min-height: 100vh;
        }

        .header {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 28px;
        }

        .logo-wrap img,
        .logo-fallback {
          width: 124px;
          height: 88px;
          object-fit: contain;
          border-radius: 16px;
          border: 1px solid rgba(15, 76, 129, 0.12);
          padding: 8px;
          box-sizing: border-box;
        }

        .logo-fallback {
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${accent};
          font-weight: 700;
        }

        .meta {
          width: 360px;
          margin-left: auto;
        }

        .title {
          font-family: "${headingFont}", "Segoe UI", Arial, sans-serif;
          font-size: ${headingFontSize + 10}px;
          font-weight: 700;
          color: #10233e;
          margin: 0 0 12px;
          text-align: right;
        }

        .meta-row {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          padding: 8px 0;
          border-bottom: 1px solid rgba(15, 76, 129, 0.08);
        }

        .meta-row span {
          color: #64748b;
          font-size: 12px;
        }

        .meta-row strong {
          font-size: 13px;
        }

        .party-grid {
          display: flex;
          gap: 18px;
          margin: 24px 0;
        }

        .party-card {
          flex: 1;
          border: 1px solid rgba(15, 76, 129, 0.12);
          border-radius: 6px;
          padding: 16px;
          background: #fff;
        }

        .party-card h4 {
          margin: 0 0 10px;
          color: #fff;
          background: ${accent};
          padding: 10px 12px;
          border-radius: 4px;
          font-family: "${headingFont}", "Segoe UI", Arial, sans-serif;
          font-size: ${headingFontSize - 4}px;
        }

        .party-card p {
          margin: 5px 0;
          line-height: 1.45;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          overflow: hidden;
          border-radius: 16px;
        }

        th {
          background: ${accent};
          color: white;
          padding: 12px 10px;
          text-align: center;
          font-size: 13px;
        }

        td {
          text-align: center;
          border-bottom: 1px solid rgba(15, 76, 129, 0.08);
          padding: 10px;
          font-size: 13px;
        }

        tbody tr:nth-child(even) td {
          background: ${accent}08;
        }

        .center {
          text-align: center;
        }

        .right {
          text-align: center;
        }

        .bottom {
          display: flex;
          gap: 18px;
          margin-top: 24px;
        }

        .left-stack {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .panel,
        .summary,
        .additional,
        .signature {
          border: 1px solid rgba(15, 76, 129, 0.12);
          border-radius: 8px;
          padding: 14px;
          background: #fff;
        }

        .panel h5,
        .additional h5 {
          margin: 0 0 8px;
          color: #17304f;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .panel p {
          margin: 4px 0;
          color: #475569;
          font-size: 12px;
        }

        .summary {
          width: 260px;
          margin-left: auto;
          background: ${accent}08;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 7px 0;
        }

        .summary-row.total {
          border-top: 2px solid #111827;
          margin-top: 10px;
          padding-top: 10px;
          font-weight: 700;
          font-size: 16px;
        }

        .words {
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px dashed rgba(15, 76, 129, 0.14);
        }

        .words span {
          display: block;
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
        }

        .words strong {
          font-size: 12px;
          line-height: 1.5;
        }

        .footer {
          display: flex;
          gap: 16px;
          margin-top: 18px;
        }

        .additional {
          flex: 1;
        }

        .field-pair {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          padding: 5px 0;
        }

        .field-pair span {
          color: #64748b;
          font-size: 12px;
        }

        .field-pair strong {
          font-size: 12px;
        }

        .signature {
          width: 190px;
          text-align: center;
        }

        .signature span {
          display: block;
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .signature img {
          width: 120px;
          height: 64px;
          object-fit: contain;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-wrap">
            ${
              companyLogo
                ? `<img src="${companyLogo}" alt="Company logo" />`
                : `<div class="logo-fallback">Logo</div>`
            }
          </div>

          <div class="meta">
            <h1 class="title">${escapeHtml(quote.quoteName || "Quotation")}</h1>
            <div class="meta-row"><span>Quotation No</span><strong>${escapeHtml(quote.quoteNo)}</strong></div>
            <div class="meta-row"><span>Quotation Date</span><strong>${escapeHtml(String(quote.quoteDate))}</strong></div>
            ${
              p.meta?.validUntil
                ? `<div class="meta-row"><span>Valid Till Date</span><strong>${escapeHtml(p.meta.validUntil)}</strong></div>`
                : ""
            }
            ${headerFields}
          </div>
        </div>

        <div class="party-grid">
          <div class="party-card">
            <h4>Your Details</h4>
            <p><strong>${escapeHtml(p.company?.name || "")}</strong></p>
            <p>Country: ${escapeHtml(p.company?.country || "-")}</p>
            <p>Phone: ${escapeHtml(p.company?.phone || "-")}</p>
            <p>GSTIN: ${escapeHtml(p.company?.gstin || "-")}</p>
            <p>Address: ${escapeHtml(p.company?.address || "-")}</p>
            <p>City: ${escapeHtml(p.company?.city || "-")} | State: ${escapeHtml(p.company?.state || "-")}</p>
          </div>

          <div class="party-card">
            <h4>Client Details</h4>
            <p><strong>${escapeHtml(p.client?.name || "")}</strong></p>
            <p>Country: ${escapeHtml(p.client?.country || "-")}</p>
            <p>Phone: ${escapeHtml(p.client?.phone || "-")}</p>
            <p>GSTIN: ${escapeHtml(p.client?.gstin || "-")}</p>
            <p>Address: ${escapeHtml(p.client?.address || "-")}</p>
            <p>City: ${escapeHtml(p.client?.city || "-")} | State: ${escapeHtml(p.client?.state || "-")}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width:50px;">Sr.</th>
              <th>Item</th>
              <th style="width:80px;">Qty</th>
              <th style="width:90px;">Unit</th>
              <th style="width:110px;">Rate</th>
              <th style="width:120px;">Amount</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div class="bottom">
          <div class="left-stack">
            ${
              p.taxConfig
                ? `
              <div class="panel">
                <h5>Tax Configuration</h5>
                <p>Tax Type: ${escapeHtml(p.taxConfig.taxType || "-")}</p>
                <p>Place of Supply: ${escapeHtml(p.taxConfig.placeOfSupply || "-")}</p>
                <p>GST Type: ${p.taxConfig.gstMode === "cgst_sgst" ? "CGST & SGST" : "IGST"}</p>
                <p>Reverse Charge: ${p.taxConfig.reverseCharge ? "Applicable" : "No"}</p>
              </div>`
                : ""
            }
            ${
              p.notes
                ? `<div class="panel"><h5>Notes</h5><p>${escapeHtml(p.notes)}</p></div>`
                : ""
            }
            ${
              p.terms
                ? `<div class="panel"><h5>Terms & Conditions</h5><p>${escapeHtml(p.terms)}</p></div>`
                : ""
            }
          </div>

          <div class="summary">
            <div class="summary-row"><span>Sub Total</span><span>Rs. ${p.subTotal}</span></div>
            ${
              p.gst
                ? `<div class="summary-row"><span>GST (${p.gst.percentage}%)</span><span>Rs. ${p.gst.amount}</span></div>`
                : ""
            }
            <div class="summary-row total"><span>Total</span><span>Rs. ${p.grandTotal}</span></div>
            ${
              p.meta?.showTotalInWords
                ? `<div class="words"><span>Total In Words</span><strong>${escapeHtml(totalInWords)}</strong></div>`
                : ""
            }
          </div>
        </div>

        ${
          additionalFields || signature
            ? `
          <div class="footer">
            ${
              additionalFields
                ? `<div class="additional"><h5>Additional Info</h5>${additionalFields}</div>`
                : ""
            }
            ${
              signature
                ? `<div class="signature"><span>Authorized Signature</span><img src="${signature}" alt="Signature" /></div>`
                : ""
            }
          </div>`
            : ""
        }
      </div>
    </body>
  </html>
  `;
}

function escapeHtml(value: string) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
