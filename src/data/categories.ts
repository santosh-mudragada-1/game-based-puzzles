import type { WeaknessCategory } from "@/types";

/** The trainee's recurring weakness themes, mined from their own games. */
export const categories: WeaknessCategory[] = [
  {
    key: "missed-tactic",
    label: "Missed Tactic",
    classification: "missed",
    count: 7,
    mastery: 34,
    trend: 21,
    blurb: "Winning combinations you left on the board.",
  },
  {
    key: "pinned-piece",
    label: "Pinned Piece",
    classification: "mistake",
    count: 6,
    mastery: 38,
    trend: -9,
    blurb: "You move pinned pieces under pressure.",
  },
  {
    key: "knight-fork",
    label: "Knight Fork",
    classification: "mistake",
    count: 5,
    mastery: 42,
    trend: 18,
    blurb: "Family forks slipping past you in the middlegame.",
  },
  {
    key: "hanging-piece",
    label: "Hanging Piece",
    classification: "blunder",
    count: 4,
    mastery: 55,
    trend: 12,
    blurb: "Pieces left undefended and en prise.",
  },
  {
    key: "back-rank",
    label: "Back Rank Mate",
    classification: "missed",
    count: 4,
    mastery: 61,
    trend: 7,
    blurb: "Undefended back ranks — yours and theirs.",
  },
  {
    key: "lost-winning",
    label: "Lost Winning Position",
    classification: "blunder",
    count: 2,
    mastery: 48,
    trend: 4,
    blurb: "Technique for converting winning endgames.",
  },
];

export const totalPuzzles = categories.reduce((sum, c) => sum + c.count, 0);
