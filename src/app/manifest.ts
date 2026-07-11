import type { MetadataRoute } from "next";

import { buildWebManifest } from "@/lib/public-seo";

export default function manifest(): MetadataRoute.Manifest {
  return buildWebManifest();
}
