"use client";

import Image from "next/image";
import { Building2 } from "lucide-react";

import { useBranding } from "@/components/branding/BrandingProvider";
import { formatCurrency } from "@/lib/utils";
import type { HotelSettings } from "@/types/settings";
import type { Invoice } from "@/types/invoice";

type Props = {
  invoice: Invoice;
  className?: string;
  documentSettings?: Pick<
    HotelSettings,
    | "address"
    | "phone"
    | "email"
    | "website"
    | "tinNumber"
    | "taxRate"
    | "invoiceFooter"
    | "termsAndConditions"
  >;
};

export function InvoicePrintPreview({ invoice, className, documentSettings }: Props) {
  const branding = useBranding();
  const hotelName = branding?.hotelName ?? "SEDVIS HOTEL";
  const taxPercent = documentSettings
    ? documentSettings.taxRate <= 1
      ? Math.round(documentSettings.taxRate * 100)
      : Math.round(documentSettings.taxRate)
    : 15;
  const taxLabel = `Taxes (${taxPercent}%)`;

  return (
    <div
      className={`mx-auto max-w-2xl rounded-xl border bg-white p-8 text-black shadow-lg print:shadow-none dark:bg-white ${className ?? ""}`}
    >
      <div className="flex items-start justify-between border-b pb-6">
        <div className="flex gap-4">
          {branding?.logoUrl ? (
            <Image
              src={branding.logoUrl}
              alt={`${hotelName} logo`}
              width={56}
              height={56}
              className="h-14 w-14 rounded-lg object-contain"
              unoptimized
            />
          ) : (
            <div
              className="flex h-14 w-14 items-center justify-center rounded-lg text-white"
              style={{ backgroundColor: branding?.primaryColor ?? "#1e3a5f" }}
            >
              <Building2 className="h-8 w-8" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold tracking-wide">{hotelName}</h1>
            {documentSettings?.address ? (
              <p className="text-sm text-slate-600">{documentSettings.address}</p>
            ) : null}
            {documentSettings?.phone ? (
              <p className="text-sm text-slate-600">{documentSettings.phone}</p>
            ) : null}
            {documentSettings?.email ? (
              <p className="text-sm text-slate-600">{documentSettings.email}</p>
            ) : null}
            {documentSettings?.tinNumber ? (
              <p className="text-sm text-slate-600">TIN: {documentSettings.tinNumber}</p>
            ) : null}
          </div>
        </div>
        <div className="text-right text-sm">
          <p className="font-mono font-bold text-lg">{invoice.invoiceNumber}</p>
          <p className="text-slate-600">Date: {invoice.invoiceDate}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Bill To</p>
          <p className="mt-1 font-semibold">{invoice.guestName}</p>
          <p>{invoice.guestEmail}</p>
          <p>{invoice.guestPhone}</p>
          <p className="text-slate-600">{invoice.guestAddress}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Stay Details</p>
          <p className="mt-1">Room {invoice.roomNumber} · {invoice.roomTypeName}</p>
          <p>{invoice.floorLabel}</p>
          <p>Check-in: {invoice.checkInDate}</p>
          <p>Check-out: {invoice.checkOutDate}</p>
        </div>
      </div>

      <table className="mt-8 w-full text-sm">
        <thead>
          <tr className="border-b text-left text-slate-500">
            <th className="pb-2">Description</th>
            <th className="pb-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-dashed">
            <td className="py-2">Room rate × {invoice.numberOfNights} nights</td>
            <td className="py-2 text-right">{formatCurrency(invoice.roomCharges)}</td>
          </tr>
          <tr className="border-b border-dashed">
            <td className="py-2">{taxLabel}</td>
            <td className="py-2 text-right">{formatCurrency(invoice.taxes)}</td>
          </tr>
          {invoice.additionalCharges > 0 && (
            <tr>
              <td className="py-2">Additional charges</td>
              <td className="py-2 text-right">{formatCurrency(invoice.additionalCharges)}</td>
            </tr>
          )}
          {invoice.discounts > 0 && (
            <tr>
              <td className="py-2">Discounts</td>
              <td className="py-2 text-right">-{formatCurrency(invoice.discounts)}</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="mt-6 space-y-1 border-t pt-4 text-sm">
        <div className="flex justify-between font-bold text-base">
          <span>Total Amount</span>
          <span>{formatCurrency(invoice.totalAmount)}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Amount Paid</span>
          <span>{formatCurrency(invoice.amountPaid)}</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Outstanding Balance</span>
          <span>{formatCurrency(invoice.balance)}</span>
        </div>
      </div>

      {documentSettings?.termsAndConditions ? (
        <div className="mt-6 border-t pt-4 text-xs text-slate-600">
          <p className="font-semibold uppercase tracking-wide">Terms & Conditions</p>
          <p className="mt-2 whitespace-pre-wrap">{documentSettings.termsAndConditions}</p>
        </div>
      ) : null}

      <p className="mt-8 text-center text-xs text-slate-500">
        {documentSettings?.invoiceFooter ||
          `Thank you for staying at ${hotelName}.`}
      </p>
    </div>
  );
}
