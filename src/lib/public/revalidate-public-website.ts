import { revalidatePath } from "next/cache";

/**
 * Invalidate public pages that display live SHMS room, pricing, contact,
 * or public presentation settings (e.g. price visibility).
 *
 * Explicit dynamic segments (`/rooms/[slug]`, `/booking/confirmation`) are
 * listed so rate and visibility changes cannot leave stale cached pages.
 */
export function revalidatePublicWebsite() {
  revalidatePath("/");
  revalidatePath("/rooms");
  revalidatePath("/rooms/[slug]");
  revalidatePath("/book");
  revalidatePath("/booking/confirmation");
  revalidatePath("/reservation-lookup");
}
