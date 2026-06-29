import type { RoomType, RoomTypeStats } from "@/types/room-type";

export const ROOM_TYPE_ASSIGNMENTS: Record<string, string[]> = {
  "standard-single": [
    "001", "002", "003", "004", "005", "006", "007", "008",
  ],
  "standard-double": [
    "009", "010", "011", "012", "013", "014", "015", "016", "017",
  ],
  deluxe: [
    "018", "019", "020", "021", "022", "023", "024", "025", "026",
  ],
  executive: ["027", "028", "029", "030", "031", "032"],
  "family-suite": ["033", "034", "035"],
};

const MOCK_TYPE_UUIDS: Record<string, string> = {
  "standard-single": "10000000-0000-4000-8000-000000000001",
  "standard-double": "10000000-0000-4000-8000-000000000002",
  deluxe: "10000000-0000-4000-8000-000000000003",
  executive: "10000000-0000-4000-8000-000000000004",
  "family-suite": "10000000-0000-4000-8000-000000000005",
};

export const mockRoomTypes: RoomType[] = [
  {
    id: "standard-single",
    uuid: MOCK_TYPE_UUIDS["standard-single"],
    name: "Standard Single",
    description:
      "Comfortable single occupancy room with essential amenities for solo travelers.",
    defaultPrice: 250,
    capacity: 1,
    amenities: ["Wi-Fi", "Air Conditioning", "Smart TV", "Work Desk"],
    status: "active",
    assignedRoomNumbers: ROOM_TYPE_ASSIGNMENTS["standard-single"],
  },
  {
    id: "standard-double",
    uuid: MOCK_TYPE_UUIDS["standard-double"],
    name: "Standard Double",
    description:
      "Spacious double room ideal for couples or business travelers sharing accommodation.",
    defaultPrice: 350,
    capacity: 2,
    amenities: ["Wi-Fi", "Air Conditioning", "Smart TV", "Mini Fridge"],
    status: "active",
    assignedRoomNumbers: ROOM_TYPE_ASSIGNMENTS["standard-double"],
  },
  {
    id: "deluxe",
    uuid: MOCK_TYPE_UUIDS.deluxe,
    name: "Deluxe Room",
    description:
      "Upgraded room with premium furnishings and enhanced comfort features.",
    defaultPrice: 450,
    capacity: 2,
    amenities: [
      "Wi-Fi",
      "Air Conditioning",
      "Smart TV",
      "Mini Bar",
      "Room Service",
    ],
    status: "active",
    assignedRoomNumbers: ROOM_TYPE_ASSIGNMENTS.deluxe,
  },
  {
    id: "executive",
    uuid: MOCK_TYPE_UUIDS.executive,
    name: "Executive Room",
    description:
      "Executive-level accommodation with lounge access and priority services.",
    defaultPrice: 600,
    capacity: 2,
    amenities: [
      "Wi-Fi",
      "Air Conditioning",
      "Smart TV",
      "Mini Bar",
      "Lounge Access",
      "Complimentary Breakfast",
    ],
    status: "active",
    assignedRoomNumbers: ROOM_TYPE_ASSIGNMENTS.executive,
  },
  {
    id: "family-suite",
    uuid: MOCK_TYPE_UUIDS["family-suite"],
    name: "Family Suite",
    description:
      "Large suite designed for families with separate living area and multiple beds.",
    defaultPrice: 900,
    capacity: 4,
    amenities: [
      "Wi-Fi",
      "Air Conditioning",
      "Smart TV",
      "Kitchenette",
      "Sofa Bed",
      "Complimentary Breakfast",
    ],
    status: "active",
    assignedRoomNumbers: ROOM_TYPE_ASSIGNMENTS["family-suite"],
  },
];

export function getRoomTypeById(id: string): RoomType | undefined {
  return mockRoomTypes.find((t) => t.id === id);
}

export function getRoomTypeForRoomNumber(
  roomNumber: string
): RoomType | undefined {
  const normalized = roomNumber.padStart(3, "0");
  return mockRoomTypes.find((t) =>
    t.assignedRoomNumbers.includes(normalized)
  );
}

export function computeRoomTypeStats(types: RoomType[]): RoomTypeStats {
  const prices = types.map((t) => t.defaultPrice);
  const sum = prices.reduce((a, b) => a + b, 0);
  return {
    totalTypes: types.length,
    averagePrice: types.length ? Math.round(sum / types.length) : 0,
    highestPrice: prices.length ? Math.max(...prices) : 0,
    lowestPrice: prices.length ? Math.min(...prices) : 0,
  };
}

export const mockRoomTypeStats = computeRoomTypeStats(mockRoomTypes);
