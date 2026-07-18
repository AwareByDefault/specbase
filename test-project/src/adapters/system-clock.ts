import type { Clock } from "../ports/clock.js";

// Adapter: the only place ambient wall-clock time is read.
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
