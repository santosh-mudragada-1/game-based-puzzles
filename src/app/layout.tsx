import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PlanProvider } from "@/hooks/use-plan";
import { PuzzleProgressProvider } from "@/hooks/use-puzzle-progress";
import { PlanSwitcher } from "@/components/shared/plan-switcher";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chess.com — Home",
  description:
    "Turn the critical moments from your own games into personalized puzzles. Game Based Puzzles by Chess.com.",
  icons: {
    icon: "/logos/chesscom_logo_pawn.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#302e2b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="min-h-screen bg-bg">
        <PlanProvider>
          <PuzzleProgressProvider>
            {children}
            <PlanSwitcher />
          </PuzzleProgressProvider>
        </PlanProvider>
      </body>
    </html>
  );
}
