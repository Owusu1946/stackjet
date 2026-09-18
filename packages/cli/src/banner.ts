import { styleText } from "node:util";

/**
 * Raw uncolored ASCII text for fallback or non-TTY environments.
 * Strictly 82 characters wide per line.
 */
export const TITLE_TEXT = `  ████████████    ███████╗ ██╗  ██╗ ██████╗   ██████╗       ██╗ ███████╗ ████████╗
  ██████████◤     ██╔════╝ ╚██╗██╔╝ ██╔══██╗ ██╔═══██╗      ██║ ██╔════╝ ╚══██╔══╝
  █████   ████◣   █████╗    ╚███╔╝  ██████╔╝ ██║   ██║      ██║ █████╗      ██║   
  █████   ████◤   ██╔══╝    ██╔██╗  ██╔═══╝  ██║   ██║ ██   ██║ ██╔══╝      ██║   
  ██████████◣     ███████╗ ██╔╝ ██╗ ██║      ╚██████╔╝ ╚█████╔╝ ███████╗    ██║   
  ████████████    ╚══════╝ ╚═╝  ╚═╝ ╚═╝       ╚═════╝   ╚════╝  ╚══════╝    ╚═╝   `;

/**
 * Checks if the terminal window is wide enough for the 82-character ASCII banner.
 */
export function isBannerSupported(): boolean {
  if (!process.stdout.isTTY) return false;
  const cols = process.stdout.columns;
  return typeof cols === "number" && cols >= 85;
}

/**
 * Renders the hero banner:
 * - If terminal is wide enough (>= 85 cols): Renders the pixel-perfect ASCII logo with Electric Lime accent.
 * - If terminal is too narrow or non-TTY: Falls back to the plain "ExpoJet" text.
 */
export function renderHeroBanner(stream: (output: string) => void = console.log): void {
  const white = (t: string) => styleText(["bold", "white"], t);
  const lime = (t: string) => styleText(["bold", "greenBright"], t);

  if (!isBannerSupported()) {
    stream(`\n${white("ExpoJet")}\n`);
    return;
  }

  const lines = [
    `  ${white("████████████    ███████╗ ██╗  ██╗ ██████╗   ██████╗       ██╗ ███████╗ ████████╗")}`,
    `  ${white("██████████◤     ██╔════╝ ╚██╗██╔╝ ██╔══██╗ ██╔═══██╗      ██║ ██╔════╝ ╚══██╔══╝")}`,
    `  ${white("█████   ")}${lime("████◣")}${white("   █████╗    ╚███╔╝  ██████╔╝ ██║   ██║      ██║ █████╗      ██║   ")}`,
    `  ${white("█████   ")}${lime("████◤")}${white("   ██╔══╝    ██╔██╗  ██╔═══╝  ██║   ██║ ██   ██║ ██╔══╝      ██║   ")}`,
    `  ${white("██████████◣     ███████╗ ██╔╝ ██╗ ██║      ╚██████╔╝ ╚█████╔╝ ███████╗    ██║   ")}`,
    `  ${white("████████████    ╚══════╝ ╚═╝  ╚═╝ ╚═╝       ╚═════╝   ╚════╝  ╚══════╝    ╚═╝   ")}`,
  ];

  stream(`\n${lines.join("\n")}\n`);
}
