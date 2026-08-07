import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PlanProvider } from "@/hooks/use-plan";
import { PuzzleProgressProvider } from "@/hooks/use-puzzle-progress";
import { ChessAccountProvider } from "@/hooks/use-chess-account";
import { ReviewsProvider } from "@/hooks/use-reviews";
import { Welcome } from "@/components/onboarding/welcome";

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
        <ChessAccountProvider>
          {/* Reviews the archive in the background; the puzzles come out of it. */}
          <ReviewsProvider>
            <PlanProvider>
              <PuzzleProgressProvider>
                {/*
                  The username, the wait and the explanation. It holds the app
                  back until the games are fetched and reviewed, so no
                  half-loaded dashboard shows through, and sits inside the
                  provider doing the reviewing because it reports its progress.
                */}
                <Welcome>{children}</Welcome>
              </PuzzleProgressProvider>
            </PlanProvider>
          </ReviewsProvider>
        </ChessAccountProvider>
      </body>
    </html>
  );
}
