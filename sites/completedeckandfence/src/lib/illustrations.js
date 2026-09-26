// AI generated images for types the owner has no project photo of yet.
// Always shown with an "Illustration" label so they are never mistaken for our work.
import compositeDeck from "../assets/photos/illustrations/composite-deck.jpg";
import cedarFence from "../assets/photos/illustrations/cedar-fence.jpg";
import steppedFence from "../assets/photos/illustrations/stepped-fence-slope.jpg";
import wornDeck from "../assets/photos/illustrations/worn-deck.jpg";
import deckStaining from "../assets/photos/illustrations/deck-staining.jpg";
import { work } from "./work.js";

const illo = (src, alt) => ({ src, alt, illustration: true });
const real = (item) => ({ src: item.src, alt: item.alt, caption: item.caption, illustration: false });

// One image per guide: a real project photo when one fits, otherwise a labeled illustration.
export const guideImages = {
  "deck-cost-middle-tennessee": real(work.coveredDeck),
  "wood-vs-composite-decking": illo(compositeDeck, "Gray composite deck with black metal railings behind a brick house"),
  "deck-permits-tennessee": real(work.whiteDeckSide),
  "signs-you-need-a-new-deck": illo(wornDeck, "Close view of an old gray deck with cracked boards and a rotted board end under a railing post"),
  "deck-maintenance-tennessee": illo(deckStaining, "Pressure treated deck half stained brown and half bare, with a can of stain on the bare boards"),
  "fence-cost-middle-tennessee": real(work.woodPrivacy),
  "privacy-fence-options": real(work.horizontalBoard),
  "cedar-vs-pressure-treated-fence": illo(cedarFence, "Reddish cedar privacy fence with square posts along a green backyard"),
  "fence-on-a-slope": illo(steppedFence, "Wood privacy fence built in level stepped sections down a sloped yard"),
  "best-fence-for-dogs": real(work.chainDriveGate),
  "fence-property-line-tennessee": real(work.vinylPrivacy),
  "hoa-approval-deck-fence": real(work.blackMetal),
};
