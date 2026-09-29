import { authAdapters, backendAdapters, navigationAdapters, ormAdapters } from "@expojet/schemas";
import { describe, expect, it } from "vitest";
import {
  analyticsAdapter,
  authAdapter,
  backendAdapter,
  databaseAdapter,
  getHapticsAdapter,
  getLiquidGlassAdapter,
  iconAdapter,
  monitoringAdapter,
  monorepoPlatformAdapter,
  navigationAdapter,
  ormAdapter,
  stateAdapter,
  styleAdapter,
  themeAdapter,
} from "./index.js";

describe("adapters barrel", () => {
  it("resolves an adapter for every id the schema accepts", () => {
    for (const id of authAdapters) expect(authAdapter(id)).toBeDefined();
    for (const id of backendAdapters) expect(backendAdapter(id)).toBeDefined();
    for (const id of navigationAdapters) expect(navigationAdapter(id)).toBeDefined();
    for (const id of ormAdapters) expect(ormAdapter(id)).toBeDefined();
  });

  it("returns the same object for repeated lookups so plan assembly stays pure", () => {
    for (const id of authAdapters) expect(authAdapter(id)).toBe(authAdapter(id));
    for (const id of backendAdapters) expect(backendAdapter(id)).toBe(backendAdapter(id));
    for (const id of navigationAdapters) {
      expect(navigationAdapter(id)).toBe(navigationAdapter(id));
    }
    for (const id of ormAdapters) expect(ormAdapter(id)).toBe(ormAdapter(id));
  });

  it("exports every single-adapter entry the CLI plan assembly imports", () => {
    for (const entry of [
      analyticsAdapter,
      databaseAdapter,
      getHapticsAdapter,
      getLiquidGlassAdapter,
      iconAdapter,
      monorepoPlatformAdapter,
      monitoringAdapter,
      stateAdapter,
      styleAdapter,
      themeAdapter,
    ]) {
      expect(entry).toBeDefined();
    }
    expect(typeof getHapticsAdapter).toBe("function");
    expect(typeof getLiquidGlassAdapter).toBe("function");
  });
});
