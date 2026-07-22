import type { Metadata } from "next";

const FALLBACK_SITE_URL = "http://localhost:3000";

export const siteConfig = {
  name: "PsyLex",
  shortName: "PsyLex",
  tagline: "Professional Legal Resolution",
  description:
    "AI-assisted mediation that helps both sides find what they really need — structured conflict resolution without the courtroom.",
  keywords: [
    "mediation",
    "AI mediation",
    "conflict resolution",
    "legal resolution",
    "dispute resolution",
    "online mediation",
    "PsyLex",
  ],
  locale: "en_US",
  creator: "PsyLex",
  /** Relative to site root; used for OG/Twitter when absolute URL is available. */
  ogImagePath: "/logo.webp",
  twitterHandle: undefined as string | undefined,
} as const;

export function getSiteUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

  if (!fromEnv) return FALLBACK_SITE_URL;

  try {
    return new URL(fromEnv).origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
}

export function absoluteUrl(path = "/"): string {
  const base = getSiteUrl().replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized === "/" ? "" : normalized}` || base;
}

type BuildPageMetadataInput = {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
  imagePath?: string;
};

export function buildPageMetadata({
  title,
  description = siteConfig.description,
  path = "/",
  noIndex = false,
  imagePath = siteConfig.ogImagePath,
}: BuildPageMetadataInput = {}): Metadata {
  const url = absoluteUrl(path);
  const pageTitle = title ?? `${siteConfig.name} - ${siteConfig.tagline}`;
  const fullTitle = title
    ? title.includes(siteConfig.name)
      ? title
      : `${title} | ${siteConfig.name}`
    : `${siteConfig.name} - ${siteConfig.tagline}`;
  const ogImage = absoluteUrl(imagePath);

  return {
    title: title
      ? title.includes(siteConfig.name)
        ? { absolute: fullTitle }
        : pageTitle
      : { absolute: fullTitle },
    description,
    keywords: [...siteConfig.keywords],
    authors: [{ name: siteConfig.creator }],
    creator: siteConfig.creator,
    publisher: siteConfig.creator,
    applicationName: siteConfig.name,
    category: "legaltech",
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url,
      siteName: siteConfig.name,
      title: fullTitle,
      description,
      images: [
        {
          url: ogImage,
          alt: `${siteConfig.name} logo`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage],
      ...(siteConfig.twitterHandle ? { creator: siteConfig.twitterHandle, site: siteConfig.twitterHandle } : {}),
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: { index: false, follow: false },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
  };
}

export function buildWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${getSiteUrl()}/#organization`,
        name: siteConfig.name,
        url: getSiteUrl(),
        logo: absoluteUrl(siteConfig.ogImagePath),
        description: siteConfig.description,
      },
      {
        "@type": "WebSite",
        "@id": `${getSiteUrl()}/#website`,
        url: getSiteUrl(),
        name: siteConfig.name,
        description: siteConfig.description,
        publisher: { "@id": `${getSiteUrl()}/#organization` },
        inLanguage: ["en", "uk"],
      },
      {
        "@type": "WebPage",
        "@id": `${getSiteUrl()}/#webpage`,
        url: getSiteUrl(),
        name: `${siteConfig.name} - ${siteConfig.tagline}`,
        description: siteConfig.description,
        isPartOf: { "@id": `${getSiteUrl()}/#website` },
        about: { "@id": `${getSiteUrl()}/#organization` },
        inLanguage: "en",
      },
    ],
  };
}
