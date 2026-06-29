export type BrandingConfig = {
  hotelName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  theme: "light" | "dark" | "system";
};

export const DEFAULT_BRANDING: BrandingConfig = {
  hotelName: "SEDVIS HOTEL",
  logoUrl: null,
  faviconUrl: null,
  primaryColor: "#1e3a5f",
  secondaryColor: "#c9a227",
  theme: "system",
};
