"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";

import {
  formatMoney,
  formatMoneyLabel,
  setRuntimeCurrencyConfig,
} from "@/lib/currency/format";
import type { CurrencyFormatConfig } from "@/lib/currency/types";

type CurrencyContextValue = {
  config: CurrencyFormatConfig;
  formatCurrency: (amount: number) => string;
  currencyLabel: string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({
  config,
  children,
}: {
  config: CurrencyFormatConfig;
  children: ReactNode;
}) {
  useEffect(() => {
    setRuntimeCurrencyConfig(config);
  }, [config]);

  const value = useMemo(
    () => ({
      config,
      formatCurrency: (amount: number) => formatMoney(amount, config),
      currencyLabel: formatMoneyLabel(config),
    }),
    [config]
  );

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return context;
}
