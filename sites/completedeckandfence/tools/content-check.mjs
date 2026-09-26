// Checks content files against docs/CONTENT_SPEC.md.
//
//   node tools/content-check.mjs cities murfreesboro smyrna
//   node tools/content-check.mjs guides fence-on-a-slope
//   node tools/content-check.mjs pages decks fences
//   node tools/content-check.mjs all
//
// "all" checks every content file that exists, then compares pages with each
// other for repeated phrasing. Set PARKER_TEXT_DIR to a folder of plain text
// copies of Parker Construction pages to also measure overlap with that site.
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../", import.meta.url);
const readJson = (path) => JSON.parse(readFileSync(new URL(path, root), "utf8"));
const cities = readJson("src/data/cities.json");
const guides = readJson("src/data/guides.json");
const cityBySlug = Object.fromEntries(cities.map((c) => [c.slug, c]));
const guideBySlug = Object.fromEntries(guides.map((g) => [g.slug, g]));

const allowedPaths = new Set(["/", "/decks/", "/fences/", "/porches/", "/service-areas/", "/guides/", "#estimate"]);
for (const c of cities) {
  allowedPaths.add(`/${c.slug}-tn/`);
  allowedPaths.add(`/deck-builder-${c.slug}-tn/`);
  allowedPaths.add(`/fence-company-${c.slug}-tn/`);
}
for (const g of guides) allowedPaths.add(`/guides/${g.slug}/`);

const DIGIT_NAMES = ["12 South", "Highway 56", "I 24", "I 40", "I 65", "811"];
const CLAIMS = [
  [/\byears (of|in) (experience|business)\b/i, "years in business"],
  [/\blicensed\b/i, "licensed"],
  [/\binsured\b/i, "insured"],
  [/\bbonded\b/i, "bonded"],
  [/\bwarrant(y|ies|ied)\b/i, "warranty"],
  [/\bguarantee/i, "guarantee"],
  [/\b(top|highly) rated\b|\bstar rating|\bfive star\b|\bcustomer reviews\b|\bour reviews\b|\btestimonial/i, "reviews or ratings"],
  [/\baward/i, "awards"],
  [/\b(family|locally|veteran) owned\b/i, "ownership claim"],
  [/\b(based|headquartered) (in|out of)\b/i, "where the business is based"],
  [/\bfinancing\b/i, "financing"],
  [/\bsame day\b|\bwithin (an|one|two|a few) (hour|hours|business day|business days)\b/i, "response time"],
  [/\b(trex|timbertech|azek|fiberon|deckorators|yellawood|wolmanized)\b/i, "product brand"],
  [/\$|%|\bpercent\b/i, "price or percentage"],
];
const HYPE = ["elevate", "seamless", "unleash", "transform", "dream", "stunning", "unparalleled", "top notch",
  "world class", "state of the art", "look no further", "nestled", "tapestry", "delve", "testament",
  "effortless", "oasis", "sanctuary", "game changer", "revolutionize", "breathtaking"];

const DECK = /\b(deck|decks|decking)\b/gi;
const FENCE = /\b(fence|fences|fencing)\b/gi;
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const count = (text, re) => (text.match(new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g")) || []).length;
const phrase = (p) => new RegExp(`\\b${esc(p)}\\b`, "gi");
const words = (text) => text.match(/[A-Za-z0-9']+/g) || [];
const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g;
const plain = (s) => s.replace(linkRe, "$1");
const links = (s) => [...s.matchAll(linkRe)].map((m) => ({ text: m[1], href: m[2] }));

// Every string a reader sees on the page, in reading order.
function pieces(page) {
  const out = [];
  if (page.dek) out.push({ kind: "dek", text: page.dek });
  if (page.intro) out.push({ kind: "intro", text: page.intro });
  for (const s of page.sections || []) {
    out.push({ kind: "heading", text: s.heading || "" });
    for (const p of s.paragraphs || []) out.push({ kind: "para", text: p });
  }
  for (const f of page.faqs || []) {
    out.push({ kind: "q", text: f.q || "" });
    out.push({ kind: "a", text: f.a || "" });
  }
  return out;
}
const bodyText = (page) => pieces(page).filter((p) => p.kind !== "heading").map((p) => plain(p.text)).join("\n");

function checkPage(label, page, rules) {
  const fail = [];
  const warn = [];
  if (!page || typeof page !== "object") return { label, fail: ["missing page object"], warn, stats: {} };
  const all = pieces(page);
  const body = bodyText(page);
  const n = words(body).length;
  const stats = { words: n };

  // Shape
  const secs = page.sections || [];
  const faqs = page.faqs || [];
  if (rules.intro && !page.intro) fail.push("missing intro");
  if (secs.length < rules.sections[0] || secs.length > rules.sections[1]) fail.push(`sections ${secs.length}, want ${rules.sections.join(" to ")}`);
  if (faqs.length !== rules.faqs) fail.push(`faqs ${faqs.length}, want ${rules.faqs}`);
  if (n < rules.words[0] || n > rules.words[1]) fail.push(`words ${n}, want ${rules.words.join(" to ")}`);

  // Description
  const d = page.description || "";
  if (d.length < 120 || d.length > 155) fail.push(`description ${d.length} chars, want 120 to 155`);
  for (const must of rules.descMust || []) if (!new RegExp(esc(must), "i").test(d)) fail.push(`description must mention "${must}"`);

  // Keywords
  for (const [name, re, lo, hi] of rules.counts || []) {
    const c = count(body, re);
    stats[name] = c;
    if (c < lo || (hi && c > hi)) fail.push(`${name} ${c}, want ${hi ? `${lo} to ${hi}` : `at least ${lo}`}`);
  }

  // Headings and lengths
  let headingsWithCity = 0;
  for (const s of secs) {
    const h = s.heading || "";
    if (h.length > 70) fail.push(`heading over 70 chars: "${h}"`);
    if (h.includes("?")) fail.push(`heading has a question mark: "${h}"`);
    if (rules.city && phrase(rules.city).test(h)) headingsWithCity++;
    const caps = h.split(/\s+/).filter((w) => /^[A-Z]/.test(w)).length;
    if (h.split(/\s+/).length > 3 && caps / h.split(/\s+/).length > 0.6) warn.push(`heading looks Title Case: "${h}"`);
    for (const p of s.paragraphs || []) {
      const w = words(plain(p)).length;
      if (w < 40 || w > 140) fail.push(`paragraph of ${w} words under "${h}", want 40 to 140`);
    }
  }
  if (rules.cityHeadings && headingsWithCity < rules.cityHeadings) fail.push(`${headingsWithCity} headings name ${rules.city}, want at least ${rules.cityHeadings}`);
  for (const f of faqs) {
    const w = words(plain(f.a || "")).length;
    if (w < 40 || w > 110) fail.push(`FAQ answer of ${w} words: "${f.q}"`);
    if (!(f.q || "").trim().endsWith("?")) fail.push(`FAQ question should end with a question mark: "${f.q}"`);
  }
  if (page.dek) {
    const w = words(page.dek).length;
    if (w < 20 || w > 45) fail.push(`dek of ${w} words, want 20 to 45`);
  }

  // Neighborhoods
  if (rules.neighborhoods) {
    const core = (nb) => nb.replace(/^the /i, "").replace(/ (area|corridor)$/i, "");
    const hit = rules.neighborhoods.some((nb) => new RegExp(esc(core(nb)), "i").test(body));
    if (!hit) fail.push("mention at least one neighborhood from the list");
  }

  // Links
  const found = all.flatMap((p) => links(p.text));
  stats.links = found.length;
  for (const l of found) {
    if (!allowedPaths.has(l.href)) fail.push(`link to a path that does not exist: ${l.href}`);
    if (/click here|read more|this page/i.test(l.text)) fail.push(`weak anchor text: "${l.text}"`);
  }
  if (found.length < rules.links[0] || found.length > rules.links[1]) fail.push(`${found.length} inline links, want ${rules.links.join(" to ")}`);
  for (const [why, test] of rules.linkMust || []) if (!found.some((l) => test(l.href))) fail.push(`needs a link to ${why}`);

  // Hard copy rules, on every visible string including headings and the description
  const visible = [d, ...all.map((p) => plain(p.text))];
  for (const text of visible) {
    if (/[-‐-―−]/.test(text)) fail.push(`dash in: "${text.slice(0, 90)}"`);
    let stripped = text;
    for (const nm of DIGIT_NAMES) stripped = stripped.split(nm).join("");
    if (/\d/.test(stripped)) fail.push(`digit in: "${text.slice(0, 90)}"`);
  }
  const joined = visible.join("\n");
  for (const [re, name] of CLAIMS) if (re.test(joined)) fail.push(`unconfirmed claim (${name}): "${joined.match(re)[0]}"`);
  for (const h of HYPE) if (phrase(h).test(joined)) fail.push(`hype word: "${h}"`);
  const triples = count(body, /\b\w+, \w+(?: \w+)?,? (and|or) \w+/g);
  if (triples > 6) warn.push(`${triples} lists of three, consider varying the rhythm`);

  return { label, fail, warn, stats, body, description: d };
}

function cityRules(city, kind) {
  const nb = city.neighborhoods;
  const base = { city: city.name, neighborhoods: nb, intro: true, links: [2, 4], linkMust: [["a guide", (h) => h.startsWith("/guides/")]] };
  if (kind === "hub") return { ...base, words: [850, 1150], sections: [4, 6], faqs: 3, descMust: [city.name],
    counts: [["city", phrase(city.name), 16, 28], ["deck words", DECK, 8], ["fence words", FENCE, 8]] };
  if (kind === "deck") return { ...base, words: [1150, 1450], sections: [5, 7], faqs: 5, descMust: [city.name, "deck"], cityHeadings: 2,
    counts: [["city", phrase(city.name), 12, 18], ["deck words", DECK, 28, 48], ["deck builder", /\bdeck builders?\b/gi, 2]] };
  return { ...base, words: [1150, 1450], sections: [5, 7], faqs: 5, descMust: [city.name, "fence"], cityHeadings: 2,
    counts: [["city", phrase(city.name), 12, 18], ["fence words", FENCE, 28, 48], ["fence installation", phrase("fence installation"), 2],
      ["fence company", phrase("fence company"), 1], ["privacy fence", /\bprivacy fences?\b/gi, 2]] };
}

function guideRules(g) {
  const counts = g.service === "deck" ? [["deck words", DECK, 18]] : g.service === "fence" ? [["fence words", FENCE, 18]]
    : [["deck words", DECK, 10], ["fence words", FENCE, 10]];
  return { words: [1300, 1900], sections: [6, 9], faqs: 3, counts, links: [2, 6],
    linkMust: [["/decks/ or /fences/", (h) => h === "/decks/" || h === "/fences/"],
      ["/service-areas/ or a city page", (h) => h === "/service-areas/" || /-tn\/$/.test(h)]] };
}

const PAGE_RULES = {
  decks: { words: [1300, 1700], sections: [5, 9], faqs: 5, intro: true, counts: [["deck words", DECK, 40, 70]], links: [3, 8], descMust: ["deck"],
    linkMust: [["a guide", (h) => h.startsWith("/guides/")]] },
  fences: { words: [1300, 1700], sections: [5, 9], faqs: 5, intro: true, counts: [["fence words", FENCE, 40, 70]], links: [3, 8], descMust: ["fence"],
    linkMust: [["a guide", (h) => h.startsWith("/guides/")]] },
  porches: { words: [900, 1400], sections: [4, 7], faqs: 4, intro: true, counts: [["porch words", /\b(porch|porches|gazebo|gazebos|pavilion|pavilions)\b/gi, 20]], links: [3, 6], descMust: ["porch"],
    linkMust: [["a guide", (h) => h.startsWith("/guides/")]] },
  "service-areas": { words: [600, 900], sections: [3, 6], faqs: 3, intro: true, counts: [], links: [2, 6] },
  home: { words: [450, 800], sections: [2, 3], faqs: 4, counts: [["deck words", DECK, 6], ["fence words", FENCE, 6]], links: [2, 6] },
};

const results = [];
const load = (path) => (existsSync(new URL(path, root)) ? readJson(path) : null);

function runCity(slug) {
  const city = cityBySlug[slug];
  if (!city) return results.push({ label: slug, fail: [`unknown city ${slug}`], warn: [], stats: {} });
  const data = load(`src/content/cities/${slug}.json`);
  if (!data) return results.push({ label: slug, fail: ["file missing"], warn: [], stats: {} });
  for (const kind of ["hub", "deck", "fence"]) {
    const r = checkPage(`${slug} ${kind}`, data[kind], cityRules(city, kind));
    r.group = kind; r.city = slug;
    results.push(r);
  }
  const dk = results.find((r) => r.label === `${slug} deck`);
  const fn = results.find((r) => r.label === `${slug} fence`);
  if (dk?.body && fn?.body) {
    const sim = containment(shingles(dk.body, 6, city.name), shingles(fn.body, 6, city.name));
    if (sim > 0.12) fn.fail.push(`repeats ${pct(sim)} of the deck page phrasing, want under 12 percent`);
  }
}
function runGuide(slug) {
  const g = guideBySlug[slug];
  if (!g) return results.push({ label: slug, fail: [`unknown guide ${slug}`], warn: [], stats: {} });
  const data = load(`src/content/guides/${slug}.json`);
  if (!data) return results.push({ label: `guide ${slug}`, fail: ["file missing"], warn: [], stats: {} });
  const r = checkPage(`guide ${slug}`, data, guideRules(g));
  r.group = "guide";
  results.push(r);
}
function runPage(name) {
  const rules = PAGE_RULES[name];
  if (!rules) return results.push({ label: name, fail: [`unknown page ${name}`], warn: [], stats: {} });
  const data = load(`src/content/pages/${name}.json`);
  if (!data) return results.push({ label: `page ${name}`, fail: ["file missing"], warn: [], stats: {} });
  const page = name === "home" && !data.description ? { ...data, description: "Home page extras use the description in index.astro, so this check is skipped here." } : data;
  const r = checkPage(`page ${name}`, page, rules);
  if (page !== data) r.description = undefined;
  r.group = "page";
  results.push(r);
}

// Repeated phrasing
function shingles(text, n, cityName) {
  let t = text.toLowerCase();
  if (cityName) t = t.split(cityName.toLowerCase()).join("cityname");
  const w = words(t);
  const set = new Set();
  for (let i = 0; i + n <= w.length; i++) set.add(w.slice(i, i + n).join(" "));
  return set;
}
function containment(a, b) {
  if (!a.size) return 0;
  let hit = 0;
  for (const s of a) if (b.has(s)) hit++;
  return hit / a.size;
}
const pct = (x) => `${Math.round(x * 1000) / 10}%`.replace("%", " percent");

function crossChecks() {
  const byGroup = {};
  for (const r of results) if (r.body && ["hub", "deck", "fence"].includes(r.group)) (byGroup[r.group] ||= []).push(r);
  for (const [group, list] of Object.entries(byGroup)) {
    const sh = list.map((r) => shingles(r.body, 6, cityBySlug[r.city].name));
    for (let i = 0; i < list.length; i++) {
      let worst = 0, worstWith = "";
      for (let j = 0; j < list.length; j++) {
        if (i === j) continue;
        const c = containment(sh[i], sh[j]);
        if (c > worst) { worst = c; worstWith = list[j].city; }
      }
      list[i].stats.maxShared = pct(worst);
      if (worst > 0.15) list[i].fail.push(`shares ${pct(worst)} of its phrasing with ${worstWith} ${group}, want under 15 percent`);
    }
  }
  const descs = {};
  for (const r of results) if (r.description) (descs[r.description] ||= []).push(r.label);
  for (const [d, labels] of Object.entries(descs)) if (labels.length > 1) results.find((r) => r.label === labels[1]).fail.push(`duplicate description with ${labels[0]}`);
}

function parkerOverlap() {
  const dir = process.env.PARKER_TEXT_DIR;
  if (!dir || !existsSync(dir)) return;
  const texts = readdirSync(dir).filter((f) => f.endsWith(".txt")).map((f) => shingles(readFileSync(join(dir, f), "utf8"), 8));
  const pool = new Set(texts.flatMap((s) => [...s]));
  for (const r of results) {
    if (!r.body) continue;
    const c = containment(shingles(r.body, 8), pool);
    r.stats.parker = pct(c);
    if (c > 0.03) r.fail.push(`shares ${pct(c)} of its phrasing with parkerconstructioncompany.com, want under 3 percent`);
  }
}

// Main
const [mode, ...names] = process.argv.slice(2);
const listDir = (d) => (existsSync(new URL(d, root)) ? readdirSync(new URL(d, root)).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5)) : []);
if (mode === "cities") names.forEach(runCity);
else if (mode === "guides") names.forEach(runGuide);
else if (mode === "pages") names.forEach(runPage);
else if (mode === "all") {
  listDir("src/content/cities/").forEach(runCity);
  listDir("src/content/guides/").forEach(runGuide);
  listDir("src/content/pages/").forEach(runPage);
  crossChecks();
} else {
  console.error("Usage: node tools/content-check.mjs cities|guides|pages <names...> | all");
  process.exit(2);
}
parkerOverlap();

let failed = 0;
for (const r of results) {
  const s = Object.entries(r.stats).map(([k, v]) => `${k} ${v}`).join(", ");
  console.log(`${r.fail.length ? "FAIL" : "ok  "}  ${r.label}  (${s})`);
  for (const f of r.fail) console.log(`      x ${f}`);
  for (const w of r.warn) console.log(`      ! ${w}`);
  if (r.fail.length) failed++;
}
console.log(failed ? `\n${failed} of ${results.length} pages need work.` : `\nAll ${results.length} pages pass.`);
process.exit(failed ? 1 : 0);
