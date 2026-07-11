import type { MetadataRoute } from "next";

import { buildRobotsConfig } from "@/lib/public-seo";

export default function robots(): MetadataRoute.Robots {
  return buildRobotsConfig();
}
