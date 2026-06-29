"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import type { ProductCategoryOption } from "@/types/product";

const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type PosSidebarProps = {
  search: string;
  categoryId: string;
  categories: ProductCategoryOption[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onBarcodeSubmit: (value: string) => void;
};

export function PosSidebar({
  search,
  categoryId,
  categories,
  onSearchChange,
  onCategoryChange,
  onBarcodeSubmit,
}: PosSidebarProps) {
  const [barcodeBuffer, setBarcodeBuffer] = useState("");

  const categoryOptions = useMemo(
    () => [{ id: "", name: "All categories" }, ...categories],
    [categories]
  );

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    onBarcodeSubmit(search.trim());
  }

  function handleBarcodeKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    onBarcodeSubmit(barcodeBuffer.trim());
    setBarcodeBuffer("");
  }

  return (
    <div className="flex h-full flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm">
      <div>
        <label className="mb-2 block text-sm font-medium" htmlFor="pos-search">
          Search
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="pos-search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Name, SKU, barcode…"
            className="pl-9"
            autoFocus
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium" htmlFor="pos-barcode">
          Barcode Scanner
        </label>
        <Input
          id="pos-barcode"
          value={barcodeBuffer}
          onChange={(e) => setBarcodeBuffer(e.target.value)}
          onKeyDown={handleBarcodeKeyDown}
          placeholder="Scan barcode…"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Keyboard-emulated scanners add products on Enter.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium" htmlFor="pos-category">
          Category
        </label>
        <select
          id="pos-category"
          value={categoryId}
          onChange={(e) => onCategoryChange(e.target.value)}
          className={selectClass}
        >
          {categoryOptions.map((category) => (
            <option key={category.id || "all"} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
