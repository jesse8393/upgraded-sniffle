# Content spec for writers

Read `PRODUCT.md` first. Everything there applies. This file says what to write, where to put it, and the gates it must pass.

Every content file is JSON. The page templates add the H1, breadcrumbs, the neighborhood list, the four step process, links to nearby cities and guides, and the estimate form. Do not write any of those yourself.

Run the checker on your file until it passes:

```sh
cd sites/completedeckandfence
node tools/content-check.mjs cities murfreesboro
node tools/content-check.mjs guides fence-on-a-slope
node tools/content-check.mjs pages decks
```

## URLs you may link to

Inline links use markdown syntax inside a paragraph: `[anchor text](/path/)`. Only these paths are allowed, and the checker rejects anything else.

* `/` home, `/decks/`, `/fences/`, `/service-areas/`, `/guides/`
* `/{city}-tn/` city page, for example `/murfreesboro-tn/`
* `/deck-builder-{city}-tn/` and `/fence-company-{city}-tn/`
* `/guides/{slug}/` for any slug in `src/data/guides.json`
* `#estimate` for the estimate form on the same page

Use two to four inline links per page, at least one of them to a guide. Anchor text should read naturally, never "click here".

## City file: `src/content/cities/{slug}.json`

Facts for each city (name, county, neighborhoods, nearby cities, and a short seed of widely known local details) are in `src/data/cities.json`. Use only those facts plus general knowledge you are sure of.

```json
{
  "slug": "murfreesboro",
  "hub":   { "description": "", "intro": "", "sections": [ { "heading": "", "paragraphs": [""] } ], "faqs": [ { "q": "", "a": "" } ] },
  "deck":  { "description": "", "intro": "", "sections": [], "faqs": [] },
  "fence": { "description": "", "intro": "", "sections": [], "faqs": [] }
}
```

Three pages come from one city file:

* `hub` renders at `/{city}-tn/` with the H1 "Decks and fences in {City}, TN". It introduces both services for that city and points to the two service pages.
* `deck` renders at `/deck-builder-{city}-tn/` with the H1 "Deck builder in {City}, TN".
* `fence` renders at `/fence-company-{city}-tn/` with the H1 "Fence installation in {City}, TN".

Targets, counted over intro, section paragraphs, and FAQ questions and answers:

* hub: 850 to 1,150 words. City name 16 to 28 times. Deck words (deck, decks, decking) at least 8. Fence words (fence, fences, fencing) at least 8. Four to six sections. Three FAQs.
* deck: 1,150 to 1,450 words. City name 12 to 18 times. Deck words 28 to 48. "deck builder" or "deck builders" at least twice. Five to seven sections. Five FAQs.
* fence: 1,150 to 1,450 words. City name 12 to 18 times. Fence words 28 to 48. "fence installation" at least twice, "fence company" at least once, "privacy fence" at least twice. Five to seven sections. Five FAQs.

These match the depth of the Parker Construction city pages, about 1,400 words per page once the template sections are added.

Other rules for every page:

* description: 120 to 155 characters, names the city and the service, and is unique across the site.
* headings: sentence case, 70 characters or fewer, no question marks. On deck and fence pages at least two headings name the city.
* paragraphs: 40 to 140 words each.
* FAQ answers: 40 to 110 words each. Questions should be the ones homeowners in that city actually ask.
* Mention at least one neighborhood from the city's list, naturally. Never invent a neighborhood, street, business, or landmark.

## What makes a city page worth reading

Each page must be about that city. Build it from the seed: terrain, soil and rock, lake or river lots, historic review, HOA density, rural acreage, rental property, new construction yards. A homeowner in that city should recognize their situation in the first two paragraphs. If a paragraph would still be true after swapping in another city's name, rewrite it.

The deck and fence pages for the same city must not repeat each other. The hub is a short overview, not a copy of either.

## Guide file: `src/content/guides/{slug}.json`

Title, keyword, and angle for each guide are in `src/data/guides.json`.

```json
{ "slug": "", "description": "", "dek": "", "sections": [ { "heading": "", "paragraphs": [""] } ], "faqs": [ { "q": "", "a": "" } ] }
```

* 1,300 to 1,900 words. `dek` is one or two sentences under the title, 20 to 45 words.
* Six to nine sections, three FAQs.
* The service word (deck words or fence words) at least 18 times. Guides with service "both" need at least 10 of each.
* Link to at least one service hub (`/decks/` or `/fences/`) and `/service-areas/` or a city page.

## Page files: `src/content/pages/{name}.json`

Same shape as a guide without `dek`. Names and targets:

* `decks`: the deck service hub at `/decks/`. 1,300 to 1,700 words, deck words 40 to 70, five FAQs.
* `fences`: the fence service hub at `/fences/`. 1,300 to 1,700 words, fence words 40 to 70, five FAQs.
* `service-areas`: 600 to 900 words about how the service area works, three FAQs. The template adds the city list.
* `home`: extra sections under the existing home page. 450 to 800 words, two or three sections, four FAQs.

## Hard rules, all enforced by the checker

* No dashes of any kind, including hyphens inside words. Write "pressure treated", "board on board", "two story", "low maintenance".
* No digits, except inside names that already contain them (12 South, Highway 56, I 24) and 811. Spell out small numbers. Never give prices, percentages, measurements, code requirements, or timelines as numbers.
* Never state a fact about the business that the owner has not confirmed. Banned claims include years in business, licensed, insured, bonded, warranty, guarantee, free estimates, reviews or ratings, awards, family owned, locally owned, where the business is based, crew size, financing, specific response times, and specific product brands we install.
* Local facts must be widely known and safe: rivers, lakes, counties, terrain, soil, historic districts, growth. No statistics, no permit fees, no setback distances, no height limits, no named officials. When rules matter, say rules vary and tell the reader to confirm with the city or county codes office or their HOA.
* No hype words: elevate, seamless, unleash, transform, dream, stunning, unparalleled, top notch, world class, state of the art, look no further, nestled, tapestry, delve, testament, effortless, oasis, sanctuary.
* Plain voice. Short sentences. "You" and "we". Concrete nouns. Do not stack lists of three in every paragraph.
* Write fresh. Do not copy or closely paraphrase any existing site, including parkerconstructioncompany.com. The checker measures overlap.
