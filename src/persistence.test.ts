import { it, expect } from "vitest";
import * as p from "./persistence";
import { initial } from "./store";
it("autosaves one validated layout and reports read, corrupt-data and quota failures", () => {
  expect(p.loadSaved).toBeTypeOf("function");
  const values = new Map<string, string>();
  const storage = {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => {
      values.set(k, v);
    },
  };
  expect(p.loadSaved(storage).layout).toBeNull();
  expect(p.saveLayout(storage, initial)).toBe("");
  expect(p.loadSaved(storage).layout).toEqual(initial);
  expect(values.size).toBe(1);
  storage.setItem(p.STORAGE_KEY, "oops");
  expect(p.loadSaved(storage).error).toBeTruthy();
  const blocked = {
    getItem: () => {
      throw Error("denied");
    },
    setItem: () => {
      throw Error("quota");
    },
  };
  expect(p.loadSaved(blocked).error).toBeTruthy();
  expect(p.saveLayout(blocked, initial)).toBeTruthy();
});
