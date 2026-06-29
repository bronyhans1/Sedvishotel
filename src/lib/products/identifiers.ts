export function slugifyProductName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function formatBarcode(sequence: number): string {
  return `SED${String(sequence).padStart(9, "0")}`;
}

export function formatSku(sequence: number): string {
  return `SED-${String(sequence).padStart(6, "0")}`;
}

export function normalizeBarcode(value: string): string {
  return value.trim().toUpperCase();
}

export function normalizeSku(value: string): string {
  return value.trim().toUpperCase();
}
