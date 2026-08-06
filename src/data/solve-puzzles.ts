import type {
  PuzzleCategory,
  PuzzleCategoryStat,
  SolvePuzzle,
} from "@/types";

const ME = "santoshmudragada";

/** Human label for each mistake theme (start-screen list + tag pill). */
export const CATEGORY_LABEL: Record<PuzzleCategory, string> = {
  blunder: "Blunder",
  mistake: "Mistake",
  "missed-opportunity": "Missed opportunity",
  "opening-mistake": "Opening mistake",
};

/** Badge art per theme, from public/move-types. */
export const CATEGORY_ICON: Record<PuzzleCategory, string> = {
  blunder: "/move-types/blunder.png",
  mistake: "/move-types/mistake.png",
  "missed-opportunity": "/move-types/missed.png",
  "opening-mistake": "/move-types/book.png",
};

/**
 * The puzzles the trainee solves. Each puzzle is played out as a forcing line:
 * the user makes their move, the opponent's reply auto-plays (Stockfish's best),
 * and so on until the line ends in checkmate or a decisive material win — so a
 * sacrifice never looks like a blunder. Every FEN, move and eval below was
 * generated with **Stockfish 18** (see the scratch generator); the opponent
 * replies are the engine's best, and the evals are the engine's real scores
 * from the solver's perspective (positive = the user is winning).
 *
 * The solver plays whichever colour they had in the real game, so the set mixes
 * both — the board is always oriented to their side, and `orientation` must
 * therefore match `sideToMove`.
 */
export const solvePuzzles: SolvePuzzle[] = [
  {
    id: "gbp-1",
    category: "missed-opportunity",
    title: "Missed the Knight-In",
    fen: "1r3rk1/1b1p1pp1/4p2p/qBP1n3/3p1P2/1Q1P2P1/P6P/R1B2RK1 b - - 0 19",
    orientation: "black",
    sideToMove: "black",
    played: { from: "e5", to: "g4", san: "Ng4" },
    start: { cp: 149, mate: null },
    line: [
      { from: "e5", to: "f3", san: "Nf3+", side: "black", cp: 532, mate: null, isMate: false, fen: "1r3rk1/1b1p1pp1/4p2p/qBP5/3p1P2/1Q1P1nP1/P6P/R1B2RK1 w - - 1 20" },
      { from: "g1", to: "f2", san: "Kf2", side: "white", cp: 558, mate: null, isMate: false, fen: "1r3rk1/1b1p1pp1/4p2p/qBP5/3p1P2/1Q1P1nP1/P4K1P/R1B2R2 b - - 2 20" },
      { from: "b7", to: "d5", san: "Bd5", side: "black", cp: 547, mate: null, isMate: false, fen: "1r3rk1/3p1pp1/4p2p/qBPb4/3p1P2/1Q1P1nP1/P4K1P/R1B2R2 w - - 3 21" },
      { from: "b3", to: "d1", san: "Qd1", side: "white", cp: 575, mate: null, isMate: false, fen: "1r3rk1/3p1pp1/4p2p/qBPb4/3p1P2/3P1nP1/P4K1P/R1BQ1R2 b - - 4 21" },
      { from: "b8", to: "b5", san: "Rxb5", side: "black", cp: 558, mate: null, isMate: false, fen: "5rk1/3p1pp1/4p2p/qrPb4/3p1P2/3P1nP1/P4K1P/R1BQ1R2 w - - 0 22" },
    ],
    prompt: "You had a crushing shot here but played Ng4. A knight jumps in with check and, in the forcing line that follows, wins a piece. Find the first move.",
    solvedLine: "Nf3+! After Kf2 Bd5, the threats against b3 and b5 overload White — …Rxb5 nets a decisive extra piece.",
    opponent: "jazzzzzzzyyyy",
    opponentRating: 511,
    gameId: "g-01",
    reviewPly: 38,
  },
  {
    id: "gbp-2",
    category: "blunder",
    title: "Back-Rank Blunder",
    fen: "3r2k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1",
    orientation: "white",
    sideToMove: "white",
    played: { from: "d1", to: "d3", san: "Rd3" },
    start: { cp: -683, mate: null },
    line: [
      { from: "d1", to: "d8", san: "Rxd8#", side: "white", cp: 3000, mate: 0, isMate: true, fen: "3R2k1/5ppp/8/8/8/8/5PPP/6K1 b - - 0 1" },
    ],
    prompt: "You had mate on the board but blundered with the quiet Rd3. The enemy back rank is undefended — deliver it.",
    solvedLine: "Rxd8# — checkmate on the weak back rank.",
    opponent: "js34233aolcom",
    opponentRating: 1225,
    gameId: "g-06",
    reviewPly: 37,
  },
  {
    id: "gbp-3",
    category: "missed-opportunity",
    title: "Missed Checkmate",
    fen: "6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1",
    orientation: "white",
    sideToMove: "white",
    played: { from: "e1", to: "d1", san: "Rd1" },
    start: { cp: 654, mate: null },
    line: [
      { from: "e1", to: "e8", san: "Re8#", side: "white", cp: 3000, mate: 0, isMate: true, fen: "4R1k1/5ppp/8/8/8/8/5PPP/6K1 b - - 1 1" },
    ],
    prompt: "You missed a mate in one — in the game you played Rd1. Where does the rook deliver checkmate?",
    solvedLine: "Re8# — the back rank is fatal. Checkmate.",
    opponent: "jazzzzzzzyyyy",
    opponentRating: 519,
    gameId: "g-03",
    reviewPly: 63,
  },
  {
    id: "gbp-4",
    category: "blunder",
    title: "Discovered Attack",
    fen: "4q1k1/6pp/8/8/4B3/8/5PPP/4R1K1 w - - 0 1",
    orientation: "white",
    sideToMove: "white",
    played: { from: "e4", to: "d3", san: "Bd3" },
    start: { cp: -590, mate: null },
    line: [
      { from: "e4", to: "d5", san: "Bd5+", side: "white", cp: 734, mate: null, isMate: false, fen: "4q1k1/6pp/8/3B4/8/8/5PPP/4R1K1 b - - 1 1" },
      { from: "g8", to: "f8", san: "Kf8", side: "black", cp: 732, mate: null, isMate: false, fen: "4qk2/6pp/8/3B4/8/8/5PPP/4R1K1 w - - 2 2" },
      { from: "e1", to: "e8", san: "Rxe8+", side: "white", cp: 632, mate: null, isMate: false, fen: "4Rk2/6pp/8/3B4/8/8/5PPP/6K1 b - - 0 2" },
    ],
    prompt: "You retreated with Bd3 and threw the game away. One bishop move gives check and unveils your rook on the queen. Find it.",
    solvedLine: "Bd5+! The discovered check drives the king away, and Rxe8+ collects the queen — completely winning.",
    opponent: "Tengelic",
    opponentRating: 1141,
    gameId: "g-05",
    reviewPly: 33,
  },
  {
    id: "gbp-5",
    category: "mistake",
    title: "Grabbed the Wrong Pawn",
    fen: "8/6pk/4p2p/3P1p2/5P1P/2B5/4K3/5r2 b - - 0 42",
    orientation: "black",
    sideToMove: "black",
    played: { from: "f1", to: "f4", san: "Rxf4" },
    start: { cp: 56, mate: null },
    line: [
      { from: "f1", to: "b1", san: "Rb1", side: "black", cp: 536, mate: null, isMate: false, fen: "8/6pk/4p2p/3P1p2/5P1P/2B5/4K3/1r6 w - - 1 43" },
      { from: "d5", to: "e6", san: "dxe6", side: "white", cp: 646, mate: null, isMate: false, fen: "8/6pk/4P2p/5p2/5P1P/2B5/4K3/1r6 b - - 0 43" },
      { from: "b1", to: "b6", san: "Rb6", side: "black", cp: 675, mate: null, isMate: false, fen: "8/6pk/1r2P2p/5p2/5P1P/2B5/4K3/8 w - - 1 44" },
      { from: "e6", to: "e7", san: "e7", side: "white", cp: 678, mate: null, isMate: false, fen: "8/4P1pk/1r5p/5p2/5P1P/2B5/4K3/8 b - - 0 44" },
      { from: "b6", to: "e6", san: "Re6+", side: "black", cp: 693, mate: null, isMate: false, fen: "8/4P1pk/4r2p/5p2/5P1P/2B5/4K3/8 w - - 1 45" },
    ],
    prompt: "You were winning this endgame, then grabbed a pawn with Rxf4 and it evaporated. The rook has a far better job to do — where does it belong?",
    solvedLine: "Rb1! The rook swings behind the passed pawn instead of snacking on f4. After dxe6 Rb6 the pawn is rounded up and the extra material decides.",
    opponent: "jazzzzzzzyyyyy",
    opponentRating: 511,
    gameId: "g-01",
    reviewPly: 84,
  },
  {
    id: "gbp-6",
    category: "mistake",
    title: "Pawn Fork",
    fen: "6k1/5pp1/7p/2n1n3/8/3P4/5PPP/R5K1 w - - 0 1",
    orientation: "white",
    sideToMove: "white",
    played: { from: "a1", to: "d1", san: "Rd1" },
    start: { cp: -34, mate: null },
    line: [
      { from: "d3", to: "d4", san: "d4", side: "white", cp: 253, mate: null, isMate: false, fen: "6k1/5pp1/7p/2n1n3/3P4/8/5PPP/R5K1 b - - 0 1" },
      { from: "e5", to: "d3", san: "Ned3", side: "black", cp: 261, mate: null, isMate: false, fen: "6k1/5pp1/7p/2n5/3P4/3n4/5PPP/R5K1 w - - 1 2" },
      { from: "d4", to: "c5", san: "dxc5", side: "white", cp: 251, mate: null, isMate: false, fen: "6k1/5pp1/7p/2P5/8/3n4/5PPP/R5K1 b - - 0 2" },
    ],
    prompt: "Both enemy knights are loose. Instead of shuffling the rook, a single pawn thrust attacks them both. Play it.",
    solvedLine: "d4! forks both knights — after the desperado …Ned3 you play dxc5 and emerge a clean piece up.",
    opponent: "jazzzzzzzyyyy",
    opponentRating: 521,
    gameId: "g-01",
    reviewPly: 23,
  },
  {
    id: "gbp-7",
    category: "opening-mistake",
    title: "Scholar's Mate",
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
    orientation: "white",
    sideToMove: "white",
    played: { from: "g1", to: "f3", san: "Nf3" },
    start: { cp: -685, mate: null },
    line: [
      { from: "h5", to: "f7", san: "Qxf7#", side: "white", cp: 3000, mate: 0, isMate: true, fen: "r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4" },
    ],
    prompt: "The opponent blundered with …Nf6, and you missed the punish by developing with Nf3. There is a mate in one on f7 — find it.",
    solvedLine: "Qxf7# — the classic Scholar's Mate, the queen supported by the bishop on c4.",
    opponent: "Jesuistonpereluc",
    opponentRating: 1039,
    gameId: "g-02",
    reviewPly: 8,
  },
  {
    id: "gbp-8",
    category: "missed-opportunity",
    title: "Smothered Mate",
    fen: "5r1k/6pp/8/6N1/8/1Q6/6PP/6K1 w - - 0 1",
    orientation: "white",
    sideToMove: "white",
    played: { from: "b3", to: "f3", san: "Qf3" },
    start: { cp: 644, mate: null },
    line: [
      { from: "g5", to: "f7", san: "Nf7+", side: "white", cp: 3000, mate: 3, isMate: false, fen: "5r1k/5Npp/8/8/8/1Q6/6PP/6K1 b - - 1 1" },
      { from: "h8", to: "g8", san: "Kg8", side: "black", cp: 3000, mate: 3, isMate: false, fen: "5rk1/5Npp/8/8/8/1Q6/6PP/6K1 w - - 2 2" },
      { from: "f7", to: "h6", san: "Nh6+", side: "white", cp: 3000, mate: 2, isMate: false, fen: "5rk1/6pp/7N/8/8/1Q6/6PP/6K1 b - - 3 2" },
      { from: "g8", to: "h8", san: "Kh8", side: "black", cp: 3000, mate: 2, isMate: false, fen: "5r1k/6pp/7N/8/8/1Q6/6PP/6K1 w - - 4 3" },
      { from: "b3", to: "g8", san: "Qg8+", side: "white", cp: 3000, mate: 1, isMate: false, fen: "5rQk/6pp/7N/8/8/8/6PP/6K1 b - - 5 3" },
      { from: "f8", to: "g8", san: "Rxg8", side: "black", cp: 3000, mate: 1, isMate: false, fen: "6rk/6pp/7N/8/8/8/6PP/6K1 w - - 0 4" },
      { from: "h6", to: "f7", san: "Nf7#", side: "white", cp: 3000, mate: 0, isMate: true, fen: "6rk/5Npp/8/8/8/8/6PP/6K1 b - - 1 4" },
    ],
    prompt: "You missed a picture-perfect finish and played Qf3. It begins with a knight check that drives the king into its own corner. What's the first move?",
    solvedLine: "Nf7+! begins the smothered mate: Kg8 Nh6+ Kh8 Qg8+! Rxg8 Nf7# — checkmate.",
    opponent: "js34233aolcom",
    opponentRating: 1225,
    gameId: "g-06",
    reviewPly: 51,
  },
];

/** Plural theme labels for the start-screen list. */
const CATEGORY_PLURAL: Record<PuzzleCategory, string> = {
  blunder: "Blunders",
  mistake: "Mistakes",
  "missed-opportunity": "Missed Opportunities",
  "opening-mistake": "Opening Mistakes",
};

/**
 * The theme list on the start screen.
 *
 * Counted from `solvePuzzles` rather than authored, so a theme badge can never
 * promise more puzzles than the "Solve" button actually plays through. Themes
 * with nothing queued are dropped rather than shown as an empty row.
 */
export const puzzleCategoryStats: PuzzleCategoryStat[] = (
  Object.keys(CATEGORY_PLURAL) as PuzzleCategory[]
)
  .map((category) => ({
    category,
    label: CATEGORY_PLURAL[category],
    count: solvePuzzles.filter((p) => p.category === category).length,
  }))
  .filter((c) => c.count > 0);

/**
 * Progress through the queue. `total` is the size of the queue itself — the one
 * number every counter in the app is measured against (the theme badges, the
 * "x/y completed" meters, the session counter, the home card), so they all agree.
 *
 * Nothing is completed before the user starts: a non-zero baseline would put the
 * meter ("3/8") out of step with the puzzle they are actually on ("Puzzle 1 / 8").
 */
export const puzzleProgress = {
  completed: 0,
  total: solvePuzzles.length,
};

/**
 * How many game-based puzzles a free member can solve per day. Premium members
 * get the whole queue — the gap between this and `puzzleProgress.total` is the
 * upgrade pitch.
 */
export const FREE_DAILY_LIMIT = 3;

/** Coach's opening line on the start screen. */
export const coachIntro = `${solvePuzzles.length} new puzzles generated from your last 5 games.`;

export const meUsername = ME;
