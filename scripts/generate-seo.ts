/**
 * 构建期 SEO 产物生成（build 流程末端，`pnpm build` 自动执行）：
 *  - build/client/sitemap.xml：全部静态路由 + published 详情页（排除 /dev/ui 与 404）
 *  - build/client/feed.xml：文章 RSS 2.0
 * 站点 URL 取 content/data/site.ts 的 siteSettings.url（与领域层同源）。
 */
import { existsSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  getPublishedArticles,
  getSiteMeta,
  getSitemapPaths,
} from "./content-urls";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "build", "client");

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function buildSitemap(siteUrl: string, paths: string[]): string {
  const today = new Date().toISOString().slice(0, 10);
  const urls = paths
    .map((path) => {
      const loc = `${siteUrl}${path === "/" ? "/" : path}`;
      return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function buildFeed(): string {
  const site = getSiteMeta();
  const articles = getPublishedArticles();
  const items = articles
    .map((article) => {
      const link = `${site.url}/writing/${article.slug}`;
      const pubDate = new Date(
        `${article.updatedAt ?? article.createdAt}T00:00:00Z`,
      ).toUTCString();
      return [
        "    <item>",
        `      <title>${escapeXml(article.title)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
        `      <description>${escapeXml(article.summary)}</description>`,
        `      <pubDate>${pubDate}</pubDate>`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(site.title)}</title>`,
    `    <link>${escapeXml(site.url)}</link>`,
    `    <description>${escapeXml(site.description)}</description>`,
    `    <language>${escapeXml(site.locale)}</language>`,
    `    <atom:link href="${escapeXml(`${site.url}/feed.xml`)}" rel="self" type="application/rss+xml" />`,
    items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}

function main() {
  if (!existsSync(OUT_DIR)) {
    throw new Error(`构建产物目录不存在：${OUT_DIR}（请先执行 react-router build）`);
  }
  const site = getSiteMeta();
  const sitemapPaths = getSitemapPaths();

  writeFileSync(join(OUT_DIR, "sitemap.xml"), buildSitemap(site.url, sitemapPaths));
  writeFileSync(join(OUT_DIR, "feed.xml"), buildFeed());

  console.log(
    `[generate-seo] sitemap.xml（${sitemapPaths.length} 条 URL）+ feed.xml（${getPublishedArticles().length} 篇文章）已写入 build/client/`,
  );
}

main();
