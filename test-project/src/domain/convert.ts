// Pure domain: temperature conversion. No I/O, no ambient time/random.
export type Unit = "C" | "F" | "K";

export const UNITS: readonly Unit[] = ["C", "F", "K"];

export function isUnit(value: string): value is Unit {
  return (UNITS as readonly string[]).includes(value);
}

// Convert any supported unit to Kelvin (the canonical base).
function toKelvin(value: number, from: Unit): number {
  switch (from) {
    case "C":
      return value + 273.15;
    case "F":
      return (value - 32) * (5 / 9) + 273.15;
    case "K":
      return value;
  }
}

function fromKelvin(kelvin: number, to: Unit): number {
  switch (to) {
    case "C":
      return kelvin - 273.15;
    case "F":
      return (kelvin - 273.15) * (9 / 5) + 32;
    case "K":
      return kelvin;
  }
}

export function convert(value: number, from: Unit, to: Unit): number {
  return fromKelvin(toKelvin(value, from), to);
}
