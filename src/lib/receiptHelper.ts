export interface ReceiptItem {
  name: string;
  quantity: number;
}

export interface ReceiptSettings {
  showLogo: boolean;
  showUser: boolean;
  showTimestamp: boolean;
}

// Center a string within a specific width
function centerText(text: string, width = 40): string {
  if (text.length >= width) return text.substring(0, width);
  const leftPadding = Math.floor((width - text.length) / 2);
  return " ".repeat(leftPadding) + text;
}

// Format a line with description on the left and value on the right
function formatLine(left: string, right: string, width = 40): string {
  const spaceCount = width - left.length - right.length;
  if (spaceCount <= 0) {
    const maxLeftLength = width - right.length - 1;
    return left.substring(0, maxLeftLength) + " " + right;
  }
  return left + " ".repeat(spaceCount) + right;
}

export function generateTextReceipt(
  items: ReceiptItem[],
  orderId: string,
  userId: string,
  userName: string,
  settings: ReceiptSettings,
  copyType: "canteen" | "gate"
): string {
  const W = 40; // Monospace receipt width in characters
  const lines: string[] = [];
  const dblLine = "=".repeat(W);
  const sglLine = "-".repeat(W);

  lines.push(dblLine);
  
  // Custom Heading instead of Company Name
  const heading = copyType === "canteen" ? "*** CANTEEN COPY ***" : "*** GATE COPY ***";
  lines.push(centerText(heading, W));
  lines.push(dblLine);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
  const timeStr = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

  if (settings.showTimestamp) {
    lines.push(`Date: ${dateStr} ${timeStr}`);
  }
  lines.push(`Order ID: ${orderId}`);
  
  if (settings.showUser) {
    lines.push(`Employee: ${userName} (${userId})`);
  }
  
  lines.push(sglLine);
  lines.push(formatLine("Item Description", "Qty", W));
  lines.push(sglLine);

  let totalQty = 0;
  for (const item of items) {
    lines.push(formatLine(item.name, item.quantity.toString(), W));
    totalQty += item.quantity;
  }

  lines.push(sglLine);
  lines.push(formatLine("TOTAL ITEMS", `${totalQty} units`, W));
  lines.push(dblLine);

  return lines.join("\n");
}

export function generateHtmlReceipt(
  items: ReceiptItem[],
  orderId: string,
  userId: string,
  userName: string,
  settings: ReceiptSettings,
  copyType: "canteen" | "gate"
): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
  const timeStr = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);

  const heading = copyType === "canteen" ? "*** CANTEEN COPY ***" : "*** GATE COPY ***";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${copyType.toUpperCase()} Receipt ${orderId}</title>
      <style>
        @media print {
          @page {
            margin: 0;
          }
          body {
            margin: 0;
          }
        }
        body {
          font-family: 'Courier New', Courier, monospace;
          background: #ffffff;
          color: #000000;
          padding: 15px;
          box-sizing: border-box;
        }
        .receipt-container {
          width: 280px;
          margin: 0 auto;
          font-size: 13px;
          line-height: 1.4;
        }
        .text-center {
          text-align: center;
        }
        .logo-placeholder {
          width: 80px;
          height: auto;
          margin: 0 auto 10px auto;
          display: block;
        }
        .title {
          font-weight: 900;
          font-size: 15px;
          margin: 4px 0;
          text-transform: uppercase;
        }
        .divider-dbl {
          border-bottom: 2px double #000;
          margin: 8px 0;
        }
        .divider-sgl {
          border-bottom: 1px dashed #000;
          margin: 8px 0;
        }
        .meta-row {
          margin: 3px 0;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 5px;
        }
        .items-table th {
          text-align: left;
          font-weight: bold;
          border-bottom: 1px dashed #000;
          padding-bottom: 4px;
        }
        .items-table td {
          padding: 4px 0;
          vertical-align: top;
        }
        .items-table .qty-col {
          text-align: right;
          width: 50px;
        }
        .total-row {
          font-weight: bold;
          display: flex;
          justify-content: space-between;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        ${
          settings.showLogo
            ? `<img src="https://www.dinshaws.co.in/assets/static/dinshaw-logo-white-text-png.PNG" class="logo-placeholder" style="background: #de251e; padding: 4px; border-radius: 4px;" alt="logo"/>`
            : ""
        }
        <div class="text-center title">${heading}</div>
        
        <div class="divider-dbl"></div>
        
        ${settings.showTimestamp ? `<div class="meta-row"><b>Date:</b> ${dateStr} ${timeStr}</div>` : ""}
        <div class="meta-row"><b>Order ID:</b> ${orderId}</div>
        ${
          settings.showUser
            ? `<div class="meta-row"><b>Employee:</b> ${userName} (${userId})</div>`
            : ""
        }
        
        <div class="divider-sgl"></div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th>Item Description</th>
              <th class="qty-col">Qty</th>
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (item) => `
              <tr>
                <td>${item.name}</td>
                <td class="qty-col">${item.quantity}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        
        <div class="divider-sgl"></div>
        
        <div class="total-row">
          <span>TOTAL ITEMS</span>
          <span>${totalQty} units</span>
        </div>
        
        <div class="divider-dbl"></div>
      </div>
    </body>
    </html>
  `;
}

export function downloadReceiptFile(textContent: string, orderId: string) {
  const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `receipt_${orderId}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function printReceiptHtml(htmlContent: string) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "absolute";
  iframe.style.width = "0px";
  iframe.style.height = "0px";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 250);
  } else {
    const win = window.open("", "_blank", "width=350,height=500");
    if (win) {
      win.document.write(htmlContent);
      win.document.close();
      win.focus();
      win.print();
      win.close();
    }
  }
}
