// Image widths and sizes for every photo on the site.
// Each width is about 1.17 times the one before it, so the browser can always
// pick a file close to the size the photo is shown at. The sizes strings follow
// the grid math in global.css: content is 92vw wide until the 1240px wrap,
// then 1160px.
const STEPS = [160, 200, 240, 280, 320, 380, 440, 520, 600, 700, 820, 960, 1120, 1300, 1500, 1740, 2000];
export const widthsBetween = (min, max) => STEPS.filter((w) => w >= min && w <= max);

export const IMG = {
  // Home hero: full width on phones and tablets, 13 of 24 columns (capped at 1600px) on desktop.
  homeHero: { widths: widthsBetween(380, 1740), sizes: "(max-width: 900px) 100vw, min(55vw, 870px)" },
  // Wide photo band inside the wrap.
  band: { widths: widthsBetween(320, 2000), sizes: "(max-width: 1240px) 92vw, 1160px" },
  // Yard sign: full width below 860px, then 1.1 of 2.1 columns.
  yardSign: { widths: widthsBetween(320, 1300), sizes: "(max-width: 860px) 92vw, (max-width: 1240px) 46vw, 564px" },
  // Service hub hero: full width below 900px, then 1 of 2.35 columns.
  hubHero: { widths: widthsBetween(320, 1740), sizes: "(max-width: 900px) 92vw, (max-width: 1240px) 38vw, 464px" },
  // Guide figure spans the wrap.
  guide: { widths: widthsBetween(320, 2000), sizes: "(max-width: 1240px) 92vw, 1160px" },
  // Header logo matches .brand img { width: clamp(150px, 16vw, 200px) }.
  logo: { widths: [150, 200, 300, 400, 600], sizes: "(max-width: 937px) 150px, (max-width: 1250px) 16vw, 200px" },
};

// Work gallery: two columns on phones (the first of three spans both),
// three columns from 900px, four columns from 1100px when there are four photos.
export function gallerySizes(count, index) {
  if (count === 4) return "(max-width: 1099px) 45vw, (max-width: 1240px) 22vw, 266px";
  const three = "(max-width: 1240px) 30vw, 366px";
  if (count === 3 && index === 0) return `(max-width: 899px) 92vw, ${three}`;
  return `(max-width: 899px) 45vw, ${three}`;
}
export const galleryWidths = widthsBetween(160, 1740);
