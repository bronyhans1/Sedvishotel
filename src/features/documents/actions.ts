"use server";

import { unstable_rethrow } from "next/navigation";

import { toSafeActionError } from "@/lib/actions/safe-error";
import { getServiceContext } from "@/lib/auth/service-context";
import { loadReservationFinanceContext } from "@/lib/documents/load-reservation-finance-context";
import { getDocumentNumberingRepository } from "@/lib/documents/get-document-numbering-repository";
import {
  DocumentNumberingService,
  type DocumentNumberPreviews,
} from "@/services/document-numbering.service";
import type { DocumentKind, DocumentSequenceState } from "@/repositories/document-numbering.repository";
import type { ReservationFinanceContext } from "@/lib/documents/load-reservation-finance-context";

export type DocumentActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

async function getDocumentNumberingService() {
  const repository = await getDocumentNumberingRepository();
  return new DocumentNumberingService(repository);
}

export async function getDocumentNumberPreviewsAction(): Promise<
  DocumentActionResult<DocumentNumberPreviews>
> {
  try {
    const service = await getDocumentNumberingService();
    const data = await service.getPreviews();
    return { success: true, data };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}

export async function getDocumentSequenceStateAction(
  kind: DocumentKind
): Promise<DocumentActionResult<DocumentSequenceState>> {
  try {
    const service = await getDocumentNumberingService();
    const data = await service.getSequenceState(kind);
    return { success: true, data };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}

export async function setDocumentSequenceAction(
  kind: DocumentKind,
  nextNumber: number
): Promise<DocumentActionResult<DocumentSequenceState>> {
  try {
    const { session, ctx } = await getServiceContext();
    const service = await getDocumentNumberingService();
    const data = await service.setSequence(ctx, session, kind, nextNumber);
    return { success: true, data };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}

export async function loadReservationFinanceContextAction(
  reservationId: string
): Promise<DocumentActionResult<ReservationFinanceContext>> {
  try {
    const { session, ctx } = await getServiceContext();
    const data = await loadReservationFinanceContext(ctx, session, reservationId);
    return { success: true, data };
  } catch (err) {
    unstable_rethrow(err);
    return { success: false, error: toSafeActionError(err) };
  }
}
