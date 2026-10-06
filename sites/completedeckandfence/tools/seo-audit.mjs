// Audits the built site in dist/ for technical SEO. Run after `npm run build`.
//   node tools/seo-audit.mjs
// Fails on: missing or long titles, duplicate titles or descriptions, missing
// or wrong canonicals, not exactly one H1, images without alt text or size,
// broken internal links or anchors, invalid structured data, pages missing
// from the sitemap, and a missing robots.txt.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const dist = new URL("../dist/", import.meta.url).pathname;
const SITE = "https://completedeckandfence.com";
// Pages reached only after an action, such as the form thank you page: noindex, no sitemap, no inbound links needed.
const PRIVATE = new Set(["/thank-you/"]);
if (!existsSync(dist)) { console.error("Build first: dist/ is missing."); process.exit(2); }

const files = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f.endsWith(".html")) files.push(p);
  }
})(dist);

const urlFor = (file) => {
  const rel = relative(dist, file).replace(/index\.html$/, "").replace(/\\/g, "/");
  return `/${rel}`.replace(/\/+/g, "/");
};
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const attr = (tag, name) => { const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`, "i")); return m ? decode(m[1]) : null; };

const pages = new Map();
for (const file of files) {
  const html = readFileSync(file, "utf8");
  const url = urlFor(file);
  const title = decode((html.match(/<title>([^<]*)<\/title>/i) || [])[1] || "");
  const description = attr((html.match(/<meta name="description"[^>]*>/i) || [""])[0], "content") || "";
  const canonical = attr((html.match(/<link rel="canonical"[^>]*>/i) || [""])[0], "href");
  const robots = attr((html.match(/<meta name="robots"[^>]*>/i) || [""])[0], "content") || "";
  const h1s = html.match(/<h1[\s>]/gi) || [];
  const imgs = html.match(/<img\b[^>]*>/gi) || [];
  const links = [...html.matchAll(/<a\b[^>]*\shref="([^"]+)"/gi)].map((m) => decode(m[1]));
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/gi)].map((m) => m[1]));
  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  const lang = /<html lang="en"/.test(html);
  const viewport = /<meta name="viewport"/.test(html);
  const og = ["og:title", "og:description", "og:image", "og:url"].every((p) => html.includes(`property="${p}"`));
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  pages.set(url, { file, html, url, title, description, canonical, robots, h1s, imgs, links, ids, ld, lang, viewport, og, text });
}

const problems = [];
const add = (url, msg) => problems.push(`${url}  ${msg}`);
const titles = new Map();
const descs = new Map();

for (const p of pages.values()) {
  const is404 = p.url === "/404/" || p.url === "/404.html";
  if (!p.title) add(p.url, "missing title");
  if (p.title.length > 60) add(p.url, `title ${p.title.length} chars`);
  if (!is404) (titles.get(p.title) ?? titles.set(p.title, []).get(p.title)).push(p.url);
  if (p.description.length < 70 || p.description.length > 165) add(p.url, `description ${p.description.length} chars`);
  if (!is404) (descs.get(p.description) ?? descs.set(p.description, []).get(p.description)).push(p.url);
  if (!is404 && p.canonical !== `${SITE}${p.url}`) add(p.url, `canonical ${p.canonical}`);
  if (PRIVATE.has(p.url)) { if (!/noindex/.test(p.robots)) add(p.url, "private page must be noindex"); }
  else if (!is404 && /noindex/.test(p.robots)) add(p.url, "noindex");
  if (p.h1s.length !== 1) add(p.url, `${p.h1s.length} H1 tags`);
  if (!p.lang) add(p.url, "missing lang");
  if (!p.viewport) add(p.url, "missing viewport");
  if (!p.og) add(p.url, "missing Open Graph tags");
  for (const img of p.imgs) {
    if (attr(img, "alt") === null) add(p.url, `image without alt: ${img.slice(0, 80)}`);
    if (!attr(img, "width") || !attr(img, "height")) add(p.url, `image without width and height: ${img.slice(0, 80)}`);
  }
  for (const href of p.links) {
    if (/^(https?:|mailto:|tel:)/.test(href)) {
      if (href.startsWith(SITE)) add(p.url, `absolute internal link ${href}`);
      continue;
    }
    const [path, hash] = href.split("#");
    const target = path === "" ? p : pages.get(path);
    if (!target) { add(p.url, `broken link ${href}`); continue; }
    if (path && !path.endsWith("/")) add(p.url, `link without trailing slash ${href}`);
    if (hash && !target.ids.has(hash)) add(p.url, `missing anchor ${href}`);
  }
  for (const block of p.ld) {
    try { JSON.parse(block); } catch { add(p.url, "invalid JSON LD"); }
  }
  if (!p.ld.length) add(p.url, "no structured data");
  if (/[‒-―]/.test(p.text)) add(p.url, "em or en dash in visible text");
}
for (const [t, urls] of titles) if (urls.length > 1) add(urls.join(", "), `duplicate title "${t}"`);
for (const [d, urls] of descs) if (urls.length > 1) add(urls.join(", "), `duplicate description`);

// Sitemap and robots
const robotsFile = join(dist, "robots.txt");
if (!existsSync(robotsFile)) add("/robots.txt", "missing");
else if (!readFileSync(robotsFile, "utf8").includes("Sitemap:")) add("/robots.txt", "no sitemap line");
const smFiles = readdirSync(dist).filter((f) => /^sitemap-\d+\.xml$/.test(f));
const inSitemap = new Set(smFiles.flatMap((f) => [...readFileSync(join(dist, f), "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(SITE, ""))));
for (const p of pages.values()) {
  if (p.url === "/404/" || p.url === "/404.html") { if (inSitemap.has(p.url)) add(p.url, "404 page is in the sitemap"); continue; }
  if (PRIVATE.has(p.url)) { if (inSitemap.has(p.url)) add(p.url, "private page is in the sitemap"); continue; }
  if (!inSitemap.has(p.url)) add(p.url, "missing from sitemap");
}

// Orphans: every indexable page should be linked from at least one other page.
const inbound = new Map([...pages.keys()].map((u) => [u, 0]));
for (const p of pages.values()) for (const href of new Set(p.links)) {
  const path = href.split("#")[0];
  if (path && path !== p.url && inbound.has(path)) inbound.set(path, inbound.get(path) + 1);
}
for (const [u, n] of inbound) if (n === 0 && u !== "/" && u !== "/404/" && u !== "/404.html" && !PRIVATE.has(u)) add(u, "orphan page, nothing links here");

const summary = {
  pages: pages.size,
  inSitemap: inSitemap.size,
  avgInternalLinks: Math.round([...pages.values()].reduce((a, p) => a + p.links.filter((l) => !/^(https?:|mailto:|tel:)/.test(l)).length, 0) / pages.size),
};
console.log(`Audited ${summary.pages} pages, ${summary.inSitemap} in the sitemap, about ${summary.avgInternalLinks} internal links per page.`);
if (problems.length) {
  console.log(`\n${problems.length} problems:`);
  for (const p of problems.slice(0, 200)) console.log(`  ${p}`);
  process.exit(1);
}
console.log("No problems found.");
