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
    const [profileRes, archivesRes] = await Promise.all([
      fetch(`https://api.chess.com/pub/player/${user}`, {
        headers,
        cache: "no-store",
      }),
      fetch(`https://api.chess.com/pub/player/${user}/games/archives`, {
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

    return NextResponse.json({
      username: profile.username ?? username,
      name: profile.name ?? null,
      avatar: profile.avatar ?? null,
      country: profile.country?.split("/").pop() ?? null,
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
