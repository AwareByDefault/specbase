import { convert, isUnit, UNITS, type Unit } from "../domain/convert.js";
import type { Clock } from "../ports/clock.js";
import { SystemClock } from "./system-clock.js";

export interface CliResult {
  code: number;
  out: string;
}

// CLI adapter: parses argv, calls the pure domain, formats output.
// Usage: temp-convert <value> <from> <to>
export function run(argv: string[], clock: Clock = new SystemClock()): CliResult {
  if (argv.includes("--units")) {
    return { code: 0, out: UNITS.join(", ") };
  }
  const [rawValue, rawFrom, rawTo] = argv;
  if (!rawValue || !rawFrom || !rawTo) {
    return { code: 2, out: "usage: temp-convert <value> <from> <to>" };
  }
  const value = Number(rawValue);
  if (Number.isNaN(value)) {
    return { code: 2, out: `error: '${rawValue}' is not a number` };
  }
  const from = rawFrom.toUpperCase();
  const to = rawTo.toUpperCase();
  if (!isUnit(from) || !isUnit(to)) {
    return { code: 2, out: `error: unit must be one of C, F, K` };
  }
  const result = convert(value, from as Unit, to as Unit);
  const rounded = Math.round(result * 100) / 100;
  return { code: 0, out: `${rounded} ${to} (at ${clock.now().toISOString()})` };
}
