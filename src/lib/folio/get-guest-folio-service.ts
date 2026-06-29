import { createGuestFolioService, getGuestFolioServiceClient } from "@/lib/folio/create-guest-folio-service";
import { GuestFolioService } from "@/services/guest-folio.service";

export async function getGuestFolioService(): Promise<GuestFolioService> {
  const client = await getGuestFolioServiceClient();
  return createGuestFolioService(client);
}
