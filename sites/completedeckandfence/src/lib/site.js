// Business details and shared helpers for every page.
// Leave a contact value empty and everything that uses it stays hidden,
// including the structured data, so nothing unconfirmed is ever published.
import citiesData from "../data/cities.json";
import guidesData from "../data/guides.json";

export const SITE = {
  name: "Complete Deck & Fence",
  url: "https://completedeckandfence.com",
  tagline: "Built for better backyards.",
  region: "Middle Tennessee",
  phone: "(615) 913 5870", // any US format, e.g. "615 555 0100"; shown as (615) 555 0100, dialed and marked up as +16155550100
  email: "completedeckandfence@gmail.com",
  // Where the estimate form sends requests: any endpoint that accepts a JSON POST.
  formEndpoint: "/api/estimate/",
};

export const cities = citiesData;
export const cityBySlug = Object.fromEntries(cities.map((c) => [c.slug, c]));
export const guides = guidesData;
export const guideBySlug = Object.fromEntries(guides.map((g) => [g.slug, g]));

// Content written to docs/CONTENT_SPEC.md. Missing files return null so the
// build can report them instead of shipping an empty page.
const cityContent = import.meta.glob("../content/cities/*.json", { eager: true, import: "default" });
const guideContent = import.meta.glob("../content/guides/*.json", { eager: true, import: "default" });
const pageContent = import.meta.glob("../content/pages/*.json", { eager: true, import: "default" });
const pick = (map, dir, slug) => map[`../content/${dir}/${slug}.json`] ?? null;
export const getCityContent = (slug) => pick(cityContent, "cities", slug);
export const getGuideContent = (slug) => pick(guideContent, "guides", slug);
export const getPageContent = (name) => pick(pageContent, "pages", name);

export const paths = {
  home: "/",
  decks: "/decks/",
  trex: "/trex-decks/",
  fences: "/fences/",
  areas: "/service-areas/",
  guides: "/guides/",
  contact: "/contact/",
  thanks: "/thank-you/",
  privacy: "/privacy-policy/",
  terms: "/terms/",
  cityHub: (slug) => `/${slug}-tn/`,
  deckCity: (slug) => `/deck-builder-${slug}-tn/`,
  fenceCity: (slug) => `/fence-company-${slug}-tn/`,
  guide: (slug) => `/guides/${slug}/`,
};
export const absolute = (path) => new URL(path, SITE.url).href;

// Titles stay at 60 characters or fewer so search results never cut them off.
const BRAND = ` | ${SITE.name}`;
// One rule for browser titles: guides use their headline alone, and every other
// page ends with the business name, so those titles must fit 60 characters with it.
export function pageTitle(text, { brand = true } = {}) {
  if (!text) return `Decks and Fences in Middle TN${BRAND}`;
  const full = brand ? `${text}${BRAND}` : text;
  if (full.length <= 60) return full;
  throw new Error(`Title over 60 characters: "${full}"`);
}

// One phone number, two forms: phoneDisplay is what people read on every page and in
// llms.txt; phoneE164 is what the tel: links dial and what the business schema lists.
export const phoneDigits = SITE.phone.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
// A US number: ten digits, and neither the area code nor the exchange starts with 0 or 1.
if (SITE.phone && !/^[2-9]\d{2}[2-9]\d{6}$/.test(phoneDigits)) throw new Error(`SITE.phone needs a ten digit US number, got "${SITE.phone}"`);
export const phoneDisplay = phoneDigits ? `(${phoneDigits.slice(0, 3)}) ${phoneDigits.slice(3, 6)} ${phoneDigits.slice(6)}` : "";
export const phoneE164 = phoneDigits ? `+1${phoneDigits}` : "";
export const phoneHref = phoneE164 ? `tel:${phoneE164}` : "";
// The email split at the @, so pages can offer a line break there on narrow screens.
export const [emailUser = "", emailDomain = ""] = SITE.email.split("@");

// Counties in the order the service area page lists them.
export function citiesByCounty() {
  const groups = new Map();
  for (const c of cities) {
    const key = c.county;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(c);
  }
  return [...groups.entries()].map(([county, list]) => ({ county, cities: list.sort((a, b) => a.name.localeCompare(b.name)) }));
}

// Structured data: one business entity every page points back to.
export const BUSINESS_ID = `${SITE.url}/#business`;
export function businessSchema(logoUrl, imageUrl) {
  const data = {
    "@type": "HomeAndConstructionBusiness",
    "@id": BUSINESS_ID,
    name: SITE.name,
    url: `${SITE.url}/`,
    logo: logoUrl,
    image: imageUrl,
    slogan: SITE.tagline,
    areaServed: cities.map((c) => ({ "@type": "City", name: `${c.name}, TN` })),
    knowsAbout: ["Deck building", "Deck replacement", "Deck repair", "Trex composite decking", "Fence installation", "Fence repair", "Privacy fences", "Gates"],
  };
  if (phoneE164) data.telephone = phoneE164;
  if (SITE.email) data.email = SITE.email;
  return data;
}
export function breadcrumbSchema(items) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: absolute(it.href) })),
  };
}
export function faqSchema(faqs) {
  if (!faqs?.length) return null;
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: stripLinks(f.a) } })),
  };
}
export function serviceSchema({ name, serviceType, city, url, description }) {
  return {
    "@type": "Service",
    name,
    serviceType,
    description,
    url: absolute(url),
    provider: { "@id": BUSINESS_ID },
    areaServed: city ? { "@type": "City", name: `${city.name}, TN` } : { "@type": "State", name: "Tennessee" },
  };
}

// Inline links in content use [text](/path/). Everything else is escaped.
export const stripLinks = (s = "") => s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1").replace(/\*\*(.+?)\*\*/g, "$1");
const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// **bold** is also supported, for owner supplied guides.
const textHtml = (s) => escapeHtml(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
export function inlineHtml(s = "") {
  let out = "";
  let last = 0;
  for (const m of s.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)) {
    out += textHtml(s.slice(last, m.index));
    out += `<a href="${escapeHtml(m[2])}">${escapeHtml(m[1])}</a>`;
    last = m.index + m[0].length;
  }
  return out + textHtml(s.slice(last));
}
export const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Date the guides were first published. Update a guide's entry in guides.json
// with an "updated" date when its content changes.
export const PUBLISHED = "2026-09-26";
