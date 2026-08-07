/**
 * Store is the port through which the domain persists and reads back habits.
 * Shaped to grow: later operations (mark-done, streak reads) can be added as
 * new methods without reshaping add/list.
 */
export interface Store {
  add(name: string): Promise<void>;
  list(): Promise<string[]>;
}
