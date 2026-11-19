// Generates public/sitemap.xml and public/robots.txt automatically based on defined routes & notebooks.
import { writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { NOTEBOOKS } from "../src/shared/catalog.ts";

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = join(here, "..", "public");
const fallbackPublicDir = join(here, "..", "portal", "public");

const SITE_URL = (process.env.SITE_URL || "https://resourcescse.vercel.app").replace(/\/+$/, "");
const host = new URL(SITE_URL).host;
const today = new Date().toISOString().slice(0, 10);

const STATIC_ROUTES = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/library", priority: "0.9", changefreq: "weekly" },
  { path: "/resources", priority: "0.8", changefreq: "weekly" },
  { path: "/projects", priority: "0.8", changefreq: "weekly" },
  { path: "/connect", priority: "0.7", changefreq: "monthly" },
  { path: "/webteam", priority: "0.7", changefreq: "monthly" },
  { path: "/login", priority: "0.6", changefreq: "monthly" },
  { path: "/signup", priority: "0.6", changefreq: "monthly" },
];

const NOTEBOOK_ROUTES = NOTEBOOKS.map(nb => ({
  path: `/read/${nb.slug}`,
  priority: "0.8",
  changefreq: "weekly",
}));

const allUrls = [...STATIC_ROUTES, ...NOTEBOOK_ROUTES];

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
    .map(
      u => `  <url>
    <loc>${SITE_URL}${u.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join("\n")}
</urlset>
`;

const robotsTxt = `# robots.txt for ${SITE_URL}
User-agent: *
Allow: /
Allow: /library
Allow: /resources
Allow: /projects
Allow: /connect
Allow: /webteam
Allow: /login
Allow: /signup
Allow: /read/
Disallow: /admin
Disallow: /admin/
Disallow: /api/
Disallow: /plan

# Host
Host: ${host}

# Sitemap
Sitemap: ${SITE_URL}/sitemap.xml
`;

writeFileSync(join(publicDir, "sitemap.xml"), sitemapXml, "utf8");
writeFileSync(join(publicDir, "robots.txt"), robotsTxt, "utf8");

if (existsSync(fallbackPublicDir)) {
  writeFileSync(join(fallbackPublicDir, "sitemap.xml"), sitemapXml, "utf8");
  writeFileSync(join(fallbackPublicDir, "robots.txt"), robotsTxt, "utf8");
}

console.log(`Generated sitemap.xml (${allUrls.length} URLs) and robots.txt for ${SITE_URL}`);
