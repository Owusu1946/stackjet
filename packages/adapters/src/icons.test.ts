import type { CreateInput } from "@expojet/schemas";
import { describe, expect, it } from "vitest";
import { expoIconAdapter, hugeiconsIconAdapter, iconAdapter, lucideIconAdapter } from "./icons.js";

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

describe("iconAdapter selector", () => {
  it("resolves the correct adapter for each identifier", () => {
    expect(iconAdapter("lucide")).toBe(lucideIconAdapter);
    expect(iconAdapter("hugeicons")).toBe(hugeiconsIconAdapter);
    expect(iconAdapter("expo")).toBe(expoIconAdapter);
  });
});

describe("lucideIconAdapter", () => {
  it("plans lucide-react-native and react-native-svg in standalone mode", () => {
    const operations = lucideIconAdapter.plan(
      makeInput({ icons: "lucide", structure: "standalone" }),
      {},
    );
    const deps = operations
      .filter((op) => op.type === "add-dependency")
      .map((op) => (op.type === "add-dependency" ? op.name : null));

    expect(deps).toContain("lucide-react-native");
    expect(deps).toContain("react-native-svg");

    const iconOp = operations.find(
      (op) => op.type === "write-file" && op.path === "src/components/ui/icon.tsx",
    );
    expect(iconOp).toBeDefined();
    if (iconOp && "content" in iconOp) {
      expect(iconOp.content).toContain("lucide-react-native");
      expect(iconOp.content).toContain("export function Icon(");
      expect(iconOp.content).toContain("home: Home");
    }
  });

  it("plans lucide under apps/mobile in monorepo mode", () => {
    const operations = lucideIconAdapter.plan(
      makeInput({ icons: "lucide", structure: "monorepo" }),
      {},
    );
    const iconOp = operations.find(
      (op) => op.type === "write-file" && op.path === "apps/mobile/src/components/ui/icon.tsx",
    );
    expect(iconOp).toBeDefined();

    const deps = operations.filter((op) => op.type === "add-dependency");
    for (const dep of deps) {
      if (dep.type === "add-dependency") {
        expect(dep.workspace).toBe("apps/mobile");
      }
    }
  });
});

describe("hugeiconsIconAdapter", () => {
  it("plans @hugeicons dependencies and component in standalone mode", () => {
    const operations = hugeiconsIconAdapter.plan(
      makeInput({ icons: "hugeicons", structure: "standalone" }),
      {},
    );
    const deps = operations
      .filter((op) => op.type === "add-dependency")
      .map((op) => (op.type === "add-dependency" ? op.name : null));

    expect(deps).toContain("@hugeicons/react-native");
    expect(deps).toContain("@hugeicons/core-free-icons");
    expect(deps).toContain("react-native-svg");

    const iconOp = operations.find(
      (op) => op.type === "write-file" && op.path === "src/components/ui/icon.tsx",
    );
    expect(iconOp).toBeDefined();
    if (iconOp && "content" in iconOp) {
      expect(iconOp.content).toContain("@hugeicons/react-native");
      expect(iconOp.content).toContain("export function Icon(");
      expect(iconOp.content).toContain("home: Home01Icon");
    }
  });

  it("plans hugeicons under apps/mobile in monorepo mode", () => {
    const operations = hugeiconsIconAdapter.plan(
      makeInput({ icons: "hugeicons", structure: "monorepo" }),
      {},
    );
    const iconOp = operations.find(
      (op) => op.type === "write-file" && op.path === "apps/mobile/src/components/ui/icon.tsx",
    );
    expect(iconOp).toBeDefined();
  });
});

describe("expoIconAdapter", () => {
  it("plans @expo/vector-icons dependency and component in standalone mode", () => {
    const operations = expoIconAdapter.plan(
      makeInput({ icons: "expo", structure: "standalone" }),
      {},
    );
    const deps = operations
      .filter((op) => op.type === "add-dependency")
      .map((op) => (op.type === "add-dependency" ? op.name : null));

    expect(deps).toContain("@expo/vector-icons");
    expect(deps).not.toContain("react-native-svg");

    const iconOp = operations.find(
      (op) => op.type === "write-file" && op.path === "src/components/ui/icon.tsx",
    );
    expect(iconOp).toBeDefined();
    if (iconOp && "content" in iconOp) {
      expect(iconOp.content).toContain("@expo/vector-icons");
      expect(iconOp.content).toContain("export function Icon(");
      expect(iconOp.content).toContain('home: "home-outline"');
    }
  });

  it("plans expo vector icons under apps/mobile in monorepo mode", () => {
    const operations = expoIconAdapter.plan(
      makeInput({ icons: "expo", structure: "monorepo" }),
      {},
    );
    const iconOp = operations.find(
      (op) => op.type === "write-file" && op.path === "apps/mobile/src/components/ui/icon.tsx",
    );
    expect(iconOp).toBeDefined();
  });
});
