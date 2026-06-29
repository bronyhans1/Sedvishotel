import { siteConfig } from "@/config/site";
import type { HotelSettings } from "@/types/settings";

export const defaultHotelSettings: HotelSettings = {
  hotelName: siteConfig.name,
  address: "12 Independence Avenue, Airport City, Accra, Ghana",
  phone: "+233 30 000 0000",
  email: "info@sedvis-hotel.com",
  website: "https://www.sedvis-hotel.com",
  tinNumber: "C0001234567",
  description:
    "SEDVIS HOTEL is a premium hospitality destination offering refined accommodations and world-class service in the heart of Accra.",
  primaryColor: "#1e3a5f",
  secondaryColor: "#c9a227",
  theme: "system",
  logoUrl: "",
  faviconUrl: "",
  checkInTime: "14:00",
  checkOutTime: "11:00",
  lateCheckoutFee: 100,
  lateCheckoutPolicyMode: "flat",
  lateCheckoutHourFee1To2: 50,
  lateCheckoutHourFee2To4: 100,
  lateCheckoutHourFee4To6: 150,
  currency: "GHS",
  timeZone: "Africa/Accra",
  taxRate: 15,
  serviceCharge: 5,
  invoicePrefix: "INV",
  receiptPrefix: "RCP",
  invoiceFooter: "Thank you for choosing SEDVIS HOTEL. We look forward to welcoming you again.",
  termsAndConditions:
    "Payment is due upon check-out unless otherwise arranged. Cancellations within 24 hours may incur charges. The hotel is not liable for valuables not secured in the in-room safe.",
  reservationEmailTemplate:
    "Dear {{guest_name}}, your reservation {{reservation_number}} at SEDVIS HOTEL is confirmed. Check-in: {{check_in_date}}.",
  invoiceEmailTemplate:
    "Dear {{guest_name}}, please find attached invoice {{invoice_number}} for your recent stay at SEDVIS HOTEL.",
  reminderEmailTemplate:
    "Dear {{guest_name}}, this is a friendly reminder of your upcoming stay at SEDVIS HOTEL on {{check_in_date}}.",
  emailNotifications: true,
  smsNotifications: true,
  paymentAlerts: true,
  reservationAlerts: true,
  housekeepingAlerts: true,
};
