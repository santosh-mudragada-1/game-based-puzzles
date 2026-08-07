/**
 * Domain types for the Blind Spot Trainer.
 * Kept framework-agnostic so data, components and features share one contract.
 */

/** Move-classification keys — 1:1 with the art in /public/move-types. */
export type MoveClassification =
  | "brilliant"
  | "great"
  | "best"
  | "excellent"
  | "good"
  | "book"
  | "inaccuracy"
  | "mistake"
  | "missed"
  | "blunder";

export type PieceColor = "white" | "black";

export type GameResult = "win" | "loss" | "draw";

export type TimeClass = "bullet" | "blitz" | "rapid" | "daily";

export interface PlayerRef {
  username: string;
  rating: number;
  color: PieceColor;
  countryFlag?: string; // emoji
  isBot?: boolean;
  title?: string;
}

export interface Game {
  id: string;
  timeControl: string; // "15 + 10"
  timeClass: TimeClass;
  white: PlayerRef;
  black: PlayerRef;
  /** Result from the trainee's perspective. */
  result: GameResult;
  whiteScore: 0 | 0.5 | 1;
  blackScore: 0 | 0.5 | 1;
  accuracy?: { white: number; black: number };
  moves: number;
  date: string; // e.g. "Jul 22, 2026"
  /** Number of blind-spot moments the trainer extracted from this game. */
  blindSpots: number;
  reviewed: boolean;
}

/** A weakness theme the trainee struggles with, e.g. "Back Rank Mate". */
export interface WeaknessCategory {
  key: string;
  label: string;
  /** Icon proxy from the move-types art. */
  classification: MoveClassification;
  /** Puzzles currently queued for this theme. */
  count: number;
  /** 0–100 mastery for the progress meter. */
  mastery: number;
  /** Rating-point trend over the last two weeks. */
  trend: number;
  blurb: string;
}

/** The atomic training unit: a position lifted from one of the user's games. */
export interface BlindSpotPuzzle {
  id: string;
  fen: string;
  orientation: PieceColor;
  sideToMove: PieceColor;
  classification: MoveClassification;
  categoryKey: string;
  categoryLabel: string;
  /** Squares to spotlight on the board (algebraic, e.g. ["e4","c6"]). */
  highlight: string[];
  /** Squares to ring as the solution/hint target. */
  hint?: string[];
  title: string;
  prompt: string;
  /** Source-game context. */
  opponent: string;
  playedAs: PieceColor;
  date: string;
  ratingDelta: number; // puzzle difficulty proxy
}

export interface TrainingSession {
  label: string;
  categoryLabel: string;
  classification: MoveClassification;
  completed: number;
  total: number;
  fen: string;
  orientation: PieceColor;
}

export type DayStatus = "done" | "miss" | "today" | "rest";

export interface WeekDay {
  label: string; // "M"
  status: DayStatus;
}

export interface WeeklyProgress {
  solved: number;
  goal: number;
  accuracy: number;
  accuracyDelta: number;
  streakDays: number;
  days: WeekDay[];
  /** Puzzles solved per weekday (aligned to `days`). */
  dailySolved: number[];
  dailyGoal: number;
}

export interface TrainingStats {
  puzzlesSolved: number;
  accuracy: number;
  currentStreak: number;
  bestStreak: number;
  reinforcementDue: number;
}

export interface UserProfile {
  username: string;
  displayName: string;
  avatarSeed: string;
  ratings: { rapid: number; blitz: number; bullet: number };
  countryFlag: string;
}

/* ------------------------------------------------------------------ *
 * Chess.com home-page entities (Screen 1 recreates the real home).
 * ------------------------------------------------------------------ */

export type QuickPlayKind =
  | "time"
  | "online"
  | "bots"
  | "coach"
  | "friend";

export interface QuickPlayAction {
  label: string;
  kind: QuickPlayKind;
  primary?: boolean;
}

export interface HomePreview {
  fen: string;
  orientation: PieceColor;
}

export interface DailyPuzzleInfo {
  fen: string;
  orientation: PieceColor;
  title: string;
  solvedBy: number;
}

export interface Friend {
  username: string;
  online?: boolean;
}

export type StatKind =
  | "games"
  | "puzzles"
  | "lessons"
  | "rapid"
  | "blitz"
  | "bullet"
  | "tactics";

export interface StatRow {
  label: string;
  value: number;
  kind: StatKind;
  /** Rating rows show a disclosure chevron in the reference. */
  rating?: boolean;
}

export interface LeagueInfo {
  name: string;
  place: number;
}

/* ------------------------------------------------------------------ *
 * Screen 2 — Game Review Integration
 * ------------------------------------------------------------------ */

/** One move in the review move-list. */
export interface ReviewMove {
  moveNo: number;
  side: PieceColor;
  san: string;
  classification?: MoveClassification;
}

/** Per-classification tally for both players (Chess.com's review summary). */
export interface ClassificationRow {
  classification: MoveClassification;
  white: number;
  black: number;
}

export interface GameReview {
  white: PlayerRef;
  black: PlayerRef;
  accuracy: { white: number; black: number };
  /** Result from the trainee's perspective. */
  result: GameResult;
  userSide: PieceColor;
  opening: string;
  /** Key/critical position shown on the board. */
  fen: string;
  orientation: PieceColor;
  /** White-advantage eval for the bar, in pawns (positive = White better). */
  evalPawns: number;
  counts: ClassificationRow[];
  moves: ReviewMove[];
}

/** A puzzle mined from a reviewed game. */
export interface GeneratedPuzzle {
  id: string;
  title: string;
  classification: MoveClassification;
  fen: string;
  orientation: PieceColor;
  sideToMove: PieceColor;
  moveNo: number;
  blurb: string;
}

/** Which experience to render on the review page. */
export type ReviewState = "reviewed-free" | "reviewed-platinum" | "empty";

/* ------------------------------------------------------------------ *
 * Game Based Puzzles — the solve flow (Figma "Basic Game Based
 * Puzzles Flow"). A puzzle is a moment from the user's own game where
 * a stronger move was available; the trainee replays it correctly.
 * ------------------------------------------------------------------ */

/**
 * The mistake themes shown on the Game Based Puzzles start screen.
 *
 * Each one is a real Chess.com move classification — "lost advantage" and
 * "critical moment" were dropped because the review never labels a move that
 * way, so a theme built on them had nothing to mine from.
 */
export type PuzzleCategory =
  | "blunder"
  | "mistake"
  | "missed-opportunity"
  | "opening-mistake";

/** A concrete move on the board. */
export interface PuzzleMove {
  from: string; // "e1"
  to: string; // "e8"
  san: string; // "Re8#"
}

/** A Stockfish evaluation from the SOLVER's perspective (positive = user better). */
export interface PuzzleEval {
  /** Centipawns, clamped to ±3000 for mate scores. */
  cp: number;
  /** Signed forced-mate distance (user-positive), or null when it's a cp eval. */
  mate: number | null;
}

/** One half-move of a puzzle's solution line, with the resulting position + eval. */
export interface PuzzleLinePly {
  from: string;
  to: string;
  san: string;
  /** Who made this move. */
  side: PieceColor;
  /** Position AFTER this move. */
  fen: string;
  /** User-positive centipawns of the resulting position (±3000 for mate). */
  cp: number;
  /** Signed forced-mate distance (user-positive), or null. */
  mate: number | null;
  /** True when this move is checkmate. */
  isMate: boolean;
}

/**
 * The atomic solving unit. The `line` is a Stockfish-computed forcing sequence
 * the user plays through: they make each of their moves (the opponent's replies
 * auto-play as the engine's best), until the line ends in mate or a decisive
 * material win. Every position, move and eval here is engine-verified.
 */
export interface SolvePuzzle {
  id: string;
  category: PuzzleCategory;
  /** Position BEFORE the first user move. */
  fen: string;
  orientation: PieceColor;
  sideToMove: PieceColor;
  /** The (weaker) move the user actually played in the game. */
  played: PuzzleMove;
  /**
   * The forcing solution line, alternating the user and the opponent, starting
   * with the user's move. Solved once the whole line has been played.
   */
  line: PuzzleLinePly[];
  /** Eval of the position after the move actually played (the "unsolved" bar). */
  start: PuzzleEval;
  /** Coach copy while solving (the mistake + the ask). */
  prompt: string;
  /** Coach copy once solved (confirmation of the idea). */
  solvedLine: string;
  /** Short human theme, e.g. "Missed Checkmate". */
  title: string;
  /** Source-game context. */
  opponent: string;
  opponentRating: number;
  gameId: string;
  /** Ply to deep-link into the full game review (/review?ply=). */
  reviewPly: number;
  /**
   * True when `gameId` is a real Chess.com game in the loaded archive, so the
   * "View game" link can open that game rather than the sample review.
   */
  archived?: boolean;
}

/**
 * Membership tier. Free members get a daily allowance of game-based puzzles;
 * premium members get the whole queue.
 */
export type PlanTier = "free" | "premium";

/** How a puzzle attempt ended. `solved-clean` = no hint, reveal or wrong move. */
export type PuzzleOutcome = "solved-clean" | "solved-hint" | "failed";

/** A theme row on the start screen (label + how many puzzles it holds). */
export interface PuzzleCategoryStat {
  category: PuzzleCategory;
  label: string;
  count: number;
}
