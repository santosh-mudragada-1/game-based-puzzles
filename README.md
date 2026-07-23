# Blind Spot Trainer — *Game Based Puzzles*

An interactive prototype of a new **Chess.com** feature: instead of the learning
loop ending at Game Review, the critical moments from your own games become
personalized puzzles that come back until they stick.

> **Concept / design exploration.** This is an independent portfolio prototype
> that borrows Chess.com's design language — it is not affiliated with, endorsed
> by, or an official product of Chess.com.

---

## Screen 1 — Home

A faithful recreation of the Chess.com dark-theme home page with **Game Based
Puzzles** woven in as a native module:

- **App shell** — Chess.com sidebar (Play / Puzzles / Learn / Train / Friends /
  More / Upgrade), search, user chip, footer icons, and a responsive off-canvas
  drawer on smaller screens.
- **Hero** — quick-play column + preview cards (Solve Puzzles · Next Lesson ·
  **Game Puzzles**) inside a layered container.
- **Game History** — sticky panel with the review model: a game only shows
  accuracy + puzzles once it's been **Reviewed**, which unlocks **Practice**.
- **Right rail** — Daily Puzzle, streak, Crystal League, theme, friends, stats.

## Tech

- **Next.js 15** (App Router) · **TypeScript**
- **Tailwind CSS** with Chess.com design tokens · **Framer Motion**
- shadcn-style primitives (`Button`, `Card`, `Badge`, `Avatar`, `Progress`, …)
- Official Chess.com icon assets under `public/`

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build && npm run start   # production build
```

## Structure

```
src/
  app/                     # App Router entry + globals
  components/
    board/                 # FEN → mini board
    dashboard/             # Game History
    home/                  # hero + rail cards
    layout/                # app shell, sidebar
    shared/                # Button, Card, Avatar, …
  features/
    game-based-puzzles/    # Screen composition
  data/                    # realistic sample data
  lib/                     # utils, chess (FEN), asset paths
  types/                   # domain types
public/                    # Chess.com icons, pieces, logos
```

## Roadmap (screens)

1. **Home** ✅
2. Game Review Integration
3. Puzzle Queue
4. Puzzle Player
5. Puzzle Result
6. Reinforcement Queue
7. Progress Dashboard
8. Empty States
9. Notifications
10. Settings
