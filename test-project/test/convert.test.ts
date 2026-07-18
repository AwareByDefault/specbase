import { expect, test } from "bun:test";
import { convert } from "../src/domain/convert.js";
import { run } from "../src/adapters/cli.js";
import type { Clock } from "../src/ports/clock.js";

const fixedClock: Clock = { now: () => new Date("2020-01-01T00:00:00.000Z") };

test("converts C to F correctly", () => {
  expect(convert(100, "C", "F")).toBeCloseTo(212, 6);
  expect(convert(0, "C", "F")).toBeCloseTo(32, 6);
});

test("converts C to K correctly", () => {
  expect(convert(0, "C", "K")).toBeCloseTo(273.15, 6);
});

test("round-trips through all units", () => {
  expect(convert(convert(37, "C", "F"), "F", "C")).toBeCloseTo(37, 6);
});

test("CLI converts and uses injected clock", () => {
  const r = run(["100", "c", "f"], fixedClock);
  expect(r.code).toBe(0);
  expect(r.out).toBe("212 F (at 2020-01-01T00:00:00.000Z)");
});

test("CLI lists supported units with --units", () => {
  const r = run(["--units"], fixedClock);
  expect(r.code).toBe(0);
  expect(r.out).toBe("C, F, K");
});

test("CLI rejects invalid unit", () => {
  const r = run(["100", "c", "x"], fixedClock);
  expect(r.code).toBe(2);
  expect(r.out).toContain("unit must be one of");
});

test("CLI rejects non-numeric value", () => {
  const r = run(["abc", "c", "f"], fixedClock);
  expect(r.code).toBe(2);
  expect(r.out).toContain("is not a number");
});
