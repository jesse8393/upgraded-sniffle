// Real project photos from the owner. Captions describe only what each photo shows.
import woodPrivacy from "../assets/photos/work/wood-privacy-fence-cap.jpg";
import vinylPrivacy from "../assets/photos/work/vinyl-privacy-fence-slope.jpg";
import horizontalBoard from "../assets/photos/work/horizontal-board-fence.jpg";
import blackMetal from "../assets/photos/work/black-metal-fence-front-yard.jpg";
import boardGarden from "../assets/photos/work/board-fence-garden-gate.jpg";

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
};

const order = ["woodPrivacy", "vinylPrivacy", "horizontalBoard", "blackMetal", "boardGarden"];
// Three photos per city page, rotated so neighboring cities do not show the same set.
export function fencePhotosFor(index) {
  return [0, 1, 2].map((k) => work[order[(index + k * 2) % order.length]]);
}
