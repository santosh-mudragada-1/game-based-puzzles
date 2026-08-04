import type {
  QuickPlayAction,
  HomePreview,
  DailyPuzzleInfo,
  Friend,
  StatRow,
  LeagueInfo,
} from "@/types";

/** Quick-play card (left of the home hero). Streak matches the reference. */
export const homeStreakDays = 133;

export const quickPlayActions: QuickPlayAction[] = [
  { label: "Play 15 | 10", kind: "time" },
  { label: "Play Online", kind: "online" },
  { label: "Play Bots", kind: "bots" },
  { label: "Play Coach", kind: "coach" },
  { label: "Play a Friend", kind: "friend" },
];

/** The three preview cards beside the quick-play card. */
export const puzzlePreview: HomePreview & {
  count: number;
  progress: number;
  level: number;
} = {
  fen: "r4rk1/pp2ppbp/2np1np1/q7/3NP3/2N1BP2/PPPQ2PP/2KR3R w - - 0 1",
  orientation: "white",
  count: 24507,
  progress: 0.6,
  level: 9,
};

export const lessonPreview: HomePreview & { title: string } = {
  fen: "rnbqk2r/ppp2ppp/3b1n2/3pp3/4P3/2NP1N2/PPP2PPP/R1BQKB1R w KQkq - 0 1",
  orientation: "white",
  title: "Prevent Castling",
};

export const gamePreview: HomePreview & { opponent: string } = {
  fen: "r1bq1rk1/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQ1RK1 b - - 0 1",
  orientation: "white",
  opponent: "jazzzzzzzyyyy",
};

/** Game-based-puzzles progress for the hero "Game Puzzles" card. */
export const gamePuzzlesProgress = { solved: 8, total: 10 };

/** Daily Puzzle (right rail). */
export const dailyPuzzle: DailyPuzzleInfo = {
  fen: "3q1rk1/1b3ppp/p2p4/1p1Pp3/1P2P3/P1N2Q2/5PPP/2R3K1 w - - 0 1",
  orientation: "white",
  title: "Totally Got Your Back",
  solvedBy: 898247,
};

/** Crystal League standing (right rail). */
export const crystalLeague: LeagueInfo = {
  name: "Crystal League",
  place: 11,
};

/** Friends grid (right rail). Placeholder avatars only. */
export const friends: Friend[] = [
  { username: "jazzzzzzzyyyy", online: true },
  { username: "jrieland", online: true },
  { username: "Dharmar", online: false },
  { username: "jerry-305", online: true },
  { username: "sruju11", online: false },
  { username: "revanth", online: false },
  { username: "diksh_17", online: true },
  { username: "AK1659", online: false },
  { username: "TriashaM", online: false },
  { username: "ChessKing", online: true },
  { username: "Abhi-K", online: false },
  { username: "hackertom", online: false },
];

/** Stats panel (right rail). */
export const homeStats: StatRow[] = [
  { label: "Games", value: 835, kind: "games" },
  { label: "Puzzles", value: 699, kind: "puzzles" },
  { label: "Lessons", value: 3, kind: "lessons" },
  { label: "Rapid", value: 1128, kind: "rapid", rating: true },
  { label: "Blitz", value: 1046, kind: "blitz", rating: true },
  { label: "Bullet", value: 985, kind: "bullet", rating: true },
  { label: "Puzzles", value: 1557, kind: "tactics", rating: true },
];
