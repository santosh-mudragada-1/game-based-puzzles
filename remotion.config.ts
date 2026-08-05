import { Config } from "@remotion/cli/config";

// Assets referenced with staticFile() live in the Next.js public folder.
Config.setPublicDir("public");
Config.setVideoImageFormat("png");
