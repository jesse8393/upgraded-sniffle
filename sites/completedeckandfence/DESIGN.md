# Complete Deck & Fence design system

The yard sign, scaled up to a web page. The values below are CSS custom properties in `styles.css`.

## Color

OKLCH, with hex fallbacks for older browsers. Every neutral leans slightly toward the red's hue so the page feels like one material.

* red: oklch(0.575 0.225 27.5). The C, calls to action, and the estimate section.
* red press: oklch(0.505 0.2 27.5). Hover and pressed red, and error text.
* ink: oklch(0.205 0.008 30). Text and the black blocks.
* ink 2: oklch(0.33 0.01 30). Secondary text.
* muted: oklch(0.47 0.012 30). Helper text and step descriptions.
* paper: oklch(0.978 0.004 45). Page background.
* paper 2: oklch(0.952 0.005 45). The service area section.
* line: oklch(0.885 0.008 45). Hairlines and input borders.
* white: oklch(0.995 0.002 40). Text on dark and red, the form panel.
* night: oklch(0.165 0.006 30). Footer.

Strategy: committed. Paper and ink carry most of the page. Red owns one full section (the estimate) plus the C and the calls to action.

Checked contrast: white on red 4.8 to 1, ink on paper 16.8 to 1, muted on paper 6.4 to 1, muted on paper 2 at 6.0 to 1, red text on paper 4.6 to 1.

## Type

* Archivo 800 for headlines, with tight tracking.
* Archivo at 125 percent width in tracked caps for the location line, matching DECK & FENCE in the logo.
* Instrument Sans for body copy at 18px.
* Newsreader 600, upright, only for the tagline, as it appears on the yard sign.

Scale: 14.5, 18, 23, 30 to 40, 34 to 56, and 42 to 88 pixels.

## Shape

Radius 6px on buttons and the form panel, 4px on photos, inputs, and chips. No shadows. Rules separate content instead of cards: 2px ink on top, 1px line between.

## Signature

The red C from the logo, used as the bracket that grips the hero photo and as the list bullet. Nowhere else.

## Motion

One orchestrated moment on load: the headline rises, the photo settles, and the C draws in. Buttons lift 2px on hover and press to 98 percent. Exponential ease out. Nothing moves on scroll. All motion turns off under reduced motion settings.

## Components

* Buttons: red for the main action, dark, light, and outline.
* Text link: bold, with a 2px red underline and an arrow.
* Form: labels above inputs, helper text and inline errors below, square chips for single choice.
* Concept tag: a small dark label on any placeholder photo.

## Checks

Run `node tools/slop-check.mjs` from this folder before shipping. It fails on dashes in visible copy, banned CSS patterns, and banned words.
