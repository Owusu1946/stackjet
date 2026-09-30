import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { executePlan, type GenerationPlan, materializePlan, type Operation } from "../index.js";

// Covers combinations the architecture harness does not enumerate, so the two renderers cannot
// drift without a test failing here.

function render(operations: Operation[]): Map<string, string> {
  const plan: GenerationPlan = { destination: "/unused", operations };
  return new Map(materializePlan(plan).map((file) => [file.path, file.content]));
}

describe("plan operations", () => {
  it("writes files verbatim", () => {
    const files = render([{ type: "write-file", path: "a/b.txt", content: "hello\n", owner: "o" }]);
    expect(files.get("a/b.txt")).toBe("hello\n");
  });

  it("appends env variables and preserves the description comment", () => {
    const files = render([
      { type: "write-file", path: ".env.example", content: "# first\nEXISTING=1\n", owner: "base" },
      {
        type: "add-env",
        workspace: ".",
        variable: { name: "ADDED", classification: "server-secret", description: "why" },
        owner: "adapter",
      },
    ]);
    expect(files.get(".env.example")).toBe("# first\nEXISTING=1\n# why\nADDED=\n");
  });

  it("creates .env.example when the plan has not written one yet", () => {
    const files = render([
      {
        type: "add-env",
        workspace: ".",
        variable: { name: "FIRST", classification: "server-secret" },
        owner: "adapter",
      },
    ]);
    expect(files.get(".env.example")).toBe("FIRST=\n");
  });

  it("scopes env variables to a workspace", () => {
    const files = render([
      {
        type: "add-env",
        workspace: "apps/api",
        variable: { name: "API_ONLY", classification: "server-secret" },
        owner: "adapter",
      },
    ]);
    expect([...files.keys()]).toEqual(["apps/api/.env.example"]);
  });

  it("adds dependencies in alphabetical order regardless of operation order", () => {
    const files = render([
      { type: "write-file", path: "package.json", content: "{}\n", owner: "base" },
      {
        type: "add-dependency",
        workspace: ".",
        name: "zod",
        version: "^4",
        kind: "dependencies",
        owner: "a",
      },
      {
        type: "add-dependency",
        workspace: ".",
        name: "expo",
        version: "~57",
        kind: "dependencies",
        owner: "b",
      },
      {
        type: "add-dependency",
        workspace: ".",
        name: "typescript",
        version: "~6",
        kind: "devDependencies",
        owner: "c",
      },
    ]);
    const pkg = JSON.parse(files.get("package.json") as string) as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    expect(Object.keys(pkg.dependencies)).toEqual(["expo", "zod"]);
    expect(Object.keys(pkg.devDependencies)).toEqual(["typescript"]);
  });

  it("sorts scripts alphabetically", () => {
    const files = render([
      { type: "write-file", path: "package.json", content: "{}\n", owner: "base" },
      { type: "add-script", workspace: ".", name: "start", command: "expo start", owner: "a" },
      {
        type: "add-script",
        workspace: ".",
        name: "android",
        command: "expo start --android",
        owner: "b",
      },
    ]);
    const pkg = JSON.parse(files.get("package.json") as string) as {
      scripts: Record<string, string>;
    };
    expect(Object.keys(pkg.scripts)).toEqual(["android", "start"]);
  });

  it("patches a value and terminates the file with a newline", () => {
    const files = render([
      { type: "write-file", path: "app.json", content: '{"expo":{"name":"old"}}', owner: "base" },
      {
        type: "patch-json",
        path: "app.json",
        edits: [{ path: ["expo", "name"], value: "new" }],
        owner: "a",
      },
    ]);
    const patched = files.get("app.json") as string;
    expect(JSON.parse(patched)).toEqual({ expo: { name: "new" } });
    expect(patched.endsWith("\n")).toBe(true);
  });

  it("removes an existing key when a patch sets it to undefined", () => {
    const source = '{"dependencies":{"expo":"~57","expo-router":"~57","zod":"^4"}}\n';
    const files = render([
      { type: "write-file", path: "package.json", content: source, owner: "base" },
      {
        type: "patch-json",
        path: "package.json",
        edits: [{ path: ["dependencies", "expo-router"], value: undefined }],
        owner: "a",
      },
    ]);
    const pkg = JSON.parse(files.get("package.json") as string) as {
      dependencies: Record<string, string>;
    };
    expect(pkg.dependencies).toEqual({ expo: "~57", zod: "^4" });
  });

  it("keeps JSONC comments and trailing commas", () => {
    const source = '{\n  // keep me\n  "expo": { "name": "old", },\n}\n';
    const files = render([
      { type: "write-file", path: "expojet.jsonc", content: source, owner: "base" },
      {
        type: "patch-jsonc",
        path: "expojet.jsonc",
        edits: [{ path: ["expo", "name"], value: "new" }],
        owner: "a",
      },
    ]);
    const patched = files.get("expojet.jsonc") as string;
    expect(patched).toContain("// keep me");
    expect(patched).toContain('"new"');
  });

  it("refuses to patch a file the plan never wrote", () => {
    expect(() =>
      render([
        {
          type: "patch-json",
          path: "missing.json",
          edits: [{ path: ["a"], value: 1 }],
          owner: "a",
        },
      ]),
    ).toThrow("Plan references missing file");
  });

  it("collects every metro contribution before writing the config once", () => {
    const files = render([
      { type: "write-file", path: "app.json", content: '{"expo":{}}\n', owner: "base" },
      {
        type: "compose-metro",
        contribution: { id: "a", module: "expo/metro-config", exportName: "withA" },
        owner: "a",
      },
      {
        type: "compose-metro",
        contribution: { id: "b", module: "other", exportName: "withB" },
        owner: "b",
      },
    ]);
    const metro = files.get("metro.config.js") as string;
    expect(metro).toContain("withA");
    expect(metro).toContain("withB");
    // Order follows the plan, not the map, so the generated file is deterministic.
    expect(metro.indexOf("withA")).toBeLessThan(metro.indexOf("withB"));
  });

  it("appends composed plugins to whatever app.json already declared", () => {
    const files = render([
      {
        type: "write-file",
        path: "app.json",
        content: '{"expo":{"plugins":["expo-splash-screen"]}}\n',
        owner: "base",
      },
      {
        type: "compose-app-config",
        contribution: { plugin: "@sentry/react-native/expo", options: { org: "acme" } },
        owner: "a",
      },
    ]);
    const appJson = JSON.parse(files.get("app.json") as string) as { expo: { plugins: unknown[] } };
    expect(appJson.expo.plugins).toEqual([
      "expo-splash-screen",
      ["@sentry/react-native/expo", { org: "acme" }],
    ]);
  });

  it("separates contributions by workspace", () => {
    const files = render([
      { type: "write-file", path: "app.json", content: '{"expo":{}}\n', owner: "base" },
      { type: "write-file", path: "apps/mobile/app.json", content: '{"expo":{}}\n', owner: "base" },
      { type: "compose-app-config", contribution: { plugin: "root-plugin" }, owner: "a" },
      {
        type: "compose-app-config",
        contribution: { plugin: "mobile-plugin", workspace: "apps/mobile" },
        owner: "b",
      },
    ]);
    const root = JSON.parse(files.get("app.json") as string) as { expo: { plugins: string[] } };
    const mobile = JSON.parse(files.get("apps/mobile/app.json") as string) as {
      expo: { plugins: string[] };
    };
    expect(root.expo.plugins).toEqual(["root-plugin"]);
    expect(mobile.expo.plugins).toEqual(["mobile-plugin"]);
  });

  it("returns files sorted by path so output does not depend on operation order", () => {
    const operations: Operation[] = [
      { type: "write-file", path: "z.txt", content: "z", owner: "o" },
      { type: "write-file", path: "a.txt", content: "a", owner: "o" },
      { type: "write-file", path: "m/n.txt", content: "n", owner: "o" },
    ];
    expect(materializePlan({ destination: "/unused", operations }).map((f) => f.path)).toEqual([
      "a.txt",
      "m/n.txt",
      "z.txt",
    ]);
  });

  it("rejects copy-tree, which has no in-memory equivalent", () => {
    expect(() =>
      render([{ type: "copy-tree", from: "/somewhere", to: "target", owner: "o" }]),
    ).toThrow("do not support copy-tree");
  });
});

// Reproduced in review: a plan read a file, then something overwrote it, and the
// cache handed back the superseded contents.
describe("plan reads after an overwrite", () => {
  const execute = (operations: Operation[], payload?: Record<string, string>) => {
    const base = mkdtempSync(join(tmpdir(), "expojet-applier-"));
    const destination = join(base, "out");
    const from = join(base, "payload");
    if (payload) {
      for (const [name, content] of Object.entries(payload)) {
        mkdirSync(dirname(join(from, name)), { recursive: true });
        writeFileSync(join(from, name), content);
      }
    }
    // `copy-tree` sources are real paths, not plan paths.
    executePlan({
      destination,
      operations: operations.map((operation) =>
        operation.type === "copy-tree" ? { ...operation, from } : operation,
      ),
    });
    return (path: string) => readFileSync(join(destination, path), "utf8");
  };

  it("treats ./package.json and package.json as the same file", () => {
    const read = execute([
      { type: "write-file", path: "./package.json", content: '{"name":"demo"}\n', owner: "base" },
      {
        type: "add-dependency",
        workspace: ".",
        kind: "dependencies",
        name: "kept",
        version: "1.0.0",
        owner: "adapter",
      },
      {
        type: "patch-json",
        path: "./package.json",
        edits: [{ path: ["version"], value: "2.0.0" }],
        owner: "adapter",
      },
    ]);
    expect(JSON.parse(read("package.json"))).toEqual({
      name: "demo",
      version: "2.0.0",
      dependencies: { kept: "1.0.0" },
    });
  });

  it("re-reads a file that a copy-tree into the root replaced", () => {
    const read = execute(
      [
        { type: "write-file", path: "package.json", content: '{"name":"old"}\n', owner: "base" },
        { type: "copy-tree", from: "payload", to: ".", owner: "base" },
        {
          type: "patch-json",
          path: "package.json",
          edits: [{ path: ["version"], value: "2.0.0" }],
          owner: "adapter",
        },
      ],
      { "package.json": '{"name":"demo","copied":true}\n' },
    );
    expect(JSON.parse(read("package.json"))).toEqual({
      name: "demo",
      copied: true,
      version: "2.0.0",
    });
  });

  it("leaves files outside a nested copy destination cached", () => {
    const read = execute(
      [
        { type: "write-file", path: "package.json", content: '{"kept":true}\n', owner: "base" },
        {
          type: "write-file",
          path: "apps/mobile/package.json",
          content: '{"old":true}\n',
          owner: "base",
        },
        { type: "copy-tree", from: "payload", to: "apps/mobile", owner: "base" },
        {
          type: "add-dependency",
          workspace: "apps/mobile",
          kind: "dependencies",
          name: "added",
          version: "1.0.0",
          owner: "adapter",
        },
      ],
      { "package.json": '{"copied":true}\n' },
    );
    expect(JSON.parse(read("package.json"))).toEqual({ kept: true });
    expect(JSON.parse(read("apps/mobile/package.json"))).toEqual({
      copied: true,
      dependencies: { added: "1.0.0" },
    });
  });
});
