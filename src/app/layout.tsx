import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PlanProvider } from "@/hooks/use-plan";
import { VersionProvider } from "@/hooks/use-version";
import { PuzzleProgressProvider } from "@/hooks/use-puzzle-progress";
import { ChessAccountProvider } from "@/hooks/use-chess-account";
import { ReviewsProvider } from "@/hooks/use-reviews";
import { AppGate } from "@/components/onboarding/app-gate";

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
              {/* Which shape of the feature is being tried — v1 or v2. */}
              <VersionProvider>
              <PuzzleProgressProvider>
                {/*
                  Nothing of the app renders until there is a real account
                  behind it — anyone else is sent to /welcome for the username,
                  the wait and the explanation. It sits inside the provider
                  doing the reviewing because it waits on its progress.
                */}
                <AppGate>{children}</AppGate>
              </PuzzleProgressProvider>
              </VersionProvider>
            </PlanProvider>
          </ReviewsProvider>
        </ChessAccountProvider>
      </body>
    </html>
  );
}
