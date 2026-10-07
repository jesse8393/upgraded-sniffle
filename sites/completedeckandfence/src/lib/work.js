// Real project photos from the owner. Captions describe only what each photo shows.
import woodPrivacy from "../assets/photos/work/wood-privacy-fence-cap.jpg";
import vinylPrivacy from "../assets/photos/work/vinyl-privacy-fence-slope.jpg";
import horizontalBoard from "../assets/photos/work/horizontal-board-fence.jpg";
import blackMetal from "../assets/photos/work/black-metal-fence-front-yard.jpg";
import boardGarden from "../assets/photos/work/board-fence-garden-gate.jpg";
import chainDogPark from "../assets/photos/work/chain-link-dog-park.jpg";
import deckBalusters from "../assets/photos/work/deck-black-balusters.jpg";
import deckWirePool from "../assets/photos/work/deck-wire-railing-pool.jpg";
import whiteDeckStairs from "../assets/photos/work/white-deck-stairs.jpg";
import whiteDeckSide from "../assets/photos/work/white-deck-side.jpg";
import chainDriveGate from "../assets/photos/work/chain-link-drive-gate.jpg";
import coveredInside from "../assets/photos/work/covered-deck-inside.jpg";
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
  chainDogPark: {
    src: chainDogPark,
    caption: "Black chain link fence around a dog park",
    alt: "Black chain link fence around a dog park with a gravel strip and a bench, beside a sidewalk at an apartment community",
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
  whiteDeckStairs: {
    src: whiteDeckStairs,
    caption: "White deck with stairs and black balusters",
    alt: "White painted raised deck with stairs and black balusters on the back of a brick house",
  },
  whiteDeckSide: {
    src: whiteDeckSide,
    caption: "Raised white deck with stairs",
    alt: "Raised white deck with a railing and stairs on tall posts, on the back of a brick house",
  },
  chainDriveGate: {
    src: chainDriveGate,
    caption: "Black chain link fence with a drive gate",
    alt: "Black chain link fence along a yard with a double drive gate across a gravel driveway",
  },
  coveredDeck: {
    src: coveredDeck,
    caption: "Covered deck with stairs and wood railings",
    alt: "Finished raised pressure treated deck with a roof over it, wood railings, and stairs to the yard on the back of a gray two story house",
  },
  coveredInside: {
    src: coveredInside,
    caption: "Under a covered deck with a wood ceiling",
    alt: "View along a covered deck with a tongue and groove wood ceiling, wood railings, and a view of open fields",
  },
};

// Homeowner fence photos only, three per city page. There are exactly twenty
// ways to pick three of these six, so every city page gets its own set.
const fenceOrder = ["woodPrivacy", "vinylPrivacy", "horizontalBoard", "blackMetal", "boardGarden", "chainDriveGate"];
const fenceSets = [];
for (let a = 0; a < 6; a++) for (let b = a + 1; b < 6; b++) for (let c = b + 1; c < 6; c++) fenceSets.push([a, b, c]);
// Stepping 7 at a time visits all twenty sets and spreads similar sets apart.
export function fencePhotosFor(index) {
  return fenceSets[(index * 7) % fenceSets.length].map((i) => work[fenceOrder[i]]);
}

const deckOrder = ["deckWirePool", "coveredInside", "whiteDeckStairs", "deckBalusters", "whiteDeckSide", "coveredDeck"];
export function deckPhotosFor(index) {
  return [0, 1, 2].map((k) => work[deckOrder[(index * 2 + k) % deckOrder.length]]);
}
