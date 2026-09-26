# Complete Deck & Fence website

The full site for completedeckandfence.com, built with Astro as plain static pages: no server, no database, and almost no JavaScript.

## What gets built

* Home, `/decks/`, `/fences/`, `/service-areas/`, `/guides/`, and a privacy policy
* For each of the 21 cities in `src/data/cities.json`, three pages:
  * `/{city}-tn/`, decks and fences in that city
  * `/deck-builder-{city}-tn/`
  * `/fence-company-{city}-tn/`
* Twelve guides at `/guides/{slug}/`, listed in `src/data/guides.json`
* `sitemap-index.xml`, `robots.txt`, and `llms.txt`

The cities match the ones parkerconstructioncompany.com serves. Every page is written fresh, and none of Parker's text is reused.

## Commands

Run these from this folder:

```sh
npm install
npm run dev        # local preview while editing, http://localhost:4321
npm run build      # builds the site into dist/
npm run preview    # serves dist/ exactly as it will ship
```

Before every deploy, build first and then run all three checks:

```sh
npm run build
npm run check:content   # word counts, keywords, honesty rules, repeated phrasing
npm run check:seo       # titles, descriptions, canonicals, H1s, links, sitemap, schema
npm run check:slop      # no dashes, hype words, or banned design patterns
```

## Before launch

Fill in `SITE` at the top of `src/lib/site.js`:

* `phone` shows click to call links in the header, estimate sections, footer, and structured data.
* `email` shows in the footer and is the form fallback (it opens an email).
* `formEndpoint` is a URL that receives estimate requests as a JSON POST.

Empty values stay hidden, so nothing fake ever shows. Then work through the "Unconfirmed, needs the owner" list in `PRODUCT.md`. The biggest items are real project photos and confirming the service list.

## Editing content

All page copy lives in JSON under `src/content/`. The rules for writing it, including word and keyword targets, are in `docs/CONTENT_SPEC.md`. Check a file after editing it:

```sh
node tools/content-check.mjs cities murfreesboro
node tools/content-check.mjs guides fence-on-a-slope
node tools/content-check.mjs pages decks
```

## Deploy

`vercel.json` is ready for Vercel: set the project Root Directory to `sites/completedeckandfence`. It adds trailing slash redirects, security headers, and long caching for built assets. Any static host works too: build, then publish `dist/`.

After launch, follow `docs/BACKLINKS.md` for Search Console, Google Business Profile, citations, and links.

## Files

* `src/pages/`: page templates. `[slug].astro` builds all 63 city pages.
* `src/components/`: shared pieces such as the estimate form, FAQs, and breadcrumbs
* `src/layouts/Base.astro`: head tags, structured data, header, and footer
* `src/lib/site.js`: business details, URLs, titles, and structured data helpers
* `src/content/`: page copy as JSON
* `src/data/`: city facts and the guide list
* `src/styles/global.css`, `src/scripts/site.js`: design and behavior
* `public/fonts/`: self hosted Archivo, Instrument Sans, and Newsreader, subset to the characters the site uses (SIL Open Font License)
* `tools/`: the content, SEO, and slop checks
* `PRODUCT.md`, `DESIGN.md`: who the site is for and how it looks
* `docs/`: the content spec and the backlink plan
