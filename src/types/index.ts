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
