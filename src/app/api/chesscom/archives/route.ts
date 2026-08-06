import { NextResponse } from "next/server";

/**
 * The months a member has games in, newest first, plus their profile.
 *
 * Proxied rather than called from the browser: Chess.com wants a real
 * User-Agent, and going through a route handler keeps the client free of
 * cross-origin surprises.
 */
export const revalidate = 0;

const UA =
  "BlindSpotTrainer/1.0 (portfolio prototype; contact: santoshmudragada.uiux@gmail.com)";

export async function GET(request: Request) {
  const username = new URL(request.url).searchParams.get("u")?.trim();
  if (!username) {
    return NextResponse.json({ error: "Missing username." }, { status: 400 });
  }

  const user = encodeURIComponent(username.toLowerCase());
  const headers = { "User-Agent": UA, Accept: "application/json" };

  try {
    const [profileRes, archivesRes, statsRes] = await Promise.all([
      fetch(`https://api.chess.com/pub/player/${user}`, {
        headers,
        cache: "no-store",
      }),
      fetch(`https://api.chess.com/pub/player/${user}/games/archives`, {
        headers,
        cache: "no-store",
      }),
      fetch(`https://api.chess.com/pub/player/${user}/stats`, {
        headers,
        cache: "no-store",
      }),
    ]);

    if (profileRes.status === 404 || archivesRes.status === 404) {
      return NextResponse.json(
        { error: `No Chess.com member called “${username}”.` },
        { status: 404 },
      );
    }
    if (!profileRes.ok || !archivesRes.ok) {
      return NextResponse.json(
        { error: "Chess.com is not responding right now. Try again shortly." },
        { status: 502 },
      );
    }

    const profile = await profileRes.json();
    const { archives } = (await archivesRes.json()) as { archives: string[] };
    const stats = statsRes.ok ? await statsRes.json() : {};

    /** "chess_rapid" → { rating, best, win, loss, draw }. */
    const bucket = (key: string) => {
      const s = stats[key];
      if (!s) return null;
      return {
        rating: s.last?.rating ?? null,
        best: s.best?.rating ?? null,
        win: s.record?.win ?? 0,
        loss: s.record?.loss ?? 0,
        draw: s.record?.draw ?? 0,
      };
    };

    return NextResponse.json({
      username: profile.username ?? username,
      name: profile.name ?? null,
      avatar: profile.avatar ?? null,
      country: profile.country?.split("/").pop() ?? null,
      title: profile.title ?? null,
      followers: profile.followers ?? null,
      joined: profile.joined ?? null,
      lastOnline: profile.last_online ?? null,
      url: profile.url ?? null,
      stats: {
        rapid: bucket("chess_rapid"),
        blitz: bucket("chess_blitz"),
        bullet: bucket("chess_bullet"),
        daily: bucket("chess_daily"),
        puzzles: stats.tactics?.highest?.rating ?? null,
      },
      // Newest month first — that is the order we want to load them in.
      archives: [...archives].reverse(),
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach Chess.com." },
      { status: 502 },
    );
  }
}
