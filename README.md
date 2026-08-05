# Game Based Puzzles — a Chess.com concept

A product-design concept for **Chess.com's personalized learning loop**.

Today the loop ends at Game Review: you see what went wrong, nod, and move on.
This prototype continues it — the critical moments from *your own games* become
puzzles that come back until the idea sticks. Every position, solution line and
evaluation is verified by Stockfish, not hand-waved.

> **Concept / design exploration.** An independent portfolio prototype that
> borrows Chess.com's design language. Not affiliated with, endorsed by, or an
> official product of Chess.com.

---

## Features

**Game-Based Puzzles** — puzzles mined from the trainee's real games. Each one
opens on the moment before the mistake, with an orange arrow showing the move
actually played, and asks for the move that was there instead.

**Stockfish analysis** — Stockfish 18 (WASM) runs in a Web Worker in the
browser. It drives the evaluation bar live and corrects the authored data; the
bar is anchored to what *was* available and fills to what the played move left,
so the gap between them is the advantage thrown away.

**Personalized puzzle generation** — positions are mined from the user's own PGN
by comparing the played move against the engine's best, then re-verified at
depth. Both colours appear, because real game histories have both.

**Puzzle queue** — six mistake themes (Blunders, Mistakes, Missed Opportunities,
Lost Advantages, Critical Moments, Opening Mistakes). Drill one theme or work
the whole queue; progress accumulates across themes.

**Free vs Premium** — free members get 3 puzzles a day and can see the rest of
the queue behind a paywall card; premium members work the lot and are pointed at
whatever they didn't solve cleanly. Upgrading happens in place, so the queue
resumes exactly where the wall stopped them.

**Interactive chessboard** — click-to-move and drag-and-drop with legal-move
dots, check highlighting, hint rings, solution arrows and a wrong-move shake.

**Responsive design** — the board/panel split collapses to a single column, with
an off-canvas nav drawer on small screens.

---

## Tech stack

| | |
| --- | --- |
| Framework | **Next.js 15** (App Router) + React 19 |
| Language | **TypeScript** |
| Styling | **Tailwind CSS** with Chess.com design tokens |
| Chess engine | **Stockfish 18** (WASM, lite single-threaded) in a Web Worker |
| Chess rules | **chess.js** — legal moves, SAN, check/mate detection |
| Animation | **Framer Motion**; **Remotion** for the upgrade celebration |

Routing is Next.js's file-based App Router (`src/app`), not React Router.

---

## Getting started

```bash
npm install     # also fetches the Stockfish WASM build
npm run dev     # http://localhost:3000
```

`npm run dev` and `npm run build` both run `copy-engine` first, which copies the
Stockfish WASM build out of `node_modules` into `public/engine`. To run it
by hand:

```bash
npm run copy-engine
```

`public/engine` is generated and gitignored, so a 7 MB binary never lands in the
repo. Production build:

```bash
npm run build && npm run start
```

### Trying both plans

A small floating button sits in the bottom-right corner — a prototype-only
control for switching between the **Free** and **Premium** experiences. The
choice persists across refreshes; `?plan=free` / `?plan=premium` work too.

---

## Project structure

```
src/
  app/                     # App Router routes (home, /puzzles, /review) + layout
  components/
    board/                 # FEN → static board
    puzzles/               # interactive board, eval bar, completion card
    review/                # Game Review panel — coach, eval graph, move list
    home/  dashboard/      # hero cards, right rail, game history
    layout/  shared/       # app shell, sidebar, buttons, plan switcher
  features/
    game-based-puzzles/    # screen composition — solver, review, home
  hooks/                   # engine eval, plan tier, shared puzzle progress
  lib/                     # engine worker, chess/FEN helpers, PGN model, assets
  remotion/                # upgrade celebration composition (renderable to video)
  data/                    # Stockfish-verified puzzles + sample content
  types/                   # domain types
public/
  engine/                  # Stockfish WASM (generated, gitignored)
  chess-pieces/ logos/ …   # Chess.com icon assets
```

---

## Screenshots

<!-- Replace the placeholders below with real captures. -->

| Home | Game Review |
| --- | --- |
| _(screenshot: home page with the Game Puzzles card)_ | _(screenshot: review panel with eval graph)_ |

| Solving a puzzle | Paywall / completion |
| --- | --- |
| _(screenshot: board with eval bar mid-drop)_ | _(screenshot: "Get Unlimited Puzzles!" card)_ |

---

## Future improvements

Not built — these are where the concept would go next, not existing behaviour.

- **Persistent progress** — puzzle progress currently resets on refresh; only the
  selected plan is stored. Real accounts would keep it server-side.
- **Weekly analytics** — a genuine weekly view instead of sample figures.
- **Accuracy tracking** — accuracy trends per theme and over time.
- **Tactical weakness detection** — cluster mistakes into named weaknesses and
  weight the queue toward them.
- **Learning streaks** — spaced repetition, bringing a puzzle back until it sticks.
- **Rating improvement** — correlate drilled themes with rating movement.
- **Cloud sync** — progress across devices.
- **User accounts** — real auth, real game imports from the Chess.com API.

---

## Notes

- Stockfish is GPLv3; Remotion requires a paid licence for larger companies.
  Both are worth checking before this goes anywhere beyond a portfolio piece.
- Sample games, ratings and opponents are fabricated for the prototype.
