import { NextResponse } from "next/server";
import { normaliseGame } from "@/lib/chesscom";

/**
 * One month of a member's games, normalised.
 *
 * Deliberately one month per request: the client walks the archive list
 * newest-first and can show honest progress ("3 of 14 months") instead of
 * staring at a single request that takes half a minute.
 */
export const revalidate = 0;

const UA =
  "BlindSpotTrainer/1.0 (portfolio prototype; contact: santoshmudragada.uiux@gmail.com)";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const username = params.get("u")?.trim();
  const archive = params.get("archive");

  if (!username || !archive) {
    return NextResponse.json(
      { error: "Missing username or archive." },
      { status: 400 },
    );
  }
  // Only ever fetch Chess.com's own archive URLs.
  if (!/^https:\/\/api\.chess\.com\/pub\/player\/[\w.-]+\/games\/\d{4}\/\d{2}$/.test(archive)) {
    return NextResponse.json({ error: "Bad archive URL." }, { status: 400 });
  }

  try {
    const res = await fetch(archive, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ games: [] });
    }
    const { games } = (await res.json()) as { games: unknown[] };

    const out = games
      .map((g) => normaliseGame(g as never, username))
      .filter(Boolean)
      // Newest first within the month.
      .sort((a, b) => b!.endTime - a!.endTime);

    return NextResponse.json({ games: out });
  } catch {
    return NextResponse.json({ games: [] });
  }
}
