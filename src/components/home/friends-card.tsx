"use client";

import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shared/card";
import { Avatar } from "@/components/shared/avatar";
import { Button } from "@/components/shared/button";
import { isOnline, useOpponents } from "@/hooks/use-opponents";
import { friends } from "@/data/home";
import { ICON } from "@/lib/assets";

/**
 * The people this member plays.
 *
 * Chess.com's public API publishes no friends list, so the card shows the real
 * thing it does publish — the opponents from the loaded archive, with their own
 * photos and country flags. Falls back to the sample names before an account is
 * connected, so the rail is never a row of holes.
 */
export function FriendsCard() {
  const { opponents } = useOpponents(8);
  const live = opponents.length > 0;

  const people = live
    ? opponents.map((o) => ({
        username: o.username,
        avatar: o.avatar,
        online: isOnline(o.lastOnline),
        url: o.url,
        sub: `${o.games} ${o.games === 1 ? "game" : "games"}`,
      }))
    : friends.slice(0, 8).map((f) => ({
        username: f.username,
        avatar: null,
        online: f.online ?? false,
        url: null,
        sub: undefined,
      }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{live ? "Recent Opponents" : "Friends"}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="grid grid-cols-4 gap-3">
          {people.map((person) => {
            const inner = (
              <>
                <div className="relative">
                  <Avatar
                    size={52}
                    rounded="sm"
                    src={person.avatar}
                    alt={person.username}
                  />
                  {person.online && (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-brand ring-2 ring-surface"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <span className="w-full truncate text-center text-2xs font-semibold text-ink-muted">
                  {person.username}
                </span>
              </>
            );
            return (
              <li
                key={person.username}
                // Grid items size to their content by default, so a long
                // username pushes the column wide and rides over its neighbour
                // instead of ellipsing. min-w-0 lets the cell shrink and the
                // truncation actually happen.
                className="flex min-w-0 flex-col items-center gap-1"
                title={
                  person.sub ? `${person.username} — ${person.sub}` : person.username
                }
              >
                {person.url ? (
                  <a
                    href={person.url}
                    target="_blank"
                    rel="noreferrer"
                    // w-full, not just min-w-0: a centred column flex item sizes
                    // to its content, so without it the link itself grows past
                    // the cell and takes the name with it.
                    className="flex w-full min-w-0 flex-col items-center gap-1 transition-opacity hover:opacity-80"
                  >
                    {inner}
                  </a>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
        <div className="mt-4">
          <Button variant="secondary" className="w-full">
            <Image src={ICON.handshake} width={20} height={20} alt="" />
            Play a Friend
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
