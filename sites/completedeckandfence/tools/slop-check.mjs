// Fails when the site picks up patterns that read as machine made.
// Run from the site folder after a build: node tools/slop-check.mjs
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const css = read("src/styles/global.css");
const js = read("src/scripts/site.js");
const problems = [];

const dist = new URL("../dist/", import.meta.url).pathname;
if (!existsSync(dist)) {
  console.error("Build first: dist/ is missing.");
  process.exit(2);
}
const htmlFiles = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f.endsWith(".html")) htmlFiles.push(p);
  }
})(dist);

// Copy people can see on every built page: text between tags, plus alt text,
// placeholders, labels, and the search snippet.
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const visibleParts = [];
for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  const where = `/${relative(dist, file).replace(/index\.html$/, "")}`;
  const text = decode(html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/g, "\n")
    .replace(/<(p|h[1-6]|li|a|span|label|legend|button|figcaption|div|section|nav|header|footer)\b/g, "\n$&")
    .replace(/<[^>]+>/g, " "));
  const attrs = [...html.matchAll(/\s(?:alt|placeholder|aria-label)="([^"]*)"/g)].map((m) => decode(m[1]));
  const metas = [...html.matchAll(/<meta (?:name|property)="(?:description|og:title|og:description)" content="([^"]*)"/g)].map((m) => decode(m[1]));
  for (const line of [text, ...attrs, ...metas].join("\n").split("\n")) {
    const t = line.replace(/\s+/g, " ").trim();
    if (t) visibleParts.push({ where, t });
  }
}
const reported = new Set();
for (const { where, t } of visibleParts) {
  if (/[-‐-―−]/.test(t) && !reported.has(t)) {
    reported.add(t);
    problems.push(`Dash in visible copy on ${where}: "${t.slice(0, 120)}"`);
  }
}
const visible = visibleParts.map((v) => v.t).join("\n");

const bannedWords = [
  "elevate", "seamless", "unleash", "revolutionize", "unparalleled", "world class",
  "state of the art", "game changer", "look no further", "nestled", "tapestry",
  "delve", "testament", "effortless", "dream backyard",
];
for (const word of bannedWords) {
  if (new RegExp(`\\b${word}`, "i").test(visible)) problems.push(`Hype word in copy: "${word}"`);
}

// CSS patterns from the impeccable bans.
const cssBans = [
  [/background-clip:\s*text/, "Gradient text"],
  [/backdrop-filter/, "Frosted glass"],
  [/#(?:000|fff)(?:000|fff)?\b/i, "Pure black or pure white"],
  [/@keyframes\s+marquee/, "Scrolling keyword strip"],
  [/feTurbulence/, "Grain overlay"],
  [/\b(?:bounce|elastic)\b/i, "Bouncy easing"],
];
for (const [pattern, label] of cssBans) {
  if (pattern.test(css)) problems.push(`${label} in global.css`);
}

// Colored side stripes thicker than 1px. The logo C bracket is the one allowed exception.
for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  if (selector.includes("c-bracket")) continue;
  for (const [, value] of body.matchAll(/border-(?:left|right)(?:-width)?\s*:\s*([^;]+)/g)) {
    const widths = [...value.matchAll(/(\d*\.?\d+)px/g)].map((m) => parseFloat(m[1]));
    if (widths.some((w) => w > 1)) problems.push(`Side stripe border on ${selector.trim()}`);
  }
}

if (/addEventListener\(\s*["']scroll/.test(js)) problems.push("Scroll listener in site.js");

if (problems.length) {
  console.error(`Slop check failed:\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log("Slop check passed.");
