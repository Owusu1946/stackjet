import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Expojet",
    short_name: "Expojet",
    description: "Build the Expo app you meant to build.",
    start_url: "/",
    display: "standalone",
    background_color: "#111318",
    theme_color: "#315EFB",
    icons: [{ src: "/brand/site-icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
