/**
 * Copies the Stockfish WASM build out of node_modules into /public/engine so the
 * browser can boot it as a Web Worker.
 *
 * We ship the **lite, single-threaded** build on purpose:
 *   - lite   -> 7 MB instead of 113 MB for the full NNUE net
 *   - single -> no SharedArrayBuffer, so no COOP/COEP headers are needed
 *               (those would otherwise break same-origin embeds and Vercel previews)
 *
 * Runs from `predev` / `prebuild`, so /public/engine is generated rather than
 * committed (it's gitignored).
 */
import { copyFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules", "stockfish", "bin");
const dest = join(root, "public", "engine");

/** [source basename, destination basename] */
const FILES = [
  ["stockfish-18-lite-single.js", "stockfish.js"],
  ["stockfish-18-lite-single.wasm", "stockfish.wasm"],
];

if (!existsSync(src)) {
  console.error(
    "[copy-engine] stockfish not installed — run `npm install` first.",
  );
  process.exit(1);
}

mkdirSync(dest, { recursive: true });

for (const [from, to] of FILES) {
  const a = join(src, from);
  const b = join(dest, to);
  if (!existsSync(a)) {
    console.error(`[copy-engine] missing ${from} in ${src}`);
    process.exit(1);
  }
  // Skip when the copy is already current (keeps dev restarts fast).
  if (existsSync(b) && statSync(b).size === statSync(a).size) continue;
  copyFileSync(a, b);
  console.log(
    `[copy-engine] ${to} (${(statSync(b).size / 1024 / 1024).toFixed(1)} MB)`,
  );
}
