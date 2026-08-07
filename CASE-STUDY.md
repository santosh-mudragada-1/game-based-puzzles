# Game Based Puzzles — Case Study Source Document

A complete record of the project: what it is, how it was built, every decision that
shaped the Game Based Puzzles feature, and every problem that had to be solved to
get there.

> This document is raw material for a written case study. It is deliberately
> exhaustive — take from it what the narrative needs.

---

## 1. At a glance

| | |
| --- | --- |
| **Project** | Game Based Puzzles — a Chess.com concept |
| **Internal name** | Blind Spot Trainer (`blind-spot-trainer`) |
| **Type** | Independent product-design concept / portfolio prototype |
| **Positioning** | Borrows Chess.com's design language. Not affiliated with, endorsed by, or an official product of Chess.com. |
| **Built** | 24 July 2026 (first screen) → 7 August 2026 (feature complete) |
| **Commits** | 33 |
| **Source size** | ~14,750 lines of TypeScript / TSX / CSS across ~100 files |
| **Largest files** | `puzzle-solver.tsx` (1,534 lines), `use-reviews.tsx` (920 lines) |
| **Deployment** | Vercel |

---

## 2. The premise

### The problem

Chess.com's personalized learning loop **ends at Game Review**. A player finishes a
game, opens the review, sees a red "Blunder" badge on move 24, reads the engine line,
nods — and moves on. The insight is delivered and then discarded. Nothing brings that
position back. Nothing checks whether the idea stuck.

Meanwhile, the puzzles a player *does* solve on Chess.com — Daily Puzzle, Puzzle Rush,
Puzzle Battle — come from a curated library of other people's games. They are good
tactics training, but they are not *your* tactics training. They do not know what you
personally keep getting wrong.

### The thesis

**The critical moments from your own games should become the puzzles you solve.**

The board rewinds to the moment before your mistake, shows you the move you actually
played crossed out, and asks for the move that was there instead. The position is one
you have already sat in front of, under a clock, and got wrong. That is what makes it
worth solving twice.

### The constraint that made it hard

A concept mockup could fake all of this. This one doesn't. **Every position, solution
line and evaluation in the product is verified by Stockfish running in the browser** —
mined live from the connected member's real Chess.com archive. That single decision is
the source of nearly every engineering problem catalogued in section 12.

---

## 3. Scope

**Screens built**

| Route | What it is |
| --- | --- |
| `/` | Chess.com home, recreated — hero row, right rail, recent games, plus the "Game Puzzles" progress card |
| `/welcome` | Onboarding: username → fetch → review → three-step explanation |
| `/puzzles` | Chess.com's Puzzles trophy-path screen, with Game Based Puzzles in the mode menu |
| `/puzzles/game-based` | **The feature.** Theme picker + solver |
| `/review` | Game Review — coach, eval graph, move list, deep-linkable to a ply |
| `/games` | Game history / archive, with per-game Review and Solve |

**API routes** (thin proxies to Chess.com's public read-only API)

| Route | Purpose |
| --- | --- |
| `/api/chesscom/archives` | Profile + rating stats + the list of archive months |
| `/api/chesscom/month` | One month of games, normalised |
| `/api/chesscom/players` | Opponent profiles (avatars, country) for the rail |

They are proxied rather than called from the browser because Chess.com wants a real
`User-Agent` and does not send CORS headers for every endpoint.

---

## 4. Tech stack and architecture

### Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 15 (App Router) + React 19 | File-based routing, route handlers for the API proxy, and Server Components for the static shell |
| Language | TypeScript 5.7 | Domain types are the contract between data, components and features |
| Styling | Tailwind CSS 3.4 with a custom Chess.com token set | Tokens sampled from reference screenshots so the prototype blends into the ecosystem |
| Chess rules | chess.js 1.4 | Legal moves, SAN, check/mate, PGN parsing |
| Engine | Stockfish 18 (WASM, lite single-threaded) in Web Workers | See §6 |
| Animation | Framer Motion 11 | Board, bar, panel, modals |
| Video | Remotion 4 | The upgrade celebration exists as a renderable composition |

### Layer map

```
src/
  app/          routes + API handlers + root layout (provider stack)
  components/
    board/      FEN → static board, king badges
    puzzles/    interactive board, eval bar, completion card, upgrade transition
    review/     Game Review panel — coach, eval graph, move list, playback
    home/       hero cards, right rail widgets
    dashboard/  recent games table
    onboarding/ app gate, welcome, tour
    layout/     app shell, sidebar
    shared/     buttons, cards, avatar, toast, confetti, plan switcher
  features/     screen composition (solver, review, home, game history)
  hooks/        account, reviews, engine eval, plan tier, puzzle progress
  lib/          engine worker, engine settings, chess/FEN helpers, classification,
                puzzle mining, difficulty rules, caches, PGN model, assets
  data/         Stockfish-verified sample puzzles + sample content
  remotion/     upgrade celebration composition
  types/        domain types
```

### Provider stack

Deliberately ordered, in `src/app/layout.tsx`:

```
ChessAccountProvider     ← the connected account + the archive
  ReviewsProvider        ← the engine pool, the reviews, the mined puzzles
    PlanProvider         ← free / premium
      PuzzleProgressProvider  ← outcomes, shared by every screen
        AppGate          ← holds the app back until an account exists
```

`AppGate` sits **inside** `ReviewsProvider` because it waits on that provider's sweep
progress to decide when to let the app through.

---

## 5. The pipeline, end to end

This is the spine of the feature: raw Chess.com archive → verified, solvable puzzles.

### 5.1 Connect

The member types a Chess.com username. `/api/chesscom/archives` returns their profile,
rating buckets, and the list of monthly archive URLs — **reversed, so the newest month
comes first**. That ordering matters: it means the sweep can start on genuinely recent
games while the rest of the archive is still downloading.

Months are fetched **four at a time** (`BATCH = 4`). Chess.com tolerates a handful of
parallel reads and it turns a 27-month archive from about a minute into a few seconds;
going wider starts drawing rate limits.

Games appear in the UI as they arrive rather than blinking on at the end.

### 5.2 Choose what to review

Not every game gets analysed. The sweep takes **the 20 most recent games that
Chess.com has already reviewed** — the ones that come back from the API carrying an
`accuracies` field.

This was a product decision, not a technical one:

> Those rows are the ones already showing an accuracy, so leaving them without a Solve
> button reads as a bug — the member has been told the game was worth reviewing and
> then offered nothing to do about it. Reviewing exactly that set closes the gap, and
> it is a far better-aimed twenty than a random draw: asking for a game review is
> itself a signal the member cared how it went.

A game with no accuracy has never been asked about, so nobody is waiting on it. It
keeps its "Review" button and is read only if pressed.

### 5.3 Review

A pool of Stockfish workers reads the games in parallel.

- **Pool size:** `max(2, min(6, hardwareConcurrency - 1))` — one core left for the
  page so scrolling the archive while it works still feels right; capped at six
  because past that the lanes are only splitting the same CPU into thinner slices.
- **Per position:** `movetime 250ms, depth 18, MultiPV 3`.
- **Progressive publishing:** results are pushed to React every 8 positions
  (`PUBLISH_EVERY`), not every position — 80 renders per game would make the app crawl.
- Every position is scored **from White's point of view** throughout, so one polarity
  runs the whole game and there is no sign-flipping bug surface.

### 5.4 Classify

`src/lib/classify.ts` converts raw centipawns into the language Chess.com's review
speaks.

Everything is expressed in **win percentage**, not centipawns:

```ts
winPct(cp) = 50 + 50 * (2 / (1 + e^(-0.00368208 * cp)) - 1)
```

> Giving up half a pawn in a dead-equal position matters; giving it up when you're a
> rook ahead does not. The win curve is what captures that.

**Classification ladder** (`wpLoss` = win percentage the mover gave up):

| Condition | Label |
| --- | --- |
| Move index < 4 | `book` |
| The move delivers mate | `best` |
| Had a forced mate and lost it, **or** ≥ +500 → < +150 with wpLoss > 8 | `missed` |
| Played the engine's move **and** it was the only move (2nd line > 18 wp worse, position within ±400) | `great` |
| Played the engine's move | `best` |
| wpLoss ≤ 2 | `excellent` |
| wpLoss ≤ 5 | `good` |
| wpLoss ≤ 10 | `inaccuracy` |
| wpLoss ≤ 20 | `mistake` |
| else | `blunder` |

Two edge cases are handled explicitly because Stockfish's reporting is misleading:

- A **delivered mate** is written in as `+3000` for the mover, because the engine
  reports the mated position as `mate 0` with no principal variation — which arrives
  as a plain `0`.
- A move that *delivers* mate would otherwise be classified `missed`, because after
  checkmate the engine correctly reports "no mate available".

**Accuracy** uses Lichess's blended model, and the reasoning is documented in the code:

> A plain average of per-move accuracy lets a wall of forced recaptures drown out the
> blunders — it hands a 500-rated player a 91%. The blend fixes that from both ends.
> The *harmonic* mean is dominated by the worst moves, so one blunder actually costs
> something; the *volatility-weighted* mean leans on the moves played while the
> position was still swinging. Averaging the two lands within a few points of
> Chess.com's own figure for the same game.

A tested finding worth quoting: **searching deeper does not close that gap.** The same
games score within half a point at depth 14 and depth 20. Accuracy is a question of
the model, not of how long the engine thinks.

### 5.5 Find candidates

`findCandidates()` walks the game and collects every one of **the member's own** moves
classified `blunder`, `missed` or `mistake`. Each candidate carries the position
before the mistake, the move actually played, the win percentage thrown away, and the
user-positive evaluation the mistake led to.

Candidates are sorted **worst-first**, so a game that fell apart offers its collapse
rather than its mildest inaccuracy.

Anything inside the first 12 plies is re-labelled `opening-mistake` regardless of
severity.

### 5.6 Build the puzzle

`buildPuzzle()` is where a mistake becomes something solvable. It plays out the
engine's answer move by move — the member's move, then the opponent's best defence,
alternating — and then applies a series of rejection rules.

**Construction details that matter:**

- The position after each ply is **re-scored** rather than reusing the score from
  before the move. A mate distance counts down as the mating side moves, and only the
  position itself knows how far along that count it is.
- Trailing opponent moves are popped off the end, because **a line that ends on the
  opponent's move leaves the member watching rather than solving.**
- `mateIn` is the count of the *user's* plies in the line — not the raw engine number.

**Rejection rules** (a puzzle is thrown away if any fails):

| Rule | Why |
| --- | --- |
| The engine's first move ≠ the move played | The engine agreed with you — nothing to teach |
| First move must be forcing (capture / check / mate) *(band-dependent)* | A quiet move nobody would look at is unsolvable in the way that matters |
| Best move must beat second-best by `onlyMargin` cp *(band-dependent)* | Stops a puzzle having two right answers and marking one wrong |
| Line must be decisive: ends in mate, **or** final ≥ `minFinal` and gains ≥ `minGain` over what was played | A puzzle whose answer wins a tenth of a pawn teaches nothing |

**Copy is generated from what the line actually does**, not templated per category:

| Condition | Title |
| --- | --- |
| Mate in 1 | "Missed Mate in One" |
| Mate in N | "Missed Mate in N" |
| Gain ≥ 600cp | "Missed a Winning Shot" |
| Category is blunder | "Threw Away the Advantage" |
| else | "There Was Better" |

The prompt names the move number and the move played ("On move 14 you played Rd3…"),
and the solved line spells the idea out ("Rxd8# — checkmate on the weak back rank").

### 5.7 Fill the day

The day is **15 puzzles** (`DAILY_PUZZLE_TARGET`).

Twenty games do not reliably contain fifteen findable tactics. The escalation ladder,
in order, is deliberate:

1. **Review the first 5 games and mine them inline.** These are the puzzles that have
   to exist by the time the loading screen lets go, or the member arrives at an empty
   queue.
2. **Review the remaining 15 in the background**, queueing mining as a separate job so
   the visible review counter doesn't stall while a line nobody has asked for is
   worked out.
3. **Still short? Take another wave of 20 already-reviewed games** — up to 2 extra
   waves, 60 games total. Past that the archive is old enough that the mistakes in it
   are no longer the ones being made now.
4. **Only when the archive runs out of reviewed games**, relax the difficulty rung and
   re-mine the same games.

> More games at the same standard adds puzzles of the same difficulty; relaxing adds
> harder ones. So games first, standards last.

Overshoot is tolerated on purpose: several lanes can each read the count as under
target and publish together. The set itself is the last word on how long the day is —
the extras stay filed under the games they came from, reachable through that game's
"Solve".

### 5.8 Cache

Two localStorage caches, both versioned, both defensive.

| Key | Holds | Notes |
| --- | --- | --- |
| `gbp:archive:v1` | Profile + the 200 newest games | Hard ceiling of 1.5M characters |
| `gbp:reviews:v2` | Per-game rows, accuracy, the day's puzzles, per-game puzzles, mined game ids | Max 60 games |
| `gbp:chesscom` | The connected username | |
| `gbp:plan` | free / premium | |

Reasoning, from the code:

> Reviewing twenty games is half a minute of every core the machine has, and the
> answer never changes — the same position at the same settings scores the same.
> Redoing it on every reload is the loading screen appearing for work that has already
> been done, and worse, the puzzles come out different each time, so the set someone
> was halfway through is gone.

**The version is part of the key on purpose.** What counts as a puzzle depends on the
difficulty rules, so changing those has to invalidate everything mined under the old
ones rather than serving them back.

**Writes shed weight rather than fail.** If the full store won't fit, it retries
without the per-ply rows — a game still shows its accuracy and still has its puzzles;
it just has to be re-read to be opened move by move. Only if *that* fails does it drop
the key entirely.

Writes are debounced 1,200ms, plus a `pagehide` flush — because a reload mid-sweep is
exactly the moment the cache is worth the most.

---

## 6. Engine decisions

### Which build

**Stockfish 18 lite, single-threaded WASM.**

| Option | Rejected because |
| --- | --- |
| Full NNUE build | 113 MB download vs 7 MB for lite |
| Multi-threaded build | Needs `SharedArrayBuffer`, which needs COOP/COEP headers, which break same-origin embeds and Vercel previews |

The build is copied out of `node_modules` into `public/engine` by
`scripts/copy-engine.mjs`, wired to `predev` and `prebuild`. `public/engine` is
gitignored, so a 7 MB binary never lands in the repo.

### Search budgets — mirroring Chess.com's own settings panel

The app reproduces the two jobs Chess.com's Settings → Engine panel splits:

| Job | Chess.com's setting | This app |
| --- | --- | --- |
| **Game Review** | Stockfish 16, "Fast (~1 sec, 3270 Rating)" | `movetime 250ms, depth 18, MultiPV 3` |
| **Analysis** | Stockfish 18 Lite, "Maximum Time 5 sec", "Number of Lines 3" | `movetime 5000ms, depth 22, MultiPV 3` |

The 250ms figure is arrived at by arithmetic, and the reasoning is worth quoting in
full because it is the kind of decision a case study is made of:

> "Fast (~1 sec)" is a second of *Chess.com's server* — full-strength Stockfish 16
> across many cores. A browser tab has one thread per worker, so the honest translation
> is not the wall-clock but the arithmetic: twenty games is ~1,400 positions, and
> reviewing them inside two minutes leaves ~340ms of thinking per position on a
> four-core machine, whatever way the workers are arranged. 250ms sits under that with
> room to spare, reaches depth 15–16 on three lines, and is still six times the
> thinking the old depth-14 single-line search did.

Both limits are sent together (`go depth 18 movetime 250`) so Stockfish stops at
whichever it reaches first — a forced recapture in a dead endgame doesn't spend its
whole allowance proving what it already knows.

**Why MultiPV 3 and not 1:** the third line's score is what tells an *only move* apart
from one of several good ones. That single number powers both the "Great move"
classification and the `onlyMargin` puzzle-quality rule.

### Worker topology

- **`getEngine(channel)`** returns a lazily-created shared worker per named channel.
  The UI uses `"ui"`; the puzzle screen uses **two** — `"puzzle-peak"` and
  `"puzzle-bar"`.
- **`createEngine()`** returns a private worker, used for the review pool's lanes.

The channel split exists because **one engine runs one search at a time**. The puzzle
eval bar needs the position on the board *and* the position the mistake threw away at
the same moment. On one worker the second would wait out the first's full five-second
Analysis budget before either could be drawn. Likewise, a background sweep of fifty
games on the shared worker would keep stopping the eval bar the member is actually
looking at.

### Warm-up choreography

The engines boot while the member is still typing their username — a second or two per
lane that would otherwise be spent with a progress bar on screen.

But **the first lane goes up alone**, and only then do the rest come up together:

> The build is 7 MB of WebAssembly, and six lanes started together on a cold cache is
> six simultaneous downloads of it plus six compiles — forty megabytes and every core
> busy, on the one screen where all anyone is doing is typing into a box. Once the
> first has been through, the file is in the HTTP cache and the rest can come up
> together for nothing.

---

## 7. Puzzle quality — the difficulty ladder

This is the most important product decision in the feature, and it came from a real
failure (see §12, Problem 1).

**The insight: the mistakes in a 1100-rated game are not 1100-rated puzzles.**

The engine's refutation of a weak player's mistake is often a quiet move that only
pays off three moves later, or one of two equally winning ideas where the other is
marked wrong. That is unsolvable in the way that matters — you cannot see *why* you
were wrong.

So the bar for what becomes a puzzle moves with the player.

| | **Casual** (< 1400) | **Club** (1400–1899) | **Strong** (≥ 1900) |
| --- | --- | --- | --- |
| Half-moves of line | 3 | 3 | 5 |
| Must be a single move (unless mate) | ✔ | — | — |
| First move must be forcing | ✔ | — | — |
| Margin over 2nd-best | 100cp | 60cp | none |
| Min gain over what was played | 300cp | 250cp | 200cp |
| Min final evaluation | 200cp | 150cp | 150cp |
| Mistakes examined per game | 10 | 7 | 5 |
| Puzzles kept per game | 3 | 2 | 2 |

**Rating source:** rapid → blitz → bullet → daily → null. Rapid first, "since that is
the one most players think of as theirs." Unrated or unconnected defaults to **Casual**
— assume the player who needs the help.

**Why the "one move unless mate" rule:**

> A mate explains itself as it is played, so the follow-up is part of the pleasure.
> Anything else that needs a second move needs the solver to have seen three plies
> ahead to know why the first one was right — which is the thing that made these
> unsolvable.

**Why stricter bands examine *more* of each game:** strict rules reject most of what
they are shown, so the easier bands have to look deeper into each game to come back
with a full day.

---

## 8. The solving experience

### The core loop

1. The puzzle opens on the position **before** the mistake.
2. The mistake **plays itself out on the board**, holds for a beat, then rewinds.
3. A red arrow and a struck-through ghost piece mark what was played.
4. The eval bar shows what was available and how far the played move fell.
5. The member finds the move. The opponent's replies auto-play as the engine's best.
6. A green "Solved" bar closes it out with the evaluation recovered.

### The three-beat intro (450ms → 1,100ms → 500ms)

`before` → `forward` (the mistake slides on) → `back` (it rewinds) → `done`.

This exists because of a tester failure:

> Testers shown only a red arrow read it as an instruction and replayed the blunder.
> Watching the move happen **and be taken back** makes it unmistakably history, and
> leaves the board on "your turn".

The intro is deliberately **not** re-triggered by a wrong answer — a failed attempt
shouldn't rewind the board and make the solver watch the whole thing again.

### Board vocabulary

| Element | Colour / form | Meaning |
| --- | --- | --- |
| Played-move arrow | Red `#d0453f` | This was wrong |
| Solution / hint arrow | Teal `#26c2a3` | This is the move |
| Ghost piece | Greyed, 55% opacity, red cross | The move already happened, and it was wrong |
| Hint ring | Teal ring on the from-square | This is the piece |
| Highlight | Board yellow | Last move's squares |
| Danger square | Red, pulsing if mated | King in check |
| Legal-move dot / ring | Grey dot, or ring for a capture | Where this piece can go |

The played-move arrow was **originally orange**. It was changed to red because
testers were playing the arrow instead of improving on it — orange read as a
suggestion. *(Note: the `BoardArrow` tone is still named `"orange"` in the type; the
value is red. A naming artifact worth cleaning up.)*

### The hint ladder

Three presses, escalating, and each one costs the clean solve:

1. **Hint** — rings the piece that should move.
2. **Show move** — draws the teal arrow.
3. **Show solution** — auto-plays the rest of the line. Records the puzzle as `failed`.

### Outcomes and progress

Three outcomes: `solved-clean` (no hint, no reveal, no wrong move), `solved-hint`,
`failed`.

Progress lives in `PuzzleProgressProvider`, **above the routes**, so the home card and
the puzzle queue can never disagree — solving a puzzle moves both immediately, with no
refetch and no refresh.

Attempts only ever **upgrade** a puzzle's standing. Replaying a puzzle you needed a
hint for and getting it clean is an improvement, never a downgrade.

**Two separate records, on purpose:**

- `outcomes` — this session only, wiped whenever a session starts.
- `record` — lifetime, shared app-wide.

Without the split, drilling one theme and then retrying three puzzles would report
"3/8" even though all eight had been solved.

Progress is **deliberately not persisted**. A reviewer gets a clean slate on reload;
only the chosen plan, the connected account and the engine's work survive.

### Review and navigation

- `←` / `→` scrub through the plies played so far — **while solving as well as after**.
  You can step back to look at the position, then come forward and keep solving.
- `Enter` advances to the next puzzle once solved. `H` gives a hint.
- Keyboard handlers are suspended while the completion card or upgrade celebration is
  up: arrows must not scrub a position the user can't see.
- The footer arrows switch puzzles and restore each puzzle's own progress.

### Panel narrative

The right panel reads top to bottom as a story:

1. **What happened in your game** — the move played, struck through in red, with the
   evaluation it cost (`+2.1 → −0.4`).
2. **Side to move** — a white or black square, as on a scoresheet.
3. **One row per move found** — "♜g7+ is correct!", springing in as each lands, so a
   multi-move puzzle shows progress instead of staying silent until the end.
4. **Solved** — a green bar with the evaluation recovered, sparks drifting up if the
   solve was clean.

Two small craft decisions in there:

- The strike-through is an absolutely-positioned 1px span, not `text-decoration` —
  a text-decoration skips the figurine glyph and stops short of it.
- The wording widens only when the solve wasn't clean ("Solved with a hint",
  "Solution revealed") so the three states read differently **without inventing a
  colour the design system doesn't have**.

### Coach copy state machine

| State | Line |
| --- | --- |
| No puzzle open | Describes the queue that is actually loaded (live / mining / sample / "nothing in that game") |
| Fresh puzzle | The generated prompt |
| Correct move played | "Good move! Now find the next one in the line." |
| Wrong move | "Not quite — that isn't the move. Take another look." |
| Scrubbed back | "Reviewing the line — press → to return to your move." |
| Solved | The generated solved line |

---

## 9. The evaluation bar

The most subtle component in the feature, and the one that took the most iteration.

### The concept

The bar does not show "who is winning". It shows **what you gave up**.

- It is **anchored** at the evaluation that was available — labelled at the bottom.
- It **fills** to where the move actually played left things — labelled at the fill
  boundary.
- The gap between them is painted red, with a highlight sweeping **downward**, from
  the winning end toward the centre, looping while the puzzle is unsolved.
- When the solver finds the right move, the same band replays **in green, sweeping
  upward**, once.
- A hairline at the vertical centre marks 0.0, so the fill boundary landing on it is
  literally "you threw away the win".

### The rules that keep it honest

| Rule | Reason |
| --- | --- |
| The green sweep fires only on a **change of ply**, not on every score update | Stockfish refining +1.09 → +1.10 as it deepens would celebrate a move nobody played |
| The green sweep fires only when the position was reached by the **solver's own move** | The opponent's replies auto-play as the engine's best, so a "gain" there is just search wobble |
| Threshold of 40cp | Below that it is engine noise |
| The peak anchor applies **only at ply 0, and only while unsolved** | A dip on move three is the line breathing — the opponent's reply, a quiet in-between move — not advantage being thrown away. Painting that red read as a fresh mistake |
| Once solved, stepping back to the start shows the position **as it stood**, not the wreck the played move made of it | Otherwise scrubbing back re-opens the gap and replays the red "you threw it away" band on a puzzle already put right |
| The peak label disappears once the solver catches up | With no gap there is nothing to explain — and a solved puzzle should show its result ("1-0") rather than the mate that used to be on offer ("M1") |
| Fill uses a 450ms out-quint curve, **not a spring** | A spring overshoots, which on an evaluation bar reads as the position being briefly better than it is — and momentarily pushes the fill past the band it's animating through |
| Label duration is shared with the fill | So the number tracks the boundary instead of trailing it |

### The mate-label problem

A mating line's plies are scored *after* each move, so the final one reads "mate 0" —
delivered. But from the position the solver is looking at, the mate is still N of
*their own* moves away. Labelling it "1-0" before they have played it claims the game
is already over. The peak eval therefore computes `ceil((mateIndex + 1) / 2)` rather
than reading the stored number.

---

## 10. Free vs Premium

| | Free | Premium |
| --- | --- | --- |
| Puzzles per day | 3 (`FREE_DAILY_LIMIT`) | The whole queue |
| Sees the rest of the queue | ✔ (counters read "Puzzle 3 / 8") | ✔ |
| End card | "Get Unlimited Puzzles!" | "You're all caught up!" |
| End card actions | Go Premium | Retry N · Solve next theme · Solve again |

**The queue is never trimmed for free members.** They should see all of it — and how
far in the wall sits. `dailyLimit` is what actually stops them, and the "Solved" stat
on the paywall card deliberately reads against the *whole* queue (3/8) so the five
puzzles they can see but can't reach are the pitch.

**The plan lives in React context, not a URL param**, because upgrading has to reach
the sidebar (which drops "Upgrade") as well as the puzzle queue — without a navigation
that would throw away the session in progress. `?plan=free` / `?plan=premium` still
work for jumping straight into either flow, and a floating prototype-only switcher
sits in the corner.

**Upgrading happens in place.** The session, the outcomes and the position in the
queue all survive: `setPlan("premium")` → celebration overlay → resume at the puzzle
the paywall stopped them at, not back at the start.

**The end card orders its actions by usefulness**, and moves the autofocus down the
list as options disappear: clean up what went badly → move to the next theme still
holding unsolved puzzles → replay what was just finished.

---

## 11. Onboarding

### Why `/welcome` is a route, not an overlay

> An overlay still has the dashboard underneath it, so the server sends a whole home
> page of sample numbers that shows for a beat before the client can decide anybody is
> logged in. Nothing renders here until that decision is made, so there is nothing to
> flash.

`AppGate` renders **a plain field of the app's own background** while it decides — no
logo, no spinner, no wait implied. This is the sliver before a redirect, not a loading
screen.

### Setup is a thing that happens on the way in, not a state to return to

Once the app has been let through, `openedRef` keeps it through. A sweep picking up a
game played since the last visit, or the archive quietly refreshing behind a restored
one, both make the app "busy" again — and neither is a reason to throw somebody out of
the page they are on.

### The tour and the wait are the same 30 seconds

The three-step tour is not decoration. It takes about as long to read as the first
batch of games takes to review, so the explanation and the wait overlap rather than
running back to back.

Each step animates the thing it describes, "because the whole idea is a board doing
something, and a still picture of a board doing something is just a board":

1. **You play your games** — a few moves of the Italian, looping.
2. **Stockfish reads every move** — move rows filling in with classification badges
   while the eval bar collapses as the blunder lands.
3. **Your mistakes become puzzles** — the full loop in one animation: a move is
   played, the board flinches, the move is taken back, and the same position is handed
   over as a question. *The shake is what makes "that was wrong" register before any
   label has been read.*

### Loading copy

- Progress bar: fetching fills 0–50%, reviewing fills 50–100%.
- **No count while reviewing.** "3 of 5" invites arithmetic about how long the rest
  will take — and the rest finish behind the app anyway.
- The wait is named honestly: *"This can take a minute or two."*
- Trust copy on the form: *"Read-only, public data. No password, nothing stored but
  the name."*
- An escape hatch: *"Explore with the sample game instead."*
- Whatever was typed is saved, so a reload doesn't lose it.

---

## 12. Problems, and how they were resolved

This is the catalogue. Each entry is a real problem that changed the product.

---

### Problem 1 — The generated puzzles were unsolvable

**Symptom.** Once real games were being mined, the puzzles that came out of a
lower-rated archive were often impossible in a way that felt unfair: the answer was a
quiet positional move that only paid off three moves later, or there were two equally
winning ideas and only one was accepted.

**Diagnosis.** The mistakes in a 1100-rated game are not 1100-rated *puzzles*. Being
"the engine's best move" is not the same as being findable, and "wins by 0.3" is not
the same as "teaches something".

**Resolution.** A rating-aware difficulty ladder (§7) with four independent quality
gates: the move must be **forcing**, it must be the **only** move by a measurable
margin, it must **win something decisive**, and at the bottom band it must be a
**single move** unless it is a mate. Casual players get one-move tactics; strong
players get the long quiet lines back, because for them those are the interesting part.

**Side effect that had to be handled.** Strict rules reject most of what they see, so
the day started coming up short — which produced Problem 2.

---

### Problem 2 — A short day

**Symptom.** With the strict rules in place, twenty games often didn't yield fifteen
puzzles. The member would arrive at a queue of eight and a counter reading 8/15.

**Resolution — a two-stage escalation, in a deliberate order:**

1. **More games at the same standard first.** Two extra waves of 20 already-reviewed
   games (60 total). Another wave adds puzzles of the same difficulty; relaxing adds
   harder ones.
2. **Only when the archive runs out** of reviewed games, step one rung up the ladder
   and re-mine the games already read — which is mining, not reviewing, so it costs
   little.

**And a display fix.** The target is 15 *while there is still mining to come*, so the
day reads as the day it is aiming to be. Once the engine stops, the target becomes
whatever it actually found — an archive that only held eleven tactics should say "11",
not leave someone stuck at 11/15 with nothing left to solve.

---

### Problem 3 — Two of the six themes had nothing to mine

**Symptom.** The Figma start screen listed six mistake themes: Blunders, Mistakes,
Missed Opportunities, **Lost Advantages**, **Critical Moments**, Opening Mistakes.
Two of them were always empty.

**Diagnosis.** "Lost advantage" and "critical moment" are not Chess.com move
classifications. The review never labels a move that way, so a theme built on them had
nothing to draw from.

**Resolution.** Both were dropped from the type, the data and the asset folder
(commit `b4874a0`, 6 Aug — the badge art for both was deleted). The taxonomy is now
four themes, each one a real classification the review actually produces:

```ts
type PuzzleCategory = "blunder" | "mistake" | "missed-opportunity" | "opening-mistake";
```

Theme rows on the start screen are **counted from the live queue** and hidden when
empty, so the list can never again show a theme with nothing behind it.

*(Doc drift: the README still describes six themes. Worth fixing before publishing.)*

---

### Problem 4 — Testers replayed the blunder

**Symptom.** Shown a position with a coloured arrow on it, testers played the arrow.
The whole point of the screen — "this is what you did wrong, do better" — was being
read as "play this move".

**Two-part resolution:**

1. **Change the colour.** Orange read as a suggestion. Red `#d0453f` reads as a
   verdict.
2. **Change the grammar.** Static marks alone weren't enough. The mistake now *plays
   itself out on the board and is visibly taken back* before the arrow and the ghost
   piece land. A move that happens and is undone is unmistakably history.

The ghost piece is the third layer: the piece appears greyed and desaturated on the
square it went to, with a red cross drawn over it. A solid arrow reads as "play this";
a crossed-out grey piece reads as "this already happened, and it was wrong."

---

### Problem 5 — A superseded engine search published a score for a position it never looked at

**Symptom.** Scrubbing quickly through a puzzle line, or moving between puzzles fast,
would occasionally show a confident **0.0** on the eval bar for a position the engine
had never evaluated.

**Diagnosis.** When a newer search took the worker over, the old promise still
resolved — and a resolved promise reads as "the engine has spoken."

**Resolution.** A dedicated `EngineCancelled` error. A superseded search **throws**
rather than resolving, and every caller treats that as "say nothing" — leave whatever
is on screen alone. A `scored` flag tracks whether any score at all came back for the
current request.

**The subtlety:** depth is *not* a usable test for "did we get an answer". A position
that is already checkmate is reported as `depth 0 score mate 0`, which is a real answer.

---

### Problem 6 — An orphaned `bestmove` ended the *next* search before it scored

**Symptom.** Intermittently, one position in a sweep would come back with no
evaluation at all — and the failure moved around.

**Diagnosis.** When a search was superseded, its handler bailed out early and left its
own `bestmove` line ownerless. Because searches are chained on one worker, that
terminator landed on the *next* search instead — ending it before it had scored a
single position.

**Resolution.** A handler **always consumes its own terminator**, superseded or not.
It stops collecting `info` lines when it sees it has been superseded, but stays
installed until its `bestmove` arrives, then unregisters.

This is the kind of bug that only appears under concurrency and is invisible in a
single-search demo — a good thing for the case study to name.

---

### Problem 7 — The eval bar opened a red gap on the very move that closed it

**Symptom.** Past the first move, playing the correct move would briefly flash the red
"you threw it away" band — on the move that had just won the advantage back.

**Diagnosis.** The eval hook deliberately *holds* the previous ply's score while the
next position is searched (so the bar makes one clean move per ply instead of flicking
through the authored number on the way to the real one). But holding the *previous*
score against the *new* peak means the bar shows a pre-move number in a post-move
context.

**Resolution.** Until the live search settles, the bar shows the **authored,
engine-verified score for that ply** — which was computed during mining and stored with
the puzzle. The live search still runs and still refines the number; it just no longer
decides when the bar is allowed to be true.

---

### Problem 8 — The bar arrived several seconds after the board

**Symptom.** The board appeared, the solver started thinking — and only three or four
seconds later did the red band open to explain what had been thrown away. By then the
explanation had missed its moment.

**Diagnosis.** The bar was waiting for two fresh five-second Analysis searches (the
current position and the peak) before it would move.

**Resolution.** `barReady` is true as soon as a puzzle exists. Both numbers are
*already known* — mining verified them with Stockfish and stored them with the puzzle.
The bar drops immediately on authored values and the live search refines it in place.

---

### Problem 9 — Two evals queued behind each other

**Symptom.** Even once the bar stopped waiting, the second of its two readings was
slow to land.

**Diagnosis.** One engine runs one search at a time. The peak reading and the current
reading were sharing a worker, so the second sat behind the first's entire five-second
budget.

**Resolution.** Named channels. `getEngine("puzzle-peak")` and
`getEngine("puzzle-bar")` return separate workers. The same mechanism keeps the
background review pool (`createEngine()`, private workers) from fighting the eval bar
the member is actually looking at.

---

### Problem 10 — The green "won it back" sweep celebrated moves nobody played

**Symptom.** The green upward sweep fired on its own, repeatedly, while the solver sat
still.

**Diagnosis.** Two causes. First, Stockfish deepening its search nudges the score
(+1.09 → +1.10), and the sweep was watching the score. Second, the opponent's
auto-played replies also change the score.

**Resolution.** Three guards: the sweep fires only when the **ply identity** changes
(`step` key), only when the position was reached by the **solver's own** move, and only
when the swing exceeds **40cp**. It also fires at most once per ply (`firedRef`), and
its expiry timer lives in its own effect — tying the timer to the same effect let each
deepening score cancel it through cleanup, which made the band stick.

---

### Problem 11 — The wrong-move shake replayed on the next puzzle

**Symptom.** Getting a puzzle wrong, then advancing to the next one, made the fresh
board shake before the solver had touched anything.

**Diagnosis.** The board is remounted per puzzle, so testing `shakeSignal > 0` was
true on mount if the previous puzzle had ever recorded a wrong move.

**Resolution.** Only an **increase** in the signal counts. The component tracks the
previous value in a ref and shakes only on a rise. `shakeSignal` is also explicitly
reset to 0 when switching puzzles.

---

### Problem 12 — The home card and the puzzle queue drifted apart

**Symptom.** The home page's "Game Puzzles — 4/8 completed" card and the actual queue
disagreed, and a hardcoded figure on the home card never moved at all.

**Resolution.** `PuzzleProgressProvider` above the routes. Both screens read and write
the same record, so solving a puzzle moves both immediately with no refetch and no
refresh. The two screens *can't* drift, structurally.

---

### Problem 13 — Session counters lied after a retry

**Symptom.** Solving all eight puzzles, then retrying three, made the meters read
"3/8" — as if five had been un-solved.

**Diagnosis.** Session outcomes are (correctly) wiped when a session starts, so on
their own they can't report lifetime standing.

**Resolution.** Two records. Session outcomes drive the in-run UI (which puzzle is
solved, what the Solved bar says); the lifetime record drives every meter, the end
card and the home page. Lifetime outcomes only ever upgrade, so getting a hinted
puzzle clean on a retry is an improvement.

---

### Problem 14 — Reloading threw away half a minute of engine work and reshuffled the queue

**Symptom.** Every reload re-ran the entire review, showed the loading screen again,
**and produced a different set of puzzles** — so a member halfway through a set lost it.

**Resolution.** The `gbp:reviews:v2` cache (§5.8). On restore, every cached game goes
into `plannedIds`, which the sweep filters against — so those games are never queued,
the loading screen has nothing to wait for, and the member comes back to the same
fifteen puzzles rather than fifteen freshly-mined ones.

A restored session that was interrupted mid-sweep can come back short of a full day.
That case is handled separately: the rows are already there, so the top-up is **mining,
not reviewing**.

---

### Problem 15 — Re-fetching a 27-month archive on every reload

**Symptom.** Even with reviews cached, a reload put a progress bar in front of someone
who had been there a minute ago while a few hundred PGNs came back down the wire.

**Resolution.** The archive cache (`gbp:archive:v1`) plus a **background refresh
pattern**: the stored games go up instantly and the app asks Chess.com what's new
behind them. A background refresh never drops the app into a loading state, never
empties the list, and — if it fails — leaves the stored archive standing, because it
was good a moment ago and is better than an error over a working app.

**The quota problem it created.** A full archive is thousands of PGNs and would crowd
the origin's localStorage quota, taking the review cache down with it — and *that* one
costs half a minute of engine time to rebuild. Resolution: cap at **200 games** (the
top of the history table, every opponent on the rail, far more than the sweep looks at)
with a hard 1.5M-character ceiling, and drop the key entirely rather than write a
partial.

---

### Problem 16 — The dashboard flashed sample numbers before the account loaded

**Symptom.** A page of fabricated home-page figures appeared for a beat before the
client could establish whether anyone was connected.

**Diagnosis.** The connect dialog was an overlay, so the dashboard underneath it was
still server-rendered and still shipped.

**Resolution.** Onboarding was moved out of an overlay and into its own route,
`/welcome` (commit `6a7e878`, 7 Aug — `connect-dialog.tsx` deleted, `welcome.tsx` and
`tour.tsx` added). `AppGate` renders nothing of the app until the decision is made, and
shows a plain background field — not a spinner — during the sliver before the redirect.

---

### Problem 17 — Setup kept re-appearing after the member was already inside

**Symptom.** A background archive refresh, or the sweep picking up a newly-played
game, would make the app "busy" again — and eject the member back to the setup screen.

**Resolution.** `openedRef`: once the door has been opened it stays open for the
session. Setup is a thing that happens on the way in, not a state to be sent back to.
Only an explicit disconnect resets it.

---

### Problem 18 — The member waited through the review twice

**Symptom.** The archive downloaded, *then* the review ran. Two consecutive waits.

**Resolution — three overlapping fixes:**

1. **Review while the archive is still downloading.** Months arrive newest-first, so
   the reviewed games seen first really are the most recent ones — the sweep set can
   be filled in as it appears.
2. **Only 5 games gate the door.** `FIRST_BATCH = 5` are reviewed and mined inline so
   puzzles exist the moment the loading screen lets go; the other fifteen carry on
   behind the dashboard, because nobody is waiting on a game they haven't scrolled to.
3. **Warm the engines during typing** (§6), so the 7 MB download and compile don't land
   on the first position.

---

### Problem 19 — "Solve" on a specific game was slow, and silent when there was nothing there

**Symptom.** Pressing Solve on a row of the archive dropped the member on the start
screen to find those puzzles themselves. If the game hadn't been reviewed yet, nothing
happened.

**Resolution.** `/puzzles/game-based?game=<id>` deals that game's puzzles directly.
Requesting them **puts that game at the head of the engine queue** and, if every lane
is mid-game, takes one lane off what it is doing — the interrupted game is re-inserted
at position 1 so it isn't lost. The session opens the moment the first puzzle lands.

**And the empty case is made explicit.** An empty entry means "looked, nothing there";
a missing entry means "still looking". The solver can tell them apart, so the coach can
say either *"Looking through that game for the moments worth replaying…"* or *"Nothing
worth replaying in that game — you kept it clean. Here's today's set instead."*

---

### Problem 20 — Mining stalled the review counter the member was watching

**Symptom.** The review progress crawled while the pool built solution lines.

**Diagnosis.** Building a line is engine work too. Doing it inline took a lane off the
review pass — to work out a line nobody had asked for yet.

**Resolution.** Mining is a **separate job kind** queued at the back. Only the first
batch mines inline (because those puzzles must exist by the time the door opens);
everything after waits its turn.

---

### Problem 21 — The upgrade celebration rendered a blank screen

**Symptom.** The Remotion `<Player>` reported `isPlaying()` — and never advanced past
frame 0.

**Resolution.** The in-app overlay was rewritten in Framer Motion. **The Remotion
composition was kept** (`src/remotion/upgrade-badge.tsx`) as the renderable-to-video
version of the same choreography, and Remotion itself is dynamically imported so it
stays out of the main bundle until someone actually upgrades.

A related craft note: the shine sweeping across the diamond is masked on a *static*
wrapper, not on the moving highlight — masking the highlight itself drags the
diamond-shaped cutout along with it and paints a bar across the whole container.

---

### Problem 22 — A disabled button read as broken

**Symptom.** Engine analysis is out of scope for the prototype, and a greyed-out
"Analyse" button in a portfolio walkthrough reads as a bug rather than a boundary.

**Resolution.** The button keeps its normal visual weight and simply doesn't respond —
`aria-disabled`, `tabIndex={-1}`, and a title of "Engine analysis — coming soon". Not
disabled, not lying: inert.

---

### Problem 23 — Accuracy figures didn't match Chess.com's

**Symptom.** A plain mean of per-move accuracy overstated the figure by ten points or
more, and handed a 500-rated player a 91%.

**Diagnosis.** A wall of forced recaptures drowns out the blunders.

**Resolution.** The blended model in §5.4 — harmonic mean (so one blunder actually
costs something) averaged with a volatility-weighted mean (so the moves played while
the position was still swinging carry the weight). Lands within a few points of
Chess.com's own figure.

**And a finding worth naming:** the gap was tested against depth. The same games score
within half a point at depth 14 and depth 20. It was never a search-depth problem.

---

### Problem 24 — Boards kept turning brown

**Symptom.** Figma exports and reference screenshots for the feature showed a
**brown/wooden** board. Implementing them literally kept introducing a board theme the
product had not chosen.

**Resolution.** Established as a standing project rule: implement everything else from
a shared design — layout, labels, arrows, animation, spacing — but the board stays
green/cream (`#eeeed2` / `#769656`), Chess.com's default and the theme this prototype
commits to. The brown in the mockups is whatever theme happened to be active in Figma,
not a design decision.

---

## 13. Design system

Tokens live in `tailwind.config.ts`, sampled from Chess.com reference screenshots.

**Surfaces** — warm near-black charcoals: `bg #302e2b`, `surface #262522`, raised
`#353331`, sunken `#1f1e1c`, rail `#272522`, hairlines `#3d3a37`.

**Brand** — `#81b64c` with hover, press, and a `#4c7a2f` 3D bottom edge. Every primary
button carries an inset bottom edge shadow, which is what makes Chess.com's buttons
read as physical.

**Board** — light `#eeeed2`, dark `#769656`, highlight `#f6f669`, hint `#fbcf4d`.

**Move classifications** — one colour per badge, aligned to the art in
`/public/move-types`: brilliant teal, great blue, best green, excellent sage, good
grey, book tan, inaccuracy yellow, mistake orange, missed amber, blunder red.

**Typography** — Inter as the base; a `--font-chess-sans` display slot that falls back
to Inter (Chess Sans is proprietary); and a **figurine notation font** (`public/fonts/
chess.ttf`) so SAN renders with real piece glyphs — ♜g7+ rather than Rg7+.

**Motion tokens** — `out-quint` `cubic-bezier(0.22, 1, 0.36, 1)` is the house curve.
Custom keyframes for the mated king's square breathing red (`loss-pulse`), the king
taking the blow once and settling (`king-topple`), and badge pops.

**Accessibility adjustment:** `ink-soft` was raised to `#a3a19e` specifically to clear
WCAG AA (4.5:1) for small text on the app background.

---

## 14. Accessibility and motion

- **`prefers-reduced-motion` is honoured** in the eval bar sweeps, the completion
  card's sparkles, the count-up numbers, and the upgrade transition — which fires its
  `onDone` immediately rather than holding the member on a static screen for three
  seconds.
- **The board is keyboard-operable.** Squares are `role="button"` with labels like
  "e4, white knight" / "e4, empty", activate on Enter and Space, and only actionable
  squares take tab focus.
- **The eval bar is `role="img"`** with a label that reads both numbers: *"Evaluation
  −0.4, +2.1 was available."*
- **The completion modal** is a labelled `role="dialog" aria-modal`, focuses its
  primary action on open, and closes on Escape.
- **Every screen has an `sr-only` `<h1>`.**
- The opponent's "thinking" dots carry `aria-label="Opponent is moving"`.

---

## 15. Numbers worth quoting

| Metric | Value |
| --- | --- |
| Daily puzzle target | 15 |
| Free daily allowance | 3 |
| Games auto-reviewed on connect | 20 (+ up to 2 more waves of 20) |
| Games gating the loading screen | 5 |
| Worker pool | `max(2, min(6, cores − 1))` |
| Review search | 250ms / depth 18 / 3 lines |
| Analysis search | 5,000ms / depth 22 / 3 lines |
| Positions in a 20-game sweep | ~1,400 |
| Engine binary | 7 MB (vs 113 MB for the full NNUE build) |
| Archive fetch concurrency | 4 months at a time |
| Games cached | 200 archive / 60 reviewed |
| Sample puzzle set | 8, all Stockfish-verified |
| Difficulty bands | 3 (Casual / Club / Strong) |
| Puzzle themes | 4 |

---

## 16. Known limitations and doc drift

Honest list — useful to name in a case study rather than hide.

| Item | Status |
| --- | --- |
| Puzzle progress resets on refresh | By design for the prototype; only plan, account and engine work persist |
| Engine analysis button | Inert placeholder |
| README lists six puzzle themes | Stale — the code has four (§12, Problem 3) |
| `BoardArrow` tone named `"orange"` | Value is red; naming artifact from the colour change |
| "All 8 puzzles are yours" in the upgrade overlay | Hardcoded to the sample set's length |
| Sample games, ratings, opponents, weekly analytics | Fabricated for the prototype |
| Progress does not follow the member across devices | localStorage only; no server, no auth |
| Licensing | Stockfish is GPLv3; Remotion requires a paid licence for larger companies. Both need checking before this goes beyond a portfolio piece |

---

## 17. Timeline

| Date | Milestone |
| --- | --- |
| **24 Jul 2026** | Initial commit — Screen 1, the Chess.com home page recreated with the Game Puzzles card |
| **4–5 Aug** | The solver: interactive board, eval bar, completion modal, plan switcher, shared puzzle progress, Remotion upgrade celebration |
| **6 Aug** | Figurine notation font; theme taxonomy cut from six to four; king badges and mate states; board polish |
| **7 Aug (early)** | Chess.com API integration — archives, months, account provider, game history, live game review |
| **7 Aug (mid)** | The mining pipeline: `use-reviews`, `mine-puzzles`, `classify`, worker pool, live queue replacing the sample set |
| **7 Aug (late)** | `engine-settings` mirroring Chess.com's own panel; onboarding rebuilt as `/welcome` + `AppGate` + tour |
| **7 Aug (final)** | The difficulty ladder and the review cache — the two changes that made generated puzzles both solvable and stable across reloads |

The shape of the arc is worth noting: **the first two-thirds built the experience
against authored data; the last third replaced the data with a live engine — and every
hard problem in §12 arrived in that last third.**

---

## 18. Where it goes next

Not built. These are where the concept would go, not existing behaviour.

- **Persistent progress** — server-side, tied to a real account.
- **Spaced repetition** — a puzzle comes back until it sticks, which is the part of the
  thesis the prototype states but doesn't yet implement.
- **Tactical weakness detection** — cluster mistakes into named weaknesses ("back rank",
  "hanging pieces on f7") and weight the queue toward them.
- **Accuracy trends per theme and over time.**
- **Rating correlation** — did drilling this theme move the rating.
- **Cloud sync** and **real accounts**.

---

## 19. The one-paragraph version

Chess.com tells you what you did wrong and then lets you forget it. Game Based Puzzles
closes that loop: it reads your real archive, runs Stockfish over the games you already
had reviewed, finds the moments you got wrong, and hands each one back as a puzzle —
the board rewound to before the mistake, the move you played crossed out, the
evaluation bar showing exactly what you gave up. Every position and line is
engine-verified rather than authored. The hard part was not generating puzzles; it was
generating *fair* ones — which took a rating-aware difficulty ladder, four independent
quality gates, and a great deal of care about what an evaluation bar is allowed to
claim.
