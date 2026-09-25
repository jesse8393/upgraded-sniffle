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

| Key | What it does |
| --- | --- |
| `phone` | Shows click to call links in the nav, estimate section, and footer |
| `email` | Shows in footer. Used as the form fallback (opens an email) |
| `formEndpoint` | URL that receives estimate requests as a JSON POST (Formspree, a Supabase edge function, etc) |

Empty values stay hidden, so nothing fake ever shows.

Also replace or confirm:

* **Photos** in `assets/` are cropped from AI concept images. Swap in real project photos (keep the file names or update `index.html`).
* **Service lists** under Decks and Fences. Confirm they match what the crew actually offers.
* **Service area.** Add specific cities once confirmed.

## Deploy

Point any static host at this folder (Vercel, Netlify, Cloudflare Pages). On Vercel, set the project Root Directory to `sites/completedeckandfence` with no build command.

## Files

* `index.html`: page markup, SEO meta, LocalBusiness structured data
* `styles.css`: design tokens and layout
* `main.js`: contact config, mobile menu, scroll reveals, estimate form
* `fonts/`: self hosted Archivo, Instrument Sans, Newsreader (SIL Open Font License)
* `assets/`: logo variants, favicon mark, photos
