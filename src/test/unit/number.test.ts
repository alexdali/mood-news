import { describe, expect, it } from "vitest";
import { parseBoundedInteger } from "@/core/number";

describe("parseBoundedInteger", () => {
  it("applies fallback, truncation and bounds", () => {
    const options = { fallback: 24, min: 1, max: 100 };
    expect(parseBoundedInteger(null, options)).toBe(24);
    expect(parseBoundedInteger("oops", options)).toBe(24);
    expect(parseBoundedInteger("10.9", options)).toBe(10);
    expect(parseBoundedInteger("1000", options)).toBe(100);
    expect(parseBoundedInteger("-2", options)).toBe(1);
  });
});
