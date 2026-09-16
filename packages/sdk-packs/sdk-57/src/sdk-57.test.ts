import { createHash } from "node:crypto";
import { sdkPackManifestSchema } from "@stackjet/schemas";
import { describe, expect, it } from "vitest";
import { sdk57Files, sdk57FilesSha256, sdk57Manifest } from "./index.js";

function hashFiles(files: Readonly<Record<string, string>>) {
  const hash = createHash("sha256");
  for (const [path, content] of Object.entries(files).sort(([left], [right]) =>
    left.localeCompare(right),
  )) {
    hash.update(path);
    hash.update("\0");
    hash.update(content);
    hash.update("\0");
  }
  return hash.digest("hex");
}

describe("SDK 57 pack", () => {
  it("embeds a checksum-verified immutable template", () => {
    expect(sdk57Manifest.sdk).toBe(57);
    expect(sdkPackManifestSchema.parse(sdk57Manifest)).toEqual(sdk57Manifest);
    expect(Object.isFrozen(sdk57Files)).toBe(true);
    expect(hashFiles(sdk57Files)).toBe(sdk57FilesSha256);
  });

  it("contains the standalone Expo foundation", () => {
    expect(Object.keys(sdk57Files)).toEqual(
      expect.arrayContaining(["package.json", "app.json", "app/_layout.tsx", "app/index.tsx"]),
    );
  });
});
