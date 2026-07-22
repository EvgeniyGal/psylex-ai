import type { MetadataRoute } from "next";
import { absoluteUrl, siteConfig } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteConfig.name} - ${siteConfig.tagline}`,
    short_name: siteConfig.shortName,
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: "#F7F5F0",
    theme_color: "#1A1A18",
    lang: "en",
    icons: [
      {
        src: absoluteUrl("/logo.webp"),
        sizes: "any",
        type: "image/webp",
        purpose: "any",
      },
    ],
  };
}
