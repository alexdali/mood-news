import { describe, expect, it } from "vitest";
import { extractJsonObject } from "@/modules/ai/json-repair";

describe("JSON extraction", () => {
  it("accepts plain and fenced objects", () => {
    expect(extractJsonObject('{"ok":true}')).toBe('{"ok":true}');
    expect(extractJsonObject('```json\n{"ok":true}\n```')).toBe('{"ok":true}');
  });

  it("extracts an object surrounded by model chatter", () => {
    expect(extractJsonObject('Here: {"ok":true} done')).toBe('{"ok":true}');
  });

  it("rejects a response without an object", () => {
    expect(() => extractJsonObject("no json")).toThrow(/JSON object/);
  });
});
