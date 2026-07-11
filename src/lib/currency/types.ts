export type CurrencyPosition = "before" | "after";

export type CurrencyFormatConfig = {
  symbol: string;
  code: string;
  position: CurrencyPosition;
  locale: string;
};

export const DEFAULT_CURRENCY_CONFIG: CurrencyFormatConfig = {
  symbol: "GH₵",
  code: "GHS",
  position: "before",
  locale: "en-GH",
};
