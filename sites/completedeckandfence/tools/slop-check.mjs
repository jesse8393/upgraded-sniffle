// Fails when the site picks up patterns that read as machine made.
// Run from the site folder: node tools/slop-check.mjs
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const html = read("index.html");
const css = read("styles.css");
const js = read("main.js");
const problems = [];

// Copy people can see: text between tags, plus alt text, placeholders, labels, and the search snippet.
const text = html
  .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/g, " ")
  .replace(/<[^>]+>/g, " ");
const attrs = [...html.matchAll(/\s(?:alt|placeholder|aria-label)="([^"]*)"/g)].map((m) => m[1]);
const metas = [...html.matchAll(/<meta (?:name|property)="(?:description|og:title|og:description)" content="([^"]*)"/g)].map((m) => m[1]);
const visible = [text, ...attrs, ...metas].join("\n");

for (const line of visible.split("\n")) {
  if (/[-‐-―−]/.test(line)) problems.push(`Dash in visible copy: "${line.trim()}"`);
}

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
  if (pattern.test(css)) problems.push(`${label} in styles.css`);
}

// Colored side stripes thicker than 1px. The logo C bracket is the one allowed exception.
for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  if (selector.includes("c-bracket")) continue;
  for (const [, value] of body.matchAll(/border-(?:left|right)(?:-width)?\s*:\s*([^;]+)/g)) {
    const widths = [...value.matchAll(/(\d*\.?\d+)px/g)].map((m) => parseFloat(m[1]));
    if (widths.some((w) => w > 1)) problems.push(`Side stripe border on ${selector.trim()}`);
  }
}

if (/addEventListener\(\s*["']scroll/.test(js)) problems.push("Scroll listener in main.js");

if (problems.length) {
  console.error(`Slop check failed:\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log("Slop check passed.");
