// Real project photos from the owner. Captions describe only what each photo shows.
import woodPrivacy from "../assets/photos/work/wood-privacy-fence-cap.jpg";
import vinylPrivacy from "../assets/photos/work/vinyl-privacy-fence-slope.jpg";
import horizontalBoard from "../assets/photos/work/horizontal-board-fence.jpg";
import blackMetal from "../assets/photos/work/black-metal-fence-front-yard.jpg";
import boardGarden from "../assets/photos/work/board-fence-garden-gate.jpg";
import chainCourt from "../assets/photos/work/chain-link-court-gate.jpg";
import chainDogPark from "../assets/photos/work/chain-link-dog-park.jpg";
import chainPlayground from "../assets/photos/work/chain-link-playground.jpg";
import chainCourtWide from "../assets/photos/work/chain-link-court-wide.jpg";
import deckBalusters from "../assets/photos/work/deck-black-balusters.jpg";
import deckWirePool from "../assets/photos/work/deck-wire-railing-pool.jpg";
import whiteDeckPorch from "../assets/photos/work/white-deck-screened-porch.jpg";
import whiteDeckSide from "../assets/photos/work/white-deck-porch-side.jpg";
import chainDriveGate from "../assets/photos/work/chain-link-drive-gate.jpg";
import shadowbox from "../assets/photos/work/shadowbox-dumpster-enclosure.jpg";
import coveredInside from "../assets/photos/work/covered-deck-inside.jpg";
import chainCourtClose from "../assets/photos/work/chain-link-court-close.jpg";
import coveredDeck from "../assets/photos/work/covered-deck-stairs.jpg";

export const work = {
  woodPrivacy: {
    src: woodPrivacy,
    caption: "Wood privacy fence with a cap board",
    alt: "Long run of new pressure treated wood privacy fence with a flat cap board along a tree lined backyard",
  },
  vinylPrivacy: {
    src: vinylPrivacy,
    caption: "Vinyl privacy fence following a slope",
    alt: "Light colored vinyl privacy fence running along a long sloping fence line beside a barn with a green metal roof",
  },
  horizontalBoard: {
    src: horizontalBoard,
    caption: "Horizontal board fence",
    alt: "New horizontal board fence in pressure treated pine running from the corner of a house and turning along the side yard",
  },
  blackMetal: {
    src: blackMetal,
    caption: "Black metal fence around a front yard",
    alt: "Black metal picket fence around the front yard of a red brick ranch house",
  },
  boardGarden: {
    src: boardGarden,
    caption: "Wood rail fence around a garden",
    alt: "New wood rail fence around a large backyard vegetable garden, with sheds behind it",
  },
  chainCourt: {
    src: chainCourt,
    caption: "Black chain link fence and gate around a court",
    alt: "Black chain link fence with a walk gate around a new concrete court, with a sidewalk leading to the gate",
  },
  chainDogPark: {
    src: chainDogPark,
    caption: "Black chain link fence around a dog park",
    alt: "Black chain link fence around a dog park with a gravel strip and a bench, beside a sidewalk at an apartment community",
  },
  chainPlayground: {
    src: chainPlayground,
    caption: "Black chain link fence around a playground",
    alt: "Black chain link fence around a grassy play area with a shaded playground behind it",
  },
  chainCourtWide: {
    src: chainCourtWide,
    caption: "Black chain link fence around a new court",
    alt: "Black chain link fence enclosing a new concrete court on a lawn, with trees and a brick building behind it",
  },
  deckBalusters: {
    src: deckBalusters,
    caption: "Deck frame with black metal balusters",
    alt: "New pressure treated deck frame with wood rails and black metal balusters beside a brick house, before the decking goes down",
  },
  deckWirePool: {
    src: deckWirePool,
    caption: "Deck with wire panel railings by a pool",
    alt: "New pressure treated deck with wire panel railings, dark handrails, and wide steps, beside an above ground pool",
  },
  whiteDeckPorch: {
    src: whiteDeckPorch,
    caption: "White deck and stairs with a screened porch",
    alt: "White painted raised deck with stairs and black balusters next to a screened porch on the back of a brick house",
  },
  whiteDeckSide: {
    src: whiteDeckSide,
    caption: "Raised white deck with stairs",
    alt: "Raised white deck with a railing and stairs on tall posts, attached to a screened porch on a brick house",
  },
  chainDriveGate: {
    src: chainDriveGate,
    caption: "Black chain link fence with a drive gate",
    alt: "Black chain link fence along a yard with a double drive gate across a gravel driveway",
  },
  chainCourtClose: {
    src: chainCourtClose,
    caption: "Black chain link fence around a court, up close",
    alt: "Close view through a new black chain link fence of a concrete court with blue lines, trees behind it",
  },
  coveredDeck: {
    src: coveredDeck,
    caption: "Covered deck with stairs and wood railings",
    alt: "Finished raised pressure treated deck with a covered roof, wood railings, and stairs to the yard on the back of a gray two story house",
  },
  coveredInside: {
    src: coveredInside,
    caption: "Under a covered deck with a wood ceiling",
    alt: "View along a covered deck with a tongue and groove wood ceiling, wood railings, and a view of open fields",
  },
  shadowbox: {
    src: shadowbox,
    caption: "Shadowbox wood fence around a dumpster",
    alt: "New shadowbox style wood fence with gates enclosing a dumpster at a townhome community",
  },
};

const order = ["woodPrivacy", "vinylPrivacy", "chainCourt", "horizontalBoard", "chainPlayground", "blackMetal", "chainDogPark", "boardGarden", "chainCourtWide", "chainDriveGate", "shadowbox", "chainCourtClose"];
// Three photos per city page, rotated so neighboring cities do not show the same set.
export function fencePhotosFor(index) {
  return [0, 1, 2].map((k) => work[order[(index * 3 + k * 2) % order.length]]);
}

const deckOrder = ["deckWirePool", "coveredInside", "whiteDeckPorch", "deckBalusters", "whiteDeckSide", "coveredDeck"];
export function deckPhotosFor(index) {
  return [0, 1, 2].map((k) => work[deckOrder[(index * 2 + k) % deckOrder.length]]);
}
