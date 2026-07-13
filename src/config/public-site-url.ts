const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sedvishotel.com";

/** Canonical public site origin — shared by metadata, manifest, robots, and sitemap. */
export function getPublicSiteUrl(): string {
  return siteUrl.replace(/\/$/, "");
}
