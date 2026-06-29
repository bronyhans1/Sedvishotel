import { revalidatePath } from "next/cache";

/** Invalidate public pages that display live SHMS room, pricing, or contact data. */
export function revalidatePublicWebsite() {
  revalidatePath("/");
  revalidatePath("/rooms");
  revalidatePath("/book");
  revalidatePath("/reservation-lookup");
}
