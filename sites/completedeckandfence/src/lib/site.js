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
  phone: "",          // e.g. "(615) 555 0100"
  email: "",          // e.g. "hello@completedeckandfence.com"
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
  fences: "/fences/",
  porches: "/porches/",
  areas: "/service-areas/",
  guides: "/guides/",
  privacy: "/privacy-policy/",
  cityHub: (slug) => `/${slug}-tn/`,
  deckCity: (slug) => `/deck-builder-${slug}-tn/`,
  fenceCity: (slug) => `/fence-company-${slug}-tn/`,
  guide: (slug) => `/guides/${slug}/`,
};
export const absolute = (path) => new URL(path, SITE.url).href;

// Titles stay at 60 characters or fewer so search results never cut them off.
const BRAND = ` | ${SITE.name}`;
export function pageTitle(text) {
  if (!text) return `Decks and Fences in Middle TN${BRAND}`;
  const full = `${text}${BRAND}`;
  if (full.length <= 60) return full;
  if (text.length <= 60) return text;
  throw new Error(`Title over 60 characters: "${text}"`);
}

export const phoneDigits = SITE.phone.replace(/\D/g, "");
export const phoneHref = phoneDigits ? `tel:+1${phoneDigits.slice(-10)}` : "";

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
    knowsAbout: ["Deck building", "Deck replacement", "Deck repair", "Fence installation", "Fence repair", "Privacy fences", "Gates", "Covered porches", "Screened porches", "Gazebos"],
  };
  if (SITE.phone) data.telephone = `+1${phoneDigits.slice(-10)}`;
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
export const stripLinks = (s = "") => s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");
const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export function inlineHtml(s = "") {
  let out = "";
  let last = 0;
  for (const m of s.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)) {
    out += escapeHtml(s.slice(last, m.index));
    out += `<a href="${escapeHtml(m[2])}">${escapeHtml(m[1])}</a>`;
    last = m.index + m[0].length;
  }
  return out + escapeHtml(s.slice(last));
}
export const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Date the guides were first published. Update a guide's entry in guides.json
// with an "updated" date when its content changes.
export const PUBLISHED = "2026-09-26";
