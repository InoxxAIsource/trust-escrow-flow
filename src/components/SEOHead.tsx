import { Helmet } from "react-helmet-async";
import ogDefault from "@/assets/og-default.jpg";

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  jsonLd?: object | object[];
  /** Absolute URL to a 1200x630 OG image. Defaults to the brand OG image. */
  ogImage?: string;
  /** og:type — defaults to "website". Use "article" for blog posts. */
  ogType?: "website" | "article" | "product";
  /** Set true on private/app pages (auth, dashboard, etc.) */
  noindex?: boolean;
}

const SITE_URL = "https://p2pxbt.com";
const DEFAULT_OG = `${SITE_URL}${ogDefault}`;

const SEOHead = ({
  title,
  description,
  canonical,
  jsonLd,
  ogImage,
  ogType = "website",
  noindex = false,
}: SEOHeadProps) => {
  const url = canonical ?? SITE_URL;
  const image = ogImage ?? DEFAULT_OG;
  const jsonLdArray = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];

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
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="P2PxBT" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {jsonLdArray.map((ld, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(ld)}</script>
      ))}
    </Helmet>
  );
};

export default SEOHead;
