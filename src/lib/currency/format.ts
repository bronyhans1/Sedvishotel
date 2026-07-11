import type { HotelSettings } from "@/types/settings";

import {
  DEFAULT_CURRENCY_CONFIG,
  type CurrencyFormatConfig,
  type CurrencyPosition,
} from "./types";

let runtimeCurrencyConfig: CurrencyFormatConfig = DEFAULT_CURRENCY_CONFIG;

export function setRuntimeCurrencyConfig(config: CurrencyFormatConfig): void {
  runtimeCurrencyConfig = config;
}

export function getRuntimeCurrencyConfig(): CurrencyFormatConfig {
  return runtimeCurrencyConfig;
}

export function buildCurrencyConfigFromSettings(
  settings: Pick<HotelSettings, "currency" | "currencySymbol" | "currencyPosition">
): CurrencyFormatConfig {
  return {
    symbol: settings.currencySymbol?.trim() || DEFAULT_CURRENCY_CONFIG.symbol,
    code: settings.currency?.trim() || DEFAULT_CURRENCY_CONFIG.code,
    position: settings.currencyPosition ?? DEFAULT_CURRENCY_CONFIG.position,
    locale: DEFAULT_CURRENCY_CONFIG.locale,
  };
}

export function formatMoney(
  amount: number,
  config: CurrencyFormatConfig = getRuntimeCurrencyConfig()
): string {
  const formatted = new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  if (config.position === "after") {
    return `${formatted} ${config.symbol}`;
  }

  return `${config.symbol} ${formatted}`;
}

export function formatMoneyLabel(
  config: CurrencyFormatConfig = getRuntimeCurrencyConfig()
): string {
  return config.symbol;
}

export function isValidCurrencyPosition(value: string): value is CurrencyPosition {
  return value === "before" || value === "after";
}
