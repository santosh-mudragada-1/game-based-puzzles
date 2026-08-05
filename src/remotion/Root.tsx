import { Composition } from "remotion";
import {
  UpgradeBadge,
  UPGRADE_DURATION,
  UPGRADE_FPS,
} from "./upgrade-badge";

/**
 * Registers the app's compositions so they can be previewed in Remotion Studio
 * (`npx remotion studio`) and rendered to stills or video — the same source the
 * in-app `<Player>` uses for the upgrade celebration.
 */
export const RemotionRoot = () => {
  return (
    <Composition
      id="UpgradeBadge"
      component={UpgradeBadge}
      durationInFrames={UPGRADE_DURATION}
      fps={UPGRADE_FPS}
      width={720}
      height={480}
    />
  );
};
