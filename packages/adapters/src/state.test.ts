import type { CreateInput } from "@expojet/schemas";
import { describe, expect, it } from "vitest";
import { mobxStateAdapter, noneStateAdapter, stateAdapter, zustandStateAdapter } from "./state.js";

function makeInput(overrides: Partial<CreateInput> = {}): CreateInput {
  return {
    projectName: "my-app",
    destination: "/tmp/my-app",
    structure: "standalone",
    packageManager: "pnpm",
    navigation: "router",
    navigationType: "tabs",
    typescript: true,
    icons: "lucide",
    state: "none",
    liquidGlass: false,
    analytics: "none",
    backend: "none",
    auth: "none",
    style: "uniwind",
    database: "none",
    orm: "none",
    onboarding: true,
    darkMode: true,
    eas: true,
    install: true,
    git: true,
    sdk: 57,
    ...overrides,
  };
}

describe("stateAdapter selector", () => {
  it("resolves the correct adapter for each identifier", () => {
    expect(stateAdapter("zustand")).toBe(zustandStateAdapter);
    expect(stateAdapter("mobx")).toBe(mobxStateAdapter);
    expect(stateAdapter("none")).toBe(noneStateAdapter);
  });
});

describe("zustandStateAdapter", () => {
  it("plans zustand dependency, store, and counter card in standalone mode", () => {
    const operations = zustandStateAdapter.plan(
      makeInput({ state: "zustand", structure: "standalone" }),
      {},
    );
    const deps = operations
      .filter((op) => op.type === "add-dependency")
      .map((op) => (op.type === "add-dependency" ? op.name : null));

    expect(deps).toContain("zustand");

    const storeOp = operations.find(
      (op) => op.type === "write-file" && op.path === "src/store/use-app-store.ts",
    );
    expect(storeOp).toBeDefined();
    if (storeOp && "content" in storeOp) {
      expect(storeOp.content).toContain('from "zustand"');
      expect(storeOp.content).toContain("export const useAppStore = create<AppState>");
      expect(storeOp.content).toContain("count: 0");
      expect(storeOp.content).toContain("increment:");
    }

    const counterOp = operations.find(
      (op) => op.type === "write-file" && op.path === "src/components/counter-card.tsx",
    );
    expect(counterOp).toBeDefined();
    if (counterOp && "content" in counterOp) {
      expect(counterOp.content).toContain("useAppStore");
      expect(counterOp.content).toContain("Zustand Store");
    }
  });

  it("plans zustand under apps/mobile in monorepo mode", () => {
    const operations = zustandStateAdapter.plan(
      makeInput({ state: "zustand", structure: "monorepo" }),
      {},
    );
    const storeOp = operations.find(
      (op) => op.type === "write-file" && op.path === "apps/mobile/src/store/use-app-store.ts",
    );
    expect(storeOp).toBeDefined();

    const deps = operations.filter((op) => op.type === "add-dependency");
    for (const dep of deps) {
      if (dep.type === "add-dependency") {
        expect(dep.workspace).toBe("apps/mobile");
      }
    }
  });
});

describe("mobxStateAdapter", () => {
  it("plans mobx dependencies, observable store, provider, and counter card", () => {
    const operations = mobxStateAdapter.plan(
      makeInput({ state: "mobx", structure: "standalone" }),
      {},
    );
    const deps = operations
      .filter((op) => op.type === "add-dependency")
      .map((op) => (op.type === "add-dependency" ? op.name : null));

    expect(deps).toContain("mobx");
    expect(deps).toContain("mobx-react-lite");

    const storeOp = operations.find(
      (op) => op.type === "write-file" && op.path === "src/store/app-store.ts",
    );
    expect(storeOp).toBeDefined();
    if (storeOp && "content" in storeOp) {
      expect(storeOp.content).toContain('from "mobx"');
      expect(storeOp.content).toContain("makeAutoObservable(this)");
    }

    const providerOp = operations.find(
      (op) => op.type === "write-file" && op.path === "src/store/provider.tsx",
    );
    expect(providerOp).toBeDefined();
    if (providerOp && "content" in providerOp) {
      expect(providerOp.content).toContain("StoreProvider");
      expect(providerOp.content).toContain("useAppStore");
    }

    const counterOp = operations.find(
      (op) => op.type === "write-file" && op.path === "src/components/counter-card.tsx",
    );
    expect(counterOp).toBeDefined();
    if (counterOp && "content" in counterOp) {
      expect(counterOp.content).toContain("mobx-react-lite");
      expect(counterOp.content).toContain("observer");
      expect(counterOp.content).toContain("MobX Store");
    }
  });

  it("plans mobx under apps/mobile in monorepo mode", () => {
    const operations = mobxStateAdapter.plan(
      makeInput({ state: "mobx", structure: "monorepo" }),
      {},
    );
    const storeOp = operations.find(
      (op) => op.type === "write-file" && op.path === "apps/mobile/src/store/app-store.ts",
    );
    expect(storeOp).toBeDefined();
  });
});

describe("noneStateAdapter", () => {
  it("emits zero operations", () => {
    const operations = noneStateAdapter.plan(makeInput({ state: "none" }), {});
    expect(operations).toHaveLength(0);
  });
});
