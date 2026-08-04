"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  Search,
  Users2,
  Mail,
  Bell,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Avatar } from "@/components/shared/avatar";
import { NAV_ICON, GAME_ICON, ICON } from "@/lib/assets";
import { currentUser } from "@/data";
import { cn } from "@/lib/utils";

type SubItem = {
  label: string;
  img?: string;
  icon?: LucideIcon;
  href?: string;
};

type NavItem = {
  label: string;
  img?: string;
  icon?: LucideIcon;
  active?: boolean;
  accent?: "blue" | "brand";
  href?: string;
  /** Flyout shown on hover (desktop), e.g. the Puzzles modes. */
  submenu?: SubItem[];
};

const PRIMARY: NavItem[] = [
  { label: "Play", img: NAV_ICON.play },
  {
    label: "Puzzles",
    img: NAV_ICON.puzzles,
    href: "/puzzles",
    submenu: [
      { label: "Puzzles", img: NAV_ICON.puzzles, href: "/puzzles" },
      { label: "Daily Puzzle", img: GAME_ICON.dailyPuzzle },
      {
        label: "Game Based Puzzles",
        img: GAME_ICON.gameBasedPuzzles,
        href: "/puzzles/game-based",
      },
      { label: "Puzzle Rush", img: GAME_ICON.puzzleRush },
      { label: "Puzzle Battle", img: GAME_ICON.puzzleBattle },
      { label: "Custom Puzzles", img: GAME_ICON.customPuzzles },
    ],
  },
  { label: "Learn", img: NAV_ICON.learn },
  { label: "Train", img: NAV_ICON.train },
  { label: "Friends", img: NAV_ICON.community },
];

function NavButton({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const cls = cn(
    "group relative flex w-full items-center gap-3 rounded-[6px] px-2.5 py-2 text-left transition-colors",
    item.active
      ? "bg-white/[0.05] text-ink"
      : "text-ink-muted hover:bg-white/[0.035] hover:text-ink",
  );
  const inner = (
    <>
      {item.active && (
        <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r bg-brand" />
      )}
      <span className="grid size-7 place-items-center">
        {item.img ? (
          <Image src={item.img} alt="" width={26} height={26} />
        ) : Icon ? (
          <Icon
            className={cn(
              "size-[22px]",
              item.accent === "blue"
                ? "text-info"
                : item.accent === "brand"
                  ? "text-brand"
                  : "text-ink-soft",
            )}
            strokeWidth={2.25}
          />
        ) : null}
      </span>
      <span
        className={cn(
          "text-[15px] font-semibold",
          item.accent === "blue" && "text-info",
        )}
      >
        {item.label}
      </span>
    </>
  );

  if (item.href) {
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={item.active ? "page" : undefined}
        className={cls}
      >
        {inner}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onNavigate}
      aria-current={item.active ? "page" : undefined}
      aria-haspopup={item.submenu ? "menu" : undefined}
      className={cls}
    >
      {inner}
    </button>
  );
}

function SubMenuItem({
  sub,
  onNavigate,
}: {
  sub: SubItem;
  onNavigate?: () => void;
}) {
  const Icon = sub.icon;
  const cls =
    "flex w-full items-center gap-3 rounded-[6px] px-2.5 py-2 text-left text-[15px] font-semibold text-ink transition-colors hover:bg-white/[0.06]";
  const inner = (
    <>
      <span className="grid size-6 shrink-0 place-items-center">
        {sub.img ? (
          <Image src={sub.img} alt="" width={24} height={24} />
        ) : Icon ? (
          <Icon className="size-[22px] text-ink-soft" strokeWidth={2} />
        ) : null}
      </span>
      {sub.label}
    </>
  );
  return sub.href ? (
    <Link href={sub.href} onClick={onNavigate} className={cls}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onNavigate} className={cls}>
      {inner}
    </button>
  );
}

function NavItemRow({
  item,
  onNavigate,
  drawer,
}: {
  item: NavItem;
  onNavigate?: () => void;
  /** In the mobile drawer there is no hover — show the submenu inline instead. */
  drawer?: boolean;
}) {
  if (!item.submenu) {
    return <NavButton item={item} onNavigate={onNavigate} />;
  }
  if (drawer) {
    return (
      <div>
        <NavButton item={item} onNavigate={onNavigate} />
        <div className="ml-9 mt-0.5 flex flex-col gap-0.5 border-l border-line/60 pl-1.5">
          {item.submenu
            .filter((sub) => sub.label !== item.label)
            .map((sub) => (
              <SubMenuItem key={sub.label} sub={sub} onNavigate={onNavigate} />
            ))}
        </div>
      </div>
    );
  }
  return (
    <div className="group/sub relative">
      <NavButton item={item} onNavigate={onNavigate} />
      {/* Hover flyout (desktop) — the pl-2 is an invisible bridge to the panel */}
      <div className="absolute left-full top-0 z-50 hidden pl-2 lg:group-hover/sub:block">
        <div
          role="menu"
          aria-label={`${item.label} menu`}
          className="w-60 rounded-[8px] border border-line/60 bg-surface-sunken p-1.5 shadow-pop"
        >
          {item.submenu.map((sub) => (
            <SubMenuItem key={sub.label} sub={sub} onNavigate={onNavigate} />
          ))}
        </div>
      </div>
    </div>
  );
}

function FooterIcon({
  icon: Icon,
  label,
  badge,
}: {
  icon: LucideIcon;
  label: string;
  badge?: number;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="relative grid size-9 place-items-center rounded-[6px] text-ink-soft transition-colors hover:bg-white/[0.05] hover:text-ink"
    >
      <Icon className="size-5" strokeWidth={2} />
      {badge ? (
        <span className="absolute right-1 top-1 grid min-w-[15px] place-items-center rounded-full bg-loss px-1 text-[9px] font-bold leading-[14px] text-white">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

export function Sidebar({
  className,
  onNavigate,
  activeLabel,
  drawer,
}: {
  className?: string;
  onNavigate?: () => void;
  /** Label of the nav item to highlight; the home page highlights none. */
  activeLabel?: string;
  /** Rendered inside the mobile drawer — expands submenus inline (no hover). */
  drawer?: boolean;
}) {
  return (
    <nav
      aria-label="Primary"
      className={cn(
        "flex h-full flex-col bg-surface-rail scrollbar-thin",
        className,
      )}
    >
      {/* Logo */}
      <div className="px-4 pb-2 pt-4">
        <Link
          href="/"
          onClick={onNavigate}
          aria-label="Chess.com home"
          className="inline-block rounded-[4px] focus-visible:outline-none"
        >
          <Logo />
        </Link>
      </div>

      {/* Primary nav */}
      <div className="flex flex-col gap-0.5 px-2 pt-2">
        {PRIMARY.map((item) => (
          <NavItemRow
            key={item.label}
            item={{ ...item, active: item.label === activeLabel }}
            onNavigate={onNavigate}
            drawer={drawer}
          />
        ))}
        <NavButton
          item={{ label: "More", icon: ChevronDown }}
          onNavigate={onNavigate}
        />
        <div className="my-1.5 h-px bg-line/60" />
        <NavButton
          item={{ label: "Upgrade", img: ICON.upgrade, accent: "blue" }}
          onNavigate={onNavigate}
        />
      </div>

      <div className="flex-1" />

      {/* Bottom cluster */}
      <div className="px-2 pb-3">
        <button
          type="button"
          className="mb-2 flex w-full items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-ink-soft transition-colors hover:bg-white/[0.04] hover:text-ink"
        >
          <Search className="size-[18px]" strokeWidth={2.25} />
          <span className="text-sm font-medium">Search</span>
        </button>

        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-[6px] px-2 py-1.5 transition-colors hover:bg-white/[0.04]"
        >
          <Avatar size={30} alt={currentUser.displayName} />
          <span className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-ink">
            {currentUser.displayName}
          </span>
          <ChevronDown className="size-4 text-ink-soft" />
        </button>

        <div className="mt-1 flex items-center justify-between px-1">
          <FooterIcon icon={Users2} label="Friends" />
          <FooterIcon icon={Mail} label="Messages" />
          <FooterIcon icon={Bell} label="Notifications" badge={1} />
          <FooterIcon icon={Settings} label="Settings" />
        </div>
      </div>
    </nav>
  );
}
