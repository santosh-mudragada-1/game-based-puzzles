import type {
  BlindSpotPuzzle,
  TrainingSession,
  WeeklyProgress,
  TrainingStats,
} from "@/types";

/** The hero puzzle: today's personalized blind spot from the user's own game. */
export const todaysBlindSpot: BlindSpotPuzzle = {
  id: "bs-2026-07-22-01",
  fen: "r1b2rk1/pp1nqppp/2p1pn2/3p4/2PP4/1QN1PN2/PP3PPP/R1B2RK1 w - - 4 11",
  orientation: "white",
  sideToMove: "white",
  classification: "missed",
  categoryKey: "missed-tactic",
  categoryLabel: "Missed Tactic",
  highlight: ["c4", "d5"],
  hint: ["c4"],
  title: "You had a winning break here",
  prompt:
    "White to play. In your game you castled — but a central break wins a pawn and cracks Black's structure. Can you find it?",
  opponent: "jazzzzzzzyyyy",
  playedAs: "white",
  date: "Jul 22, 2026",
  ratingDelta: 1290,
};

/** In-progress set for the "Continue Training" card. */
export const activeSession: TrainingSession = {
  label: "Pins & Skewers",
  categoryLabel: "Pinned Piece",
  classification: "mistake",
  completed: 3,
  total: 8,
  fen: "2r3k1/5ppp/p3p3/1p1bP3/3P4/1P3N2/P4PPP/2R3K1 b - - 0 1",
  orientation: "white",
};

export const weeklyProgress: WeeklyProgress = {
  solved: 34,
  goal: 50,
  accuracy: 78,
  accuracyDelta: 6,
  streakDays: 12,
  days: [
    { label: "S", status: "done" },
    { label: "M", status: "done" },
    { label: "T", status: "miss" },
    { label: "W", status: "done" },
    { label: "T", status: "today" },
    { label: "F", status: "rest" },
    { label: "S", status: "rest" },
  ],
  dailySolved: [7, 9, 3, 8, 7, 0, 0],
  dailyGoal: 8,
};

export const trainingStats: TrainingStats = {
  puzzlesSolved: 214,
  accuracy: 78,
  currentStreak: 12,
  bestStreak: 21,
  reinforcementDue: 5,
};

export const reinforcement = {
  count: 5,
  topCategory: "Pinned Piece",
  nextDue: "Due today",
};
