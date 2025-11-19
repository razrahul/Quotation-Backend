// src/services/pdf.service.ts
import * as puppeteer from "puppeteer";

// safe args for headless chromium
const DEFAULT_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
];

export async function generatePdfBufferFromHtml(html: string): Promise<Buffer> {
  let browser: puppeteer.Browser | null = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: DEFAULT_ARGS,
      timeout: 60000
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });

    await page.setContent(html, { waitUntil: "networkidle0", timeout: 60000 });

    // pdf() returns Uint8Array in Puppeteer v21+
    const pdfData = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", right: "15mm", bottom: "20mm", left: "15mm" }
    });

    const buffer = Buffer.from(pdfData); // convert to Node Buffer
    return buffer;

  } finally {
    if (browser) {
      try { await browser.close(); } catch (_) {}
    }
  }
}


export function renderQuoteHtml(title: string, data: any) {
  // defensive parse if data is still string
  let bodyData: any;
  if (typeof data === "string") {
    try {
      bodyData = JSON.parse(data);
    } catch {
      bodyData = { raw: data };
    }
  } else {
    bodyData = data || {};
  }

  const items = Array.isArray(bodyData.items) ? bodyData.items : [];
  const itemsHtml = items
    .map(
      (it: any) => `<tr>
    <td>${escapeHtml(String(it.desc ?? ""))}</td>
    <td style="text-align:center">${escapeHtml(String(it.qty ?? ""))}</td>
    <td style="text-align:right">${escapeHtml(String(it.price ?? ""))}</td>
  </tr>`
    )
    .join("");

  const total = items.reduce(
    (s: number, it: any) => s + Number(it.qty || 0) * Number(it.price || 0),
    0
  );

  return `<!doctype html>
  <html>
    <head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
      <style>
        body{font-family:Arial;padding:24px;color:#111;font-size:14px}
        h1{text-align:center}
        .meta{color:#666;text-align:center;margin-bottom:16px}
        table{width:100%;border-collapse:collapse;margin-top:16px}
        th,td{border:1px solid #eee;padding:10px}
        thead th{background:#f7f7f7;text-align:left}
        .right{text-align:right}
        tfoot td{font-weight:700}
      </style>
    </head>
    <body>
      <h1>${escapeHtml(title || "Quotation")}</h1>
      <div class="meta">Generated: ${new Date().toLocaleString()}</div>
      <table>
        <thead>
          <tr><th>Description</th><th style="width:80px;text-align:center">Qty</th><th style="width:120px;text-align:right">Price</th></tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot><tr><td colspan="2">Total</td><td class="right">${total}</td></tr></tfoot>
      </table>
    </body>
  </html>`;
}

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// const resp = await api.get(`/quotes/${quoteId}/download`, { responseType: "blob" });
// const url = window.URL.createObjectURL(new Blob([resp.data], { type: "application/pdf" }));
// const a = document.createElement("a");
// a.href = url;
// a.download = `quote-${quoteId}.pdf`;
// document.body.appendChild(a);
// a.click();
// a.remove();
// URL.revokeObjectURL(url);
