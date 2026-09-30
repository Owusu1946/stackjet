import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  detectPlanConflicts,
  executePlan,
  type GenerationPlan,
  PlanConflictError,
  resolvePlanPath,
} from "./index.js";

function temporaryDestination(name: string) {
  return join(mkdtempSync(join(tmpdir(), "expojet-plan-")), name);
}

describe("plan conflicts", () => {
  it("rejects incompatible ownership before rendering", () => {
    const operations = [
      { type: "write-file" as const, path: "same.txt", content: "one", owner: "base" },
      { type: "write-file" as const, path: "same.txt", content: "two", owner: "adapter" },
    ];
    expect(detectPlanConflicts(operations)).toHaveLength(1);
    expect(() => executePlan({ destination: temporaryDestination("app"), operations })).toThrow(
      PlanConflictError,
    );
  });

  it("rejects paths outside staging", () => {
    const root = mkdtempSync(join(tmpdir(), "expojet-root-"));
    expect(() => resolvePlanPath(root, "../escape.txt")).toThrow("escapes");
    expect(() => resolvePlanPath(root, join(root, "absolute.txt"))).toThrow("Unsafe");
  });

  // Reproduced in review: replacing `expo` wholesale and then setting `expo.name`
  // are order-dependent, because each edit applies against the current text.
  it("rejects a parent pointer claimed with one value and a child with another", () => {
    const operations = [
      {
        type: "patch-json" as const,
        path: "app.json",
        edits: [{ path: ["expo"], value: { name: "A" } }],
        owner: "adapter-a",
      },
      {
        type: "patch-json" as const,
        path: "app.json",
        edits: [{ path: ["expo", "name"], value: "B" }],
        owner: "adapter-b",
      },
    ];
    const conflicts = detectPlanConflicts(operations);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.message).toContain("overlaps");
    expect(conflicts[0]?.owners).toEqual(["adapter-a", "adapter-b"]);
  });

  it("rejects the same overlap in the other order", () => {
    const operations = [
      {
        type: "patch-json" as const,
        path: "app.json",
        edits: [{ path: ["expo", "name"], value: "B" }],
        owner: "adapter-b",
      },
      {
        type: "patch-json" as const,
        path: "app.json",
        edits: [{ path: ["expo"], value: { name: "A" } }],
        owner: "adapter-a",
      },
    ];
    expect(detectPlanConflicts(operations)).toHaveLength(1);
  });

  it("allows sibling pointers, which do not interfere", () => {
    const operations = [
      {
        type: "patch-json" as const,
        path: "app.json",
        edits: [{ path: ["expo", "name"], value: "A" }],
        owner: "adapter-a",
      },
      {
        type: "patch-json" as const,
        path: "app.json",
        edits: [{ path: ["expo", "slug"], value: "B" }],
        owner: "adapter-b",
      },
    ];
    expect(detectPlanConflicts(operations)).toHaveLength(0);
  });

  it("keeps ['expo','name'] distinct from ['exponame']", () => {
    const operations = [
      {
        type: "patch-json" as const,
        path: "app.json",
        edits: [{ path: ["expo", "name"], value: "A" }],
        owner: "adapter-a",
      },
      {
        type: "patch-json" as const,
        path: "app.json",
        edits: [{ path: ["exponame"], value: "B" }],
        owner: "adapter-b",
      },
    ];
    expect(detectPlanConflicts(operations)).toHaveLength(0);
  });

  it("rejects a wholesale section replacement that overlaps an added dependency", () => {
    const operations = [
      {
        type: "add-dependency" as const,
        workspace: ".",
        kind: "dependencies" as const,
        name: "kept",
        version: "1.0.0",
        owner: "adapter-a",
      },
      {
        type: "patch-json" as const,
        path: "package.json",
        edits: [{ path: ["dependencies"], value: { other: "2.0.0" } }],
        owner: "adapter-b",
      },
    ];
    const conflicts = detectPlanConflicts(operations);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.message).toContain("overlaps");
  });

  it("rejects a wholesale section replacement that overlaps an added script", () => {
    const operations = [
      {
        type: "add-script" as const,
        workspace: ".",
        name: "dev",
        command: "expo start",
        owner: "adapter-a",
      },
      {
        type: "patch-json" as const,
        path: "package.json",
        edits: [{ path: ["scripts"], value: { build: "tsc" } }],
        owner: "adapter-b",
      },
    ];
    expect(detectPlanConflicts(operations)).toHaveLength(1);
  });

  it("still allows one owner to add several dependencies", () => {
    const operations = [
      {
        type: "add-dependency" as const,
        workspace: ".",
        kind: "dependencies" as const,
        name: "one",
        version: "1.0.0",
        owner: "adapter-a",
      },
      {
        type: "add-dependency" as const,
        workspace: ".",
        kind: "dependencies" as const,
        name: "two",
        version: "2.0.0",
        owner: "adapter-b",
      },
    ];
    expect(detectPlanConflicts(operations)).toHaveLength(0);
  });
});

describe("atomic plan execution", () => {
  const operations: GenerationPlan["operations"] = [
    {
      type: "write-file",
      path: "package.json",
      content: '{\n  "name": "fixture"\n}\n',
      owner: "sdk-57",
    },
    {
      type: "write-file",
      path: "app.json",
      content: '{\n  "expo": { "name": "Fixture" }\n}\n',
      owner: "sdk-57",
    },
    {
      type: "write-file",
      path: "config.jsonc",
      content: '{\n  // retained\n  "enabled": false\n}\n',
      owner: "sdk-57",
    },
    {
      type: "patch-jsonc",
      path: "config.jsonc",
      edits: [{ path: ["enabled"], value: true }],
      owner: "sdk-57",
    },
    {
      type: "add-dependency",
      workspace: ".",
      name: "expo",
      version: "~57.0.23",
      kind: "dependencies",
      owner: "sdk-57",
    },
    {
      type: "add-script",
      workspace: ".",
      name: "start",
      command: "expo start",
      owner: "sdk-57",
    },
    {
      type: "compose-app-config",
      contribution: { plugin: "expo-router" },
      owner: "sdk-57",
    },
  ];

  it("renders and atomically commits a complete tree", () => {
    const destination = temporaryDestination("app");
    const result = executePlan({ destination, operations });
    expect(result.committed).toBe(true);
    expect(existsSync(join(destination, "package.json"))).toBe(true);
    expect(readFileSync(join(destination, "config.jsonc"), "utf8")).toContain("// retained");
    expect(JSON.parse(readFileSync(join(destination, "package.json"), "utf8"))).toMatchObject({
      dependencies: { expo: "~57.0.23" },
      scripts: { start: "expo start" },
    });
  });

  it("cleans staging and leaves no target during a dry run", () => {
    const destination = temporaryDestination("preview");
    const result = executePlan({ destination, operations }, { dryRun: true });
    expect(result.committed).toBe(false);
    expect(result.files).toContain("package.json");
    expect(existsSync(destination)).toBe(false);
  });

  it("leaves no partial target when rendering fails", () => {
    const destination = temporaryDestination("failed");
    const plan: GenerationPlan = {
      destination,
      operations: [
        { type: "write-file", path: "first.txt", content: "created", owner: "base" },
        { type: "patch-json", path: "missing.json", edits: [], owner: "base" },
      ],
    };
    expect(() => executePlan(plan)).toThrow();
    expect(existsSync(destination)).toBe(false);
  });

  it("does not replace a destination that becomes non-empty", () => {
    const destination = temporaryDestination("race");
    writeFileSync(destination, "occupied");
    expect(() => executePlan({ destination, operations })).toThrow();
    expect(readFileSync(destination, "utf8")).toBe("occupied");
  });
});
