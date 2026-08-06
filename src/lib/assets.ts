import type { MoveClassification } from "@/types";

/** Path to a move-classification badge in /public/move-types. */
export const moveTypeIcon = (c: MoveClassification) => `/move-types/${c}.png`;

/** Human-friendly label for a move classification. */
export const MOVE_LABEL: Record<MoveClassification, string> = {
  brilliant: "Brilliant",
  great: "Great",
  best: "Best",
  excellent: "Excellent",
  good: "Good",
  book: "Book",
  inaccuracy: "Inaccuracy",
  mistake: "Mistake",
  missed: "Miss",
  blunder: "Blunder",
};

/** Tailwind text-color token per classification (see tailwind.config). */
export const MOVE_COLOR: Record<MoveClassification, string> = {
  brilliant: "text-move-brilliant",
  great: "text-move-great",
  best: "text-move-best",
  excellent: "text-move-excellent",
  good: "text-move-good",
  book: "text-move-book",
  inaccuracy: "text-move-inaccuracy",
  mistake: "text-move-mistake",
  missed: "text-move-missed",
  blunder: "text-move-blunder",
};

export const LOGO = {
  pawn: "/logos/chesscom_logo_pawn.svg",
  wordmark: "/logos/chesscom_logo_wordmark.svg",
  /** Wordmark lockup for the nav (aspect 5064:1600 ≈ 3.165:1). */
  wordmarkNav: "/logos/chesscom_logo_wordmark_outline.png",
  sidebar: "/sidebar-icons/Logo.png",
  coach: "/coach.png",
};

/** Time-class + activity glyphs from /public/game-types (baked-in colors). */
export const GAME_ICON = {
  puzzleGold: "/game-types/puzzle-gold.svg",
  puzzleGrey: "/game-types/puzzle-icon-grey.svg",
  games: "/game-types/games-grey.svg",
  rapid: "/game-types/rapid.svg",
  blitz: "/game-types/blitz.svg",
  bullet: "/game-types/bullet.svg",
  daily: "/game-types/daily.svg",
  gameBasedPuzzles: "/game-types/game-based-puzzles.svg",
  dailyPuzzle: "/game-types/daily-puzzle.svg",
  puzzleRush: "/game-types/puzzle-rush.svg",
  puzzleBattle: "/game-types/puzzle-battle.svg",
  customPuzzles: "/game-types/custom-puzzles.svg",
};

export const NAV_ICON = {
  play: "/sidebar-icons/Play.png",
  puzzles: "/sidebar-icons/Puzzles.png",
  learn: "/sidebar-icons/Learn.png",
  train: "/sidebar-icons/Train.svg",
  watch: "/sidebar-icons/Watch.png",
  news: "/sidebar-icons/News.png",
  community: "/sidebar-icons/Community.png",
};

/** Official Chess.com glyphs from /public/misc (baked-in brand colors). */
export const ICON = {
  streak: "/misc/streak.svg",
  crystalLeague: "/misc/crystal-league.svg",
  playTime: "/misc/play.svg",
  playOnline: "/misc/play-online.svg",
  playBots: "/misc/play-bot.svg",
  handshake: "/misc/hand-shake.svg",
  coach: "/misc/coach-levy.png",
  noAvatar: "/misc/no-avatar.gif",
  upgrade: "/misc/upgrade.svg",
  gameReview: "/misc/game-review.svg",
  /** Magnifier-over-pie — game analysis, not a search box. */
  analysis: "/misc/analysis.svg",
};
