import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shared/card";
import { Avatar } from "@/components/shared/avatar";
import { Button } from "@/components/shared/button";
import { friends } from "@/data/home";
import { ICON } from "@/lib/assets";

export function FriendsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Friends</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="grid grid-cols-4 gap-3">
          {friends.map((friend) => (
            <li
              key={friend.username}
              className="flex flex-col items-center gap-1"
            >
              <div className="relative">
                <Avatar size={52} rounded="sm" alt={friend.username} />
                {friend.online && (
                  <span
                    className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-brand ring-2 ring-surface"
                    aria-hidden="true"
                  />
                )}
              </div>
              <span className="max-w-full truncate text-2xs font-semibold text-ink-muted">
                {friend.username}
              </span>
            </li>
          ))}
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
