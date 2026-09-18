import { describe, expect, it } from "vitest";
import { isBannerSupported, renderHeroBanner, TITLE_TEXT } from "./banner.js";

describe("banner", () => {
  it("exports pixel-perfect 6-line TITLE_TEXT with 82 characters per line", () => {
    const lines = TITLE_TEXT.split("\n");
    expect(lines).toHaveLength(6);
    for (const line of lines) {
      expect(line.length).toBe(82);
    }
  });

  it("renders plain 'ExpoJet' when terminal is not a TTY or too narrow", () => {
    const output: string[] = [];
    renderHeroBanner((text) => output.push(text));
    const combined = output.join("\n");
    // In vitest non-TTY environment, it should fall back to plain "ExpoJet"
    expect(combined).toContain("ExpoJet");
    expect(combined).not.toContain("████████████");
  });

  it("detects narrow columns correctly", () => {
    const origTTY = process.stdout.isTTY;
    const origCols = process.stdout.columns;

    try {
      // Non-TTY
      process.stdout.isTTY = false;
      expect(isBannerSupported()).toBe(false);

      // TTY but narrow (< 85)
      process.stdout.isTTY = true;
      process.stdout.columns = 80;
      expect(isBannerSupported()).toBe(false);

      // TTY and wide (>= 85)
      process.stdout.columns = 100;
      expect(isBannerSupported()).toBe(true);

      const output: string[] = [];
      renderHeroBanner((text) => output.push(text));
      expect(output.join("\n")).toContain("████████████");
    } finally {
      process.stdout.isTTY = origTTY;
      process.stdout.columns = origCols;
    }
  });
});
