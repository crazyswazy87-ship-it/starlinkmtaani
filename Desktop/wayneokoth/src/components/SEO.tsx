import { Helmet } from "react-helmet-async";

interface SEOProps {
title: string;
description: string;
path?: string;
type?: "website" | "article";
image?: string;
keywords?: string[];
structuredData?: Record<string, unknown> | Record<string, unknown>[];
}

export default function SEO({
title,
description,
path = "/",
type = "website",
image = "/assets/images/sheng.png",
keywords = [],
structuredData,
}: SEOProps) {
const siteUrl = "https://sheng.buzz";

const cleanPath = path.startsWith("/")
? path
: `/${path}`;

const url = `${siteUrl}${cleanPath}`;

const imageUrl = image.startsWith("http")
? image
: `${siteUrl}${image}`;

const keywordContent = [
"Sheng",
"Kenyan Sheng",
"Sheng dictionary",
"Sheng meaning",
"Kenya slang",
"Kenyan slang",
...keywords,
].join(", ");

const schemas = structuredData
? Array.isArray(structuredData)
? structuredData
: [structuredData]
: [];

return ( <Helmet>


  {/* BASIC SEO */}

  <html lang="en" />

  <title>{title}</title>

  <meta
    name="description"
    content={description}
  />

  <meta
    name="keywords"
    content={keywordContent}
  />

  <meta
    name="robots"
    content="index, follow, max-image-preview:large"
  />

  <link
    rel="canonical"
    href={url}
  />


  {/* BRAND */}

  <meta
    name="application-name"
    content="Sheng.buzz"
  />

  <meta
    name="author"
    content="Sheng.buzz"
  />


  {/* OPEN GRAPH */}

  <meta
    property="og:type"
    content={type}
  />

  <meta
    property="og:url"
    content={url}
  />

  <meta
    property="og:title"
    content={title}
  />

  <meta
    property="og:description"
    content={description}
  />

  <meta
    property="og:image"
    content={imageUrl}
  />

  <meta
    property="og:image:alt"
    content="Sheng.buzz — Kenyan Sheng Dictionary"
  />

  <meta
    property="og:site_name"
    content="Sheng.buzz"
  />

  <meta
    property="og:locale"
    content="en_KE"
  />


  {/* TWITTER / X */}

  <meta
    name="twitter:card"
    content="summary_large_image"
  />

  <meta
    name="twitter:title"
    content={title}
  />

  <meta
    name="twitter:description"
    content={description}
  />

  <meta
    name="twitter:image"
    content={imageUrl}
  />


  {/* STRUCTURED DATA */}

  {schemas.map((schema, index) => (
    <script
      key={`structured-data-${index}`}
      type="application/ld+json"
    >
      {JSON.stringify(schema)}
    </script>
  ))}

</Helmet>


);
}
