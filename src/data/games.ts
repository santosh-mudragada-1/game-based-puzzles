import type { Game } from "@/types";

const ME = "santoshmudragada";

/**
 * Recent games, styled after the reference Game History table.
 * Domain rule: a game only has accuracy + puzzles once it's been reviewed.
 *  - reviewed:false  -> no accuracy, no puzzles, "Review" action
 *  - reviewed:true   -> accuracy + generated puzzles, "Practice" action
 */
export const recentGames: Game[] = [
  {
    id: "g-01",
    timeControl: "15 + 10",
    timeClass: "rapid",
    white: { username: "jazzzzzzzyyyy", rating: 519, color: "white", countryFlag: "🇮🇳" },
    black: { username: ME, rating: 1128, color: "black", countryFlag: "🇮🇳" },
    result: "win",
    whiteScore: 0,
    blackScore: 1,
    moves: 65,
    date: "Jul 22, 2026",
    blindSpots: 0,
    reviewed: false,
  },
  {
    id: "g-02",
    timeControl: "15 + 10",
    timeClass: "rapid",
    white: { username: ME, rating: 1128, color: "white", countryFlag: "🇮🇳" },
    black: {
      username: "Jesuistonpereluc",
      rating: 1039,
      color: "black",
      countryFlag: "🇫🇷",
      isBot: true,
    },
    result: "win",
    whiteScore: 1,
    blackScore: 0,
    accuracy: { white: 88.2, black: 71.5 },
    moves: 8,
    date: "Jul 22, 2026",
    blindSpots: 1,
    reviewed: true,
  },
  {
    id: "g-03",
    timeControl: "15 + 10",
    timeClass: "rapid",
    white: { username: "jazzzzzzzyyyy", rating: 519, color: "white", countryFlag: "🇮🇳" },
    black: { username: ME, rating: 1122, color: "black", countryFlag: "🇮🇳" },
    result: "win",
    whiteScore: 0,
    blackScore: 1,
    accuracy: { white: 55.8, black: 76.4 },
    moves: 23,
    date: "Jul 22, 2026",
    blindSpots: 3,
    reviewed: true,
  },
  {
    id: "g-04",
    timeControl: "15 + 10",
    timeClass: "rapid",
    white: { username: "jazzzzzzzyyyy", rating: 521, color: "white", countryFlag: "🇮🇳" },
    black: { username: ME, rating: 1122, color: "black", countryFlag: "🇮🇳" },
    result: "win",
    whiteScore: 0,
    blackScore: 1,
    accuracy: { white: 56.4, black: 66.6 },
    moves: 32,
    date: "Jul 22, 2026",
    blindSpots: 2,
    reviewed: true,
  },
  {
    id: "g-05",
    timeControl: "15 + 10",
    timeClass: "rapid",
    white: { username: "Tengelic", rating: 1141, color: "white", countryFlag: "🇦🇹" },
    black: { username: ME, rating: 1120, color: "black", countryFlag: "🇮🇳" },
    result: "loss",
    whiteScore: 1,
    blackScore: 0,
    accuracy: { white: 91.7, black: 81.2 },
    moves: 49,
    date: "Jul 19, 2026",
    blindSpots: 4,
    reviewed: true,
  },
  {
    id: "g-06",
    timeControl: "15 + 10",
    timeClass: "rapid",
    white: { username: ME, rating: 1128, color: "white", countryFlag: "🇮🇳" },
    black: { username: "js34233aolcom", rating: 1225, color: "black", countryFlag: "🇺🇸" },
    result: "loss",
    whiteScore: 0,
    blackScore: 1,
    accuracy: { white: 70.4, black: 80.4 },
    moves: 50,
    date: "Jul 18, 2026",
    blindSpots: 5,
    reviewed: true,
  },
];

export const meUsername = ME;
