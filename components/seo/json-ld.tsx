import { buildWebsiteJsonLd } from "@/lib/seo";

export function JsonLd() {
  const data = buildWebsiteJsonLd();

  return (
    <script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      type="application/ld+json"
    />
  );
}
