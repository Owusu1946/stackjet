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
    // 192px and 512px PNGs so Android can pick a maskable-capable size; the SVG is kept as an
    // additional entry for browsers that accept it.
    icons: [
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/site-icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
