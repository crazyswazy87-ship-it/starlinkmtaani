import { Client, Databases, Query } from "node-appwrite";
import fs from "fs";
import path from "path";

const client = new Client()
  .setEndpoint("https://sgp.cloud.appwrite.io/v1")
  .setProject("695fa78500123148c6ff");

const databases = new Databases(client);

const DATABASE_ID = "696c7dc0000d7998f391";
const SHENG_COLLECTION_ID = "sheng";

const SITE_URL = "https://sheng.buzz";

async function getAllWords() {
  const words = [];
  let offset = 0;

  const limit = 100;

  while (true) {
    const response = await databases.listDocuments(
      DATABASE_ID,
      SHENG_COLLECTION_ID,
      [
        Query.limit(limit),
        Query.offset(offset),
      ]
    );

    words.push(...response.documents);

    console.log(
      `Fetched ${words.length} Sheng words...`
    );

    if (response.documents.length < limit) {
      break;
    }

    offset += limit;
  }

  return words;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function generateSitemap() {
  console.log("🚀 Generating Sheng.buzz sitemap...");

  const words = await getAllWords();

  console.log(`📚 Found ${words.length} Sheng words.`);

  const urls = [
    {
      loc: `${SITE_URL}/`,
      priority: "1.0",
      changefreq: "daily",
    },

    {
      loc: `${SITE_URL}/catalogue`,
      priority: "0.9",
      changefreq: "daily",
    },

    {
      loc: `${SITE_URL}/about`,
      priority: "0.7",
      changefreq: "monthly",
    },

    {
      loc: `${SITE_URL}/terms`,
      priority: "0.3",
      changefreq: "yearly",
    },
  ];

  for (const word of words) {
    if (!word.word) continue;

    urls.push({
      loc: `${SITE_URL}/word/${encodeURIComponent(
        word.word.trim()
      )}`,
      priority: "0.8",
      changefreq: "weekly",
      lastmod: word.$updatedAt
        ? new Date(word.$updatedAt).toISOString()
        : undefined,
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

${urls
  .map(
    (url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    ${
      url.lastmod
        ? `<lastmod>${url.lastmod}</lastmod>`
        : ""
    }
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join("\n")}

</urlset>`;

  const outputPath = path.resolve(
    "public",
    "sitemap.xml"
  );

  fs.writeFileSync(
    outputPath,
    xml,
    "utf8"
  );

  console.log(
    `✅ Sitemap created: ${outputPath}`
  );

  console.log(
    `🔗 https://sheng.buzz/sitemap.xml`
  );
}

generateSitemap().catch((error) => {
  console.error("❌ Sitemap generation failed:");
  console.error(error);
  process.exit(1);
});