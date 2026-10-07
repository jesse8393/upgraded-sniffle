import { SITE, phoneDisplay, cities, guides, paths, getCityContent, getGuideContent } from "../lib/site.js";

// A plain summary for AI crawlers. Only confirmed facts go here.
export function GET() {
  const live = cities.filter((c) => getCityContent(c.slug));
  const lines = [
    `# ${SITE.name}`,
    "",
    `> ${SITE.name} builds decks and fences for homeowners across ${SITE.region}. ${SITE.tagline}`,
    "",
    "## Services",
    `* [Decks](${SITE.url}${paths.decks}): new decks, replacements, stairs, and railings in wood or composite.`,
    `* [Trex decks](${SITE.url}${paths.trex}): Trex composite deck installation, on new decks and on sound existing frames.`,
    `* [Fences](${SITE.url}${paths.fences}): wood privacy fences, horizontal board fences, vinyl privacy fences, black metal fences, black chain link fences, and rail fences.`,
    "* Repairs for decks and fences. Estimates are free.",
    "",
    "## Cities",
    ...live.map((c) => `* [${c.name}, TN](${SITE.url}${paths.cityHub(c.slug)}): [decks](${SITE.url}${paths.deckCity(c.slug)}), [fences](${SITE.url}${paths.fenceCity(c.slug)})`),
    "",
    "## Guides",
    ...guides.filter((g) => getGuideContent(g.slug)).map((g) => `* [${g.title}](${SITE.url}${paths.guide(g.slug)})`),
    "",
    "## Contact",
    phoneDisplay ? `Phone: ${phoneDisplay}` : `Request an estimate at ${SITE.url}/#estimate`,
    ...(SITE.email ? [`Email: ${SITE.email}`] : []),
    `Contact page: ${SITE.url}${paths.contact}`,
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
