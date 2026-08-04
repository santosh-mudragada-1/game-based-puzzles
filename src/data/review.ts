import type { GameReview, GeneratedPuzzle } from "@/types";

const ME = "santoshmudragada";

/** The game the user has just reviewed (Screen 2 context). */
export const reviewedGame: GameReview = {
  white: { username: ME, rating: 1128, color: "white", countryFlag: "🇮🇳" },
  black: { username: "js34233aolcom", rating: 1225, color: "black", countryFlag: "🇺🇸" },
  accuracy: { white: 70.4, black: 80.4 },
  result: "loss",
  userSide: "white",
  opening: "Italian Game: Giuoco Pianissimo",
  fen: "r2q1rk1/pp1n1ppp/2pbpn2/3p4/2PP4/2NBPN2/PP1B1PPP/R2Q1RK1 b - - 0 11",
  orientation: "white",
  evalPawns: -1.6,
  counts: [
    { classification: "brilliant", white: 1, black: 0 },
    { classification: "great", white: 1, black: 1 },
    { classification: "best", white: 19, black: 22 },
    { classification: "excellent", white: 8, black: 9 },
    { classification: "good", white: 11, black: 10 },
    { classification: "book", white: 4, black: 4 },
    { classification: "inaccuracy", white: 3, black: 2 },
    { classification: "mistake", white: 2, black: 1 },
    { classification: "missed", white: 2, black: 1 },
    { classification: "blunder", white: 1, black: 0 },
  ],
  moves: [
    { moveNo: 1, side: "white", san: "e4", classification: "book" },
    { moveNo: 1, side: "black", san: "e5", classification: "book" },
    { moveNo: 2, side: "white", san: "Nf3", classification: "book" },
    { moveNo: 2, side: "black", san: "Nc6", classification: "book" },
    { moveNo: 3, side: "white", san: "Bc4", classification: "book" },
    { moveNo: 3, side: "black", san: "Bc5", classification: "book" },
    { moveNo: 4, side: "white", san: "c3", classification: "best" },
    { moveNo: 4, side: "black", san: "Nf6", classification: "best" },
    { moveNo: 5, side: "white", san: "d3", classification: "good" },
    { moveNo: 5, side: "black", san: "d6", classification: "good" },
    { moveNo: 6, side: "white", san: "O-O", classification: "best" },
    { moveNo: 6, side: "black", san: "O-O", classification: "best" },
    { moveNo: 7, side: "white", san: "Re1", classification: "excellent" },
    { moveNo: 7, side: "black", san: "a6", classification: "good" },
    { moveNo: 8, side: "white", san: "Bb3", classification: "best" },
    { moveNo: 8, side: "black", san: "Ba7", classification: "good" },
    { moveNo: 9, side: "white", san: "h3", classification: "missed" },
    { moveNo: 9, side: "black", san: "h6", classification: "good" },
    { moveNo: 10, side: "white", san: "Nbd2", classification: "best" },
    { moveNo: 10, side: "black", san: "d5", classification: "excellent" },
    { moveNo: 11, side: "white", san: "cxd5", classification: "mistake" },
    { moveNo: 11, side: "black", san: "Nxd5", classification: "best" },
    { moveNo: 12, side: "white", san: "Ne4", classification: "good" },
    { moveNo: 12, side: "black", san: "Bd6", classification: "excellent" },
    { moveNo: 13, side: "white", san: "Qc2", classification: "blunder" },
    { moveNo: 13, side: "black", san: "Nf4", classification: "great" },
    { moveNo: 14, side: "white", san: "Bxf4", classification: "best" },
    { moveNo: 14, side: "black", san: "exf4", classification: "best" },
  ],
};

/** Free experience: today's reviewed game yields 3 personalized puzzles. */
export const freePuzzles: GeneratedPuzzle[] = [
  {
    id: "gp-01",
    title: "Missed Winning Move",
    classification: "missed",
    fen: "r1bq1rk1/pp3ppp/2n1pn2/2bp4/3P4/2N1PN2/PPQ1BPPP/R1B2RK1 w - - 0 1",
    orientation: "white",
    sideToMove: "white",
    moveNo: 9,
    blurb: "You had a tactic that wins a pawn and the initiative — you played the quiet h3 instead.",
  },
  {
    id: "gp-02",
    title: "Knight Fork",
    classification: "mistake",
    fen: "r2q1rk1/pp1n1ppp/2pbpn2/3p4/2PP4/2NBPN2/PP1B1PPP/R2Q1RK1 w - - 0 1",
    orientation: "white",
    sideToMove: "white",
    moveNo: 11,
    blurb: "cxd5 walked into a fork. Find the move that keeps the tension and the piece safe.",
  },
  {
    id: "gp-03",
    title: "Back Rank Defense",
    classification: "blunder",
    fen: "3r2k1/5ppp/p7/1p6/8/1P3N1P/P4PP1/3RR1K1 w - - 0 1",
    orientation: "white",
    sideToMove: "white",
    moveNo: 13,
    blurb: "Qc2 left your back rank fatally weak. Defend the mating square before it's too late.",
  },
];

/** Platinum experience: puzzles compound across many recent reviews. */
const PLAT_THEMES: Array<{ title: string; c: GeneratedPuzzle["classification"] }> = [
  { title: "Missed Winning Move", c: "missed" },
  { title: "Knight Fork", c: "mistake" },
  { title: "Back Rank Defense", c: "blunder" },
  { title: "Pinned Piece", c: "mistake" },
  { title: "Hanging Piece", c: "blunder" },
  { title: "Discovered Attack", c: "missed" },
  { title: "Overloaded Defender", c: "inaccuracy" },
  { title: "Trapped Piece", c: "mistake" },
  { title: "Zwischenzug", c: "missed" },
  { title: "Deflection", c: "mistake" },
  { title: "Skewer", c: "missed" },
  { title: "Lost Winning Endgame", c: "blunder" },
];

const PLAT_FENS = [
  "r1bq1rk1/pp3ppp/2n1pn2/2bp4/3P4/2N1PN2/PPQ1BPPP/R1B2RK1 w - - 0 1",
  "r2q1rk1/pp1n1ppp/2pbpn2/3p4/2PP4/2NBPN2/PP1B1PPP/R2Q1RK1 w - - 0 1",
  "3r2k1/5ppp/p7/1p6/8/1P3N1P/P4PP1/3RR1K1 w - - 0 1",
  "2r3k1/5ppp/p3p3/1p1bP3/3P4/1P3N2/P4PPP/2R3K1 b - - 0 1",
  "3q1rk1/1b3ppp/p2p4/1p1Pp3/1P2P3/P1N2Q2/5PPP/2R3K1 w - - 0 1",
  "6k1/5ppp/p7/1p6/8/1P3N2/P4PPP/6K1 w - - 0 1",
];

export const platinumPuzzles: GeneratedPuzzle[] = PLAT_THEMES.map((t, i) => ({
  id: `gp-p${i + 1}`,
  title: t.title,
  classification: t.c,
  fen: PLAT_FENS[i % PLAT_FENS.length],
  orientation: "white",
  sideToMove: i % 2 === 0 ? "white" : "black",
  moveNo: 9 + i * 3,
  blurb: "Mined from one of your recent reviewed games.",
}));

export const platinumGamesReviewed = 4;
