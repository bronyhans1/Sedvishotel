export type ReceiptBranding = {
  hotelName?: string;
  logoUrl?: string | null;
  primaryColor?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  headerMessage?: string;
  footerMessage?: string;
  thankYouMessage?: string;
  showLogo?: boolean;
  showQrCode?: boolean;
  taxNumber?: string;
  registrationNumber?: string;
  paperSize?: "a4" | "thermal_80mm" | "thermal_58mm";
};

export function getReceiptPrintLabel(printCount: number): string {
  if (printCount <= 1) return "Original";
  return `REPRINT #${printCount - 1}`;
}

export function buildReceiptPrintBadge(printCount: number): string {
  const label = getReceiptPrintLabel(printCount);
  return `<p class="print-badge" style="font-size:0.75rem;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:#64748b;margin:0 0 0.5rem;">${escapeReceiptHtml(label)}</p>`;
}

export function escapeReceiptHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatReceiptDateTime(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatReceiptDate(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function buildReceiptLogoBlock(
  branding: ReceiptBranding | undefined,
  hotelName: string
): string {
  const accent = branding?.primaryColor ?? "#1e3a5f";
  const safeName = escapeReceiptHtml(hotelName);
  if (branding?.logoUrl) {
    return `<img src="${escapeReceiptHtml(branding.logoUrl)}" alt="${safeName}" style="height:48px;object-fit:contain" />`;
  }
  return `<div style="width:48px;height:48px;border-radius:8px;background:${accent};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;">${safeName.charAt(0)}</div>`;
}

export function buildReceiptHeaderBlock(
  branding: ReceiptBranding | undefined,
  subtitle: string
): string {
  const hotelName = escapeReceiptHtml(branding?.hotelName ?? "SEDVIS HOTEL");
  const accent = branding?.primaryColor ?? "#1e3a5f";
  const contactLines = [
    branding?.address
      ? `<p class="muted">${escapeReceiptHtml(branding.address)}</p>`
      : "",
    branding?.phone
      ? `<p class="muted">${escapeReceiptHtml(branding.phone)}</p>`
      : "",
    branding?.email
      ? `<p class="muted">${escapeReceiptHtml(branding.email)}</p>`
      : "",
    branding?.website
      ? `<p class="muted">${escapeReceiptHtml(branding.website)}</p>`
      : "",
    branding?.taxNumber
      ? `<p class="muted">TIN: ${escapeReceiptHtml(branding.taxNumber)}</p>`
      : "",
    branding?.registrationNumber
      ? `<p class="muted">Reg: ${escapeReceiptHtml(branding.registrationNumber)}</p>`
      : "",
  ]
    .filter(Boolean)
    .join("");

  const headerMessage = branding?.headerMessage
    ? `<p class="muted" style="margin-top:0.25rem">${escapeReceiptHtml(branding.headerMessage)}</p>`
    : "";

  return `<div class="header">
    ${buildReceiptLogoBlock(branding, branding?.hotelName ?? "SEDVIS HOTEL")}
    <div>
      <h1 style="color:${accent}">${hotelName}</h1>
      ${contactLines}
      ${headerMessage}
      <p class="muted">${escapeReceiptHtml(subtitle)}</p>
    </div>
  </div>`;
}

export const RECEIPT_BASE_STYLES = `
  @media print { body { margin: 0; padding: 0.75rem; } }
  body { font-family: system-ui, sans-serif; padding: 1.5rem; max-width: 420px; margin: 0 auto; font-size: 14px; color: #111; }
  .header { display:flex; gap:12px; align-items:center; border-bottom:1px solid #ddd; padding-bottom:12px; margin-bottom:12px; }
  h1 { font-size: 1.1rem; margin: 0; }
  h2 { font-size: 0.95rem; margin: 0 0 8px; }
  .muted { color: #666; font-size: 0.85rem; margin: 2px 0; }
  .meta p { margin: 4px 0; }
  .divider { border-top: 1px solid #ddd; margin: 12px 0; }
  .totals div { display:flex; justify-content:space-between; margin: 4px 0; }
  .total { font-size: 1.1rem; font-weight: 700; margin-top: 8px; }
  .footer { margin-top: 16px; text-align: center; color: #666; font-size: 0.85rem; }
  .qr { margin-top: 12px; text-align: center; color: #999; font-size: 0.75rem; border: 1px dashed #ccc; padding: 16px; }
`;

const PRINT_WINDOW_LOADING_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><title>Preparing receipt…</title></head>
<body><p style="font-family:system-ui,sans-serif;padding:1.5rem;">Preparing receipt…</p></body>
</html>`;

export function openReceiptPrintWindow(): Window | null {
  const printWindow = window.open("about:blank", "_blank");
  if (!printWindow) return null;
  printWindow.document.open();
  printWindow.document.write(PRINT_WINDOW_LOADING_HTML);
  printWindow.document.close();
  return printWindow;
}

export function renderReceiptInWindow(
  printWindow: Window | null,
  html: string
): void {
  if (!printWindow || printWindow.closed) return;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  const triggerPrint = () => {
    printWindow.focus();
    printWindow.print();
    printWindow.addEventListener(
      "afterprint",
      () => {
        printWindow.close();
      },
      { once: true }
    );
  };

  if (printWindow.document.readyState === "complete") {
    triggerPrint();
  } else {
    printWindow.addEventListener("load", triggerPrint, { once: true });
  }
}

export function printReceiptHtml(html: string): void {
  const printWindow = openReceiptPrintWindow();
  renderReceiptInWindow(printWindow, html);
}
