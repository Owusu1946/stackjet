import { describe, expect, it } from "vitest";
import { firstEnabled, isUnresolved, resolveChoice } from "./resolve.js";

describe("resolveChoice", () => {
  it("returns the first source that supplied a value without asking", async () => {
    let asked = false;
    const value = await resolveChoice(["flag", "config"], async () => {
      asked = true;
      return "prompt";
    });
    expect(value).toBe("flag");
    expect(asked).toBe(false);
  });

  it("skips a source that is undefined but not one that is falsy", async () => {
    const value = await resolveChoice([undefined, "", "config"], async () => "prompt");
    expect(value).toBe("");
  });

  it("asks only when every source is undefined", async () => {
    const value = await resolveChoice([undefined, undefined], async () => "prompt");
    expect(value).toBe("prompt");
  });

  it("reads sources in order so an explicit flag beats the config file", async () => {
    const sources = ["flag", "config"] as const;
    expect(await resolveChoice(sources, async () => "prompt")).toBe("flag");
    expect(await resolveChoice([undefined, "config"], async () => "prompt")).toBe("config");
  });
});

describe("firstEnabled", () => {
  it("returns the first enabled shorthand", () => {
    expect(
      firstEnabled([
        [undefined, "a"],
        [false, "b"],
        [true, "c"],
      ]),
    ).toBe("c");
  });

  it("returns undefined when nothing is enabled", () => {
    expect(
      firstEnabled([
        [false, "a"],
        [undefined, "b"],
      ]),
    ).toBeUndefined();
  });
});

describe("isUnresolved", () => {
  it("is true only when every source is undefined", () => {
    expect(isUnresolved(undefined, undefined)).toBe(true);
    expect(isUnresolved(undefined, false)).toBe(false);
    expect(isUnresolved(undefined, "")).toBe(false);
  });
});
