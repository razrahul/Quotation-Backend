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
      timeout: 60000,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });

    await page.setContent(html, { waitUntil: "networkidle0", timeout: 60000 });

    // pdf() returns Uint8Array in Puppeteer v21+
    const pdfData = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", right: "15mm", bottom: "20mm", left: "15mm" },
    });

    const buffer = Buffer.from(pdfData); // convert to Node Buffer
    return buffer;
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (_) {}
    }
  }
}

// export function renderQuoteHtml(title: string, data: any) {
//   // defensive parse if data is still string
//   let bodyData: any;
//   if (typeof data === "string") {
//     try {
//       bodyData = JSON.parse(data);
//     } catch {
//       bodyData = { raw: data };
//     }
//   } else {
//     bodyData = data || {};
//   }

//   const items = Array.isArray(bodyData.items) ? bodyData.items : [];
//   const itemsHtml = items
//     .map(
//       (it: any) => `<tr>
//     <td>${escapeHtml(String(it.desc ?? ""))}</td>
//     <td style="text-align:center">${escapeHtml(String(it.qty ?? ""))}</td>
//     <td style="text-align:right">${escapeHtml(String(it.price ?? ""))}</td>
//   </tr>`
//     )
//     .join("");

//   const total = items.reduce(
//     (s: number, it: any) => s + Number(it.qty || 0) * Number(it.price || 0),
//     0
//   );

//   return `<!doctype html>
//   <html>
//     <head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
//       <style>
//         body{font-family:Arial;padding:24px;color:#111;font-size:14px}
//         h1{text-align:center}
//         .meta{color:#666;text-align:center;margin-bottom:16px}
//         table{width:100%;border-collapse:collapse;margin-top:16px}
//         th,td{border:1px solid #eee;padding:10px}
//         thead th{background:#f7f7f7;text-align:left}
//         .right{text-align:right}
//         tfoot td{font-weight:700}
//       </style>
//     </head>
//     <body>
//       <h1>${escapeHtml(title || "Quotation")}</h1>
//       <div class="meta">Generated: ${new Date().toLocaleString()}</div>
//       <table>
//         <thead>
//           <tr><th>Description</th><th style="width:80px;text-align:center">Qty</th><th style="width:120px;text-align:right">Price</th></tr>
//         </thead>
//         <tbody>${itemsHtml}</tbody>
//         <tfoot><tr><td colspan="2">Total</td><td class="right">${total}</td></tr></tfoot>
//       </table>
//     </body>
//   </html>`;
// }

export function renderQuoteHtml(quote: any) {
  const p = quote.payload;
  const items = p.items || [];

  const rows = items
    .map(
      (i: any, index: number) => `
      <tr>
        <td class="center">${index + 1}</td>
        <td>${escapeHtml(i.name)}</td>
        <td class="center">${i.qty}</td>
        <td class="center">${escapeHtml(i.unit || "")}</td>
        <td class="right">₹ ${i.rate}</td>
        <td class="right">₹ ${i.amount}</td>
      </tr>`
    )
    .join("");

  return `
  <html>
  <head>
    <style>
      body {
        font-family: "Segoe UI", Arial, sans-serif;
        font-size: 14px;
        color: #0f172a;
        padding: 20px 25px; /* more left-right spacing */
      }

      .container {
        width: 100%;
      }

      /* ===== HEADER ===== */
      .header {
        margin-bottom: 30px;
      }

      .title {
        font-size: 26px;
        font-weight: 700;
        color: #1d4f7a;
      }

      .info {
        margin-top: 6px;
        color: #334155;
      }

      /* ===== PARTY GRID ===== */
      .party-grid {
        display: flex;
        gap: 25px;
        margin: 30px 0;
      }

      .party-card {
        flex: 1;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 16px;
        background: #fafafa;
      }

      .party-card h4 {
        margin-bottom: 8px;
        color: #1d4f7a;
        font-size: 15px;
      }

      .party-card p {
        margin: 2px 0;
        line-height: 1.4;
      }

      /* ===== TABLE ===== */
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 15px;
      }

      th {
        background: #1d4f7a;
        color: white;
        padding: 10px 8px;
        text-align: left;
        font-size: 13px;
      }

      td {
        border: 1px solid #e5e7eb; /* only bottom border */
        padding: 9px 8px;
        font-size: 13px;
      }

      tr:nth-child(even) td {
        background: #f8fafc;
      }

      .center {
        text-align: center;
      }

      .right {
        text-align: right;
      }

      /* ===== SUMMARY ===== */
      .summary {
        margin-top: 35px; /* more gap from table */
        width: 260px;
        margin-left: auto;
      }

      .summary-row {
        display: flex;
        justify-content: space-between;
        padding: 7px 0;
        font-size: 14px;
      }

      .summary-row.total {
        border-top: 2px solid #111;
        margin-top: 10px;
        padding-top: 12px;
        font-weight: 700;
        font-size: 16px;
      }


      /* ===== FOOTER SPACE ===== */
      .spacer {
        height: 20px;
      }
    </style>
  </head>
  <body>
    <div class="container">

      <div class="header">
        <div class="title">${quote.quoteName}</div>
        <div class="info">No: ${quote.quoteNo}</div>
        <div class="info">Date: ${quote.quoteDate}</div>
      </div>

      <div class="party-grid">
        <div class="party-card">
          <h4>Your Details</h4>
          <p><strong>${escapeHtml(p.company.name)}</strong></p>
          <p>${escapeHtml(p.company.address || "")}</p>
          <p>${escapeHtml(p.company.city || "")}, ${escapeHtml(p.company.state || "")}</p>
          <p>${escapeHtml(p.company.phone || "")}</p>
        </div>

        <div class="party-card">
          <h4>Client Details</h4>
          <p><strong>${escapeHtml(p.client.name)}</strong></p>
          <p>${escapeHtml(p.client.address || "")}</p>
          <p>${escapeHtml(p.client.city || "")}, ${escapeHtml(p.client.state || "")}</p>
          <p>${escapeHtml(p.client.phone || "")}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width:50px;">Sr.</th>
            <th>Item</th>
            <th style="width:80px;">Qty</th>
            <th style="width:90px;">Unit</th>
            <th style="width:100px;">Rate</th>
            <th style="width:120px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <div class="summary">
        <div class="summary-row">
          <span>Sub Total</span>
          <span>₹ ${p.subTotal}</span>
        </div>

        ${
          p.gst
            ? `
          <div class="summary-row">
            <span>GST (${p.gst.percentage}%)</span>
            <span>₹ ${p.gst.amount}</span>
          </div>
        `
            : ""
        }

        <div class="summary-row total">
          <span>Total</span>
          <span>₹ ${p.grandTotal}</span>
        </div>
      </div>

       <div class="spacer"></div>
    </div>
  </body>
  </html>
  `;
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
