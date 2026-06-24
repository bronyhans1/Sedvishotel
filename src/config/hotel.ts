import type { FloorId } from "@/types/room";

/** Default seed layout for SEDVIS HOTEL demo data (35 rooms). Business logic uses live room counts. */
export const HOTEL_FLOOR_LAYOUT: Record<FloorId, string[]> = {
  ground: ["001", "002", "003", "004", "005", "006", "007", "008"],
  first: ["009", "010", "011", "012", "013", "014", "015", "016", "017"],
  second: ["018", "019", "020", "021", "022", "023", "024", "025", "026"],
  third: ["027", "028", "029", "030", "031", "032", "033", "034", "035"],
};

export const HOTEL_FLOOR_LABELS: Record<FloorId, string> = {
  ground: "Ground Floor",
  first: "First Floor",
  second: "Second Floor",
  third: "Third Floor",
};
