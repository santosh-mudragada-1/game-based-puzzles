import { NextResponse } from "next/server";

/**
 * Public profiles for a handful of members at once — name, photo, country.
 *
 * The archive names the opponents but carries nothing else about them, so the
 * home page's list of people you have played needs one lookup each. Batched
 * here so the browser makes a single request, and capped so a crafted query
 * can't turn this into a crawler.
 */
export const revalidate = 0;

const UA =
  "BlindSpotTrainer/1.0 (portfolio prototype; contact: santoshmudragada.uiux@gmail.com)";

/** Chess.com usernames: 3–25 of letters, digits, _ and -. */
const NAME = /^[a-z0-9_-]{3,25}$/i;

const MAX = 12;

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("u") ?? "";
  const names = [
    ...new Set(
      raw
        .split(",")
        .map((n) => n.trim())
        .filter((n) => NAME.test(n)),
    ),
  ].slice(0, MAX);

  if (names.length === 0) return NextResponse.json({ players: [] });

  const headers = { "User-Agent": UA, Accept: "application/json" };

  const players = await Promise.all(
    names.map(async (name) => {
      try {
        const res = await fetch(
          `https://api.chess.com/pub/player/${encodeURIComponent(name.toLowerCase())}`,
          { headers, cache: "no-store" },
        );
        if (!res.ok) return { username: name, avatar: null, country: null };
        const p = await res.json();
        return {
          username: p.username ?? name,
          name: p.name ?? null,
          avatar: p.avatar ?? null,
          country: p.country?.split("/").pop() ?? null,
          title: p.title ?? null,
          /** Seconds since the epoch; "online" is anything in the last quarter hour. */
          lastOnline: p.last_online ?? null,
          url: p.url ?? null,
        };
      } catch {
        return { username: name, avatar: null, country: null };
      }
    }),
  );

  return NextResponse.json({ players });
}
