import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const UPGRADE_FPS = 30;
export const UPGRADE_DURATION = 90; // 3s

/**
 * The "you're premium now" moment: the diamond drops in, settles with a shine
 * sweeping across it, and the copy rises underneath. Driven by `useCurrentFrame`
 * so it plays identically wherever it runs — the same composition could be
 * rendered to video for a marketing clip.
 */
export const UpgradeBadge = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        // Matches the overlay it sits on, so the Player edge is invisible in the
        // app and a standalone still/render still reads correctly.
        backgroundColor: "#25231f",
        // Pinned so a standalone render matches the app instead of falling back
        // to a serif — in-app this is what the page is using anyway.
        fontFamily: "Inter, system-ui, sans-serif",
        gap: 28,
      }}
    >
      {/* Halo pulse behind the diamond */}
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          opacity: interpolate(frame, [6, 22, 62, 84], [0, 0.55, 0.45, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <div
          style={{
            width: 300,
            height: 300,
            borderRadius: 9999,
            background:
              "radial-gradient(circle, rgba(74,144,217,0.55) 0%, rgba(74,144,217,0) 68%)",
            scale: interpolate(frame, [6, 46], [0.4, 1.25], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
              output: "perceptual-scale",
            }),
          }}
        />
      </AbsoluteFill>

      <div
        style={{
          position: "relative",
          width: 168,
          height: 168,
          opacity: interpolate(frame, [0, 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          scale: interpolate(frame, [0, 26], [0.35, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.spring({ damping: 12, mass: 0.6 }),
            output: "perceptual-scale",
          }),
          rotate: interpolate(frame, [0, 34], ["-24deg", "0deg"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: interpolate(frame, [0, 30], ["0px -46px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <Img
          src={staticFile("misc/upgrade.svg")}
          style={{ width: "100%", height: "100%" }}
        />
        {/* Shine sweeping across the facets once it lands */}
        <AbsoluteFill
          style={{
            overflow: "hidden",
            maskImage: `url(${staticFile("misc/upgrade.svg")})`,
            maskSize: "contain",
            maskRepeat: "no-repeat",
            maskPosition: "center",
            WebkitMaskImage: `url(${staticFile("misc/upgrade.svg")})`,
            WebkitMaskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -40,
              bottom: -40,
              width: 70,
              background:
                "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0) 100%)",
              rotate: "18deg",
              translate: interpolate(frame, [26, 58], ["-140px 0px", "180px 0px"], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.4, 0, 0.2, 1),
              }),
            }}
          />
        </AbsoluteFill>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          opacity: interpolate(frame, [22, 38], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: interpolate(frame, [22, 42], ["0px 18px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: 1.6,
            textTransform: "uppercase",
            color: "#5aa0e6",
          }}
        >
          Premium unlocked
        </p>
        <p
          style={{
            margin: 0,
            fontSize: 34,
            fontWeight: 900,
            color: "#ffffff",
            textAlign: "center",
          }}
        >
          All 8 puzzles are yours
        </p>
        <p
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 600,
            color: "rgba(255,255,255,0.7)",
            opacity: interpolate(frame, [1.6 * fps, 2.1 * fps], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          Picking up where you left off…
        </p>
      </div>
    </AbsoluteFill>
  );
};
