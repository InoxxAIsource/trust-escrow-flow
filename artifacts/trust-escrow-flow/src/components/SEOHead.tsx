import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  jsonLd?: object | object[];
  /** 1200x630 OG image. Relative paths are resolved against the site origin. */
  ogImage?: string;
  /** Describes the image for screen readers and for cards that fail to load it. */
  ogImageAlt?: string;
  /** og:type — defaults to "website". Use "article" for blog posts. */
  ogType?: "website" | "article" | "product";
  /** ISO date. Emitted as article:published_time when ogType is "article". */
  publishedTime?: string;
  /** Set true on private/app pages (auth, dashboard, etc.) */
  noindex?: boolean;
}

const SITE_URL = "https://p2pxbt.com";

/**
 * Served from /public rather than imported through Vite.
 *
 * The bundled asset this used to point at was 1024x1024, while the tags below
 * declare 1200x630. Card renderers trust the declared size for layout, so a
 * square image came back cropped or was dropped for failing the aspect check.
 * A file in /public also keeps one stable URL across builds, which matters
 * because Facebook and LinkedIn cache by image URL — a content-hashed
 * filename re-fetches on every deploy.
 */
const DEFAULT_OG = `${SITE_URL}/og-image.jpg`;
const DEFAULT_OG_ALT = "P2PxBT — peer-to-peer crypto trading";

/** Card crawlers reject relative image paths outright. */
function absolute(url: string): string {
  return url.startsWith("http") ? url : `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

/**
 * Emitted on every page under stable @ids, so the per-page Service, Article and
 * FAQPage nodes can point at one Organization rather than each re-declaring a
 * publisher. Without this the site has no entity for Google to attach anything
 * to -- every landing page described a provider that existed only in its own
 * blob.
 */
const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

const SITE_SCHEMA = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: "P2PxBT",
    url: SITE_URL,
    logo: { "@type": "ImageObject", url: `${SITE_URL}/favicon.ico` },
    description:
      "Peer-to-peer cryptocurrency marketplace covering the United States, " +
      "United Kingdom, Europe and Hong Kong.",
    areaServed: [
      { "@type": "Country", name: "United States" },
      { "@type": "Country", name: "United Kingdom" },
      { "@type": "Place", name: "Europe" },
      { "@type": "Country", name: "Hong Kong" },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: "P2PxBT",
    inLanguage: "en",
    publisher: { "@id": ORGANIZATION_ID },
  },
];

const SEOHead = ({
  title,
  description,
  canonical,
  jsonLd,
  ogImage,
  ogImageAlt,
  ogType = "website",
  publishedTime,
  noindex = false,
}: SEOHeadProps) => {
  const url = canonical ?? SITE_URL;
  const image = ogImage ? absolute(ogImage) : DEFAULT_OG;
  const imageAlt = ogImageAlt ?? DEFAULT_OG_ALT;
  const pageSchema = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];

  // Private pages get no entity markup -- describing a page that asks Google
  // not to index it is contradictory.
  const jsonLdArray = noindex ? [] : [...SITE_SCHEMA, ...pageSchema];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {canonical && <link rel="canonical" href={canonical} />}
      {noindex && <meta name="robots" content="noindex, follow" />}

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:image:secure_url" content={image} />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={imageAlt} />
      <meta property="og:site_name" content="P2PxBT" />
      <meta property="og:locale" content="en_US" />
      {ogType === "article" && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@p2pxbt" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={imageAlt} />

      {jsonLdArray.map((ld, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(ld)}</script>
      ))}
    </Helmet>
  );
};

export default SEOHead;
