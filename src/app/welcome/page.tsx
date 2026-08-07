import type { Metadata } from "next";

import { WelcomeFlow } from "@/components/onboarding/welcome";

export const metadata: Metadata = {
  title: "Chess.com — Connect your account",
};

/** Setup: the username, the wait, and the three screens explaining the feature. */
export default function WelcomePage() {
  return <WelcomeFlow />;
}
