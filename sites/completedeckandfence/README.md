# Complete Deck & Fence website

Static site for completedeckandfence.com. No build step: plain HTML, CSS, and JS.

## Run locally

```sh
cd sites/completedeckandfence
python3 -m http.server 4173
# open http://localhost:4173
```

## Before launch

Fill in `SITE` at the top of `main.js`:

* `phone` shows click to call links in the nav, the estimate section, and the footer.
* `email` shows in the footer and is the form fallback (it opens an email).
* `formEndpoint` is a URL that receives estimate requests as a JSON POST (Formspree, a Supabase edge function, and so on).

Empty values stay hidden, so nothing fake ever shows.

Then work through the "Unconfirmed, needs the owner" list in `PRODUCT.md`. The big ones:

* Photos in `assets/` are cropped from AI concept images and carry a "Concept image" label. Swap in real project photos and remove the labels.
* Confirm the service lists under Custom decks and Privacy fences.
* Add specific towns to the service area once confirmed.

## Design rules

* `PRODUCT.md` covers who the site is for, the brand, the tone, and what to avoid.
* `DESIGN.md` covers colors, type, spacing, motion, and components.
* `node tools/slop-check.mjs` fails on dashes in visible copy, hype words, and banned CSS patterns. Run it before every deploy.

## Deploy

Point any static host at this folder (Vercel, Netlify, Cloudflare Pages). On Vercel, set the project Root Directory to `sites/completedeckandfence` with no build command.

## Files

* `index.html`: page markup, SEO meta, LocalBusiness structured data
* `styles.css`: design tokens and layout
* `main.js`: contact config, mobile menu, estimate form
* `fonts/`: self hosted Archivo, Instrument Sans, Newsreader (SIL Open Font License)
* `assets/`: logo variants, favicon mark, photos
* `tools/slop-check.mjs`: the anti slop checker
