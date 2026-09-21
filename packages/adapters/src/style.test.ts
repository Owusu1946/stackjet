import { describe, expect, it } from "vitest";
import {
  nativewindAdapter,
  styleAdapter,
  stylesheetAdapter,
  unistylesAdapter,
  uniwindAdapter,
} from "./style.js";

describe("style adapters", () => {
  it("keeps StyleSheet output dependency-free", () => {
    const operations = stylesheetAdapter.plan({} as never, {});
    expect(operations.some((operation) => operation.type === "add-dependency")).toBe(false);
  });

  it("composes Uniwind through declarative operations", () => {
    const operations = uniwindAdapter.plan({} as never, {});
    expect(operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "compose-metro" }),
        expect.objectContaining({ type: "add-dependency", name: "uniwind" }),
      ]),
    );
  });

  it("composes NativeWind through declarative operations", () => {
    const operations = nativewindAdapter.plan({ structure: "standalone" } as never, {});
    expect(operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "compose-metro",
          contribution: expect.objectContaining({
            module: "nativewind/metro",
            exportName: "withNativeWind",
          }),
        }),
        expect.objectContaining({ type: "add-dependency", name: "nativewind" }),
        expect.objectContaining({ type: "add-dependency", name: "tailwindcss" }),
        expect.objectContaining({ type: "write-file", path: "tailwind.config.js" }),
        expect.objectContaining({ type: "write-file", path: "src/global.css" }),
        expect.objectContaining({ type: "write-file", path: "src/nativewind-env.d.ts" }),
      ]),
    );
  });

  it("composes Unistyles through declarative operations", () => {
    const operations = unistylesAdapter.plan({ structure: "standalone" } as never, {});
    expect(operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "add-dependency", name: "react-native-unistyles" }),
        expect.objectContaining({ type: "write-file", path: "src/unistyles.ts" }),
        expect.objectContaining({ type: "write-file", path: "src/style-entry.ts" }),
        expect.objectContaining({ type: "write-file", path: "src/components/brand-card.tsx" }),
      ]),
    );
    expect(operations.some((operation) => operation.type === "compose-metro")).toBe(false);
  });

  it("dispatches styleAdapter by id", () => {
    expect(styleAdapter("nativewind")).toBe(nativewindAdapter);
    expect(styleAdapter("unistyles")).toBe(unistylesAdapter);
    expect(styleAdapter("uniwind")).toBe(uniwindAdapter);
    expect(styleAdapter("stylesheet")).toBe(stylesheetAdapter);
  });

  it("ensures all BrandCard components reference EXPOJET and never STACKJET", () => {
    const adapters = [stylesheetAdapter, uniwindAdapter, nativewindAdapter, unistylesAdapter];
    for (const adapter of adapters) {
      const operations = adapter.plan({ structure: "standalone" } as never, {});
      const brandCardOp = operations.find(
        (op) => op.type === "write-file" && op.path === "src/components/brand-card.tsx",
      );
      expect(brandCardOp).toBeDefined();
      if (brandCardOp && "content" in brandCardOp) {
        expect(brandCardOp.content).toContain("EXPOJET");
        expect(brandCardOp.content).not.toContain("STACKJET");
      }
    }
  });
});
