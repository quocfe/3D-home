import { it, expect, vi } from "vitest";
import * as state from "./store";
import { catalog, fits } from "./core";
it("can create unique item IDs on insecure LAN origins without randomUUID", () => {
  const actual = globalThis.crypto;
  vi.stubGlobal("crypto", {
    getRandomValues: actual.getRandomValues.bind(actual),
  });
  try {
    const s = state.createPlanner({
      version: 1,
      room: { length: 6, width: 5, height: 3 },
      items: [],
    });
    s.getState().add("chair", { x: 0, z: 0, angle: 0 });
    s.getState().add("chair", { x: 0, z: 0, angle: 0 });
    expect(new Set(s.getState().layout.items.map((i) => i.id)).size).toBe(2);
  } finally {
    vi.unstubAllGlobals();
  }
});
it("commits operations once, rejects invalid transforms, preserves shrink positions, undo/redo branches", () => {
  expect(state.createPlanner).toBeTypeOf("function");
  const s = state.createPlanner({
    version: 1,
    room: { length: 6, width: 5, height: 2.8 },
    items: [],
  });
  s.getState().add("sofa", { x: 1.8, z: 0, angle: 0 });
  const id = s.getState().layout.items[0].id;
  expect(s.getState().past).toHaveLength(1);
  s.getState().select(id);
  expect(s.getState().past).toHaveLength(1);
  expect(s.getState().transform(id, { x: 3, z: 0, angle: 0 })).toBe(false);
  expect(s.getState().layout.items[0].x).toBe(1.8);
  s.getState().room({ length: 3, width: 3, height: 2.8 });
  expect(s.getState().layout.items[0].x).toBe(1.8);
  expect(
    fits(s.getState().layout.room, catalog.sofa, s.getState().layout.items[0]),
  ).toBe(false);
  expect(s.getState().transform(id, { x: 0, z: 0, angle: 0 })).toBe(true);
  expect(s.getState().past).toHaveLength(3);
  s.getState().undo();
  expect(s.getState().layout.items[0].x).toBe(1.8);
  s.getState().redo();
  expect(s.getState().layout.items[0].x).toBe(0);
  s.getState().undo();
  s.getState().remove(id);
  expect(s.getState().future).toHaveLength(0);
  expect(s.getState().layout.items).toHaveLength(0);
  s.getState().undo();
  expect(s.getState().layout.items).toHaveLength(1);
  const before = s.getState().layout;
  expect(s.getState().importText("bad")).toBe(false);
  expect(s.getState().layout).toBe(before);
  s.getState().importText(JSON.stringify({ ...before, items: [] }));
  expect(s.getState().layout.items).toHaveLength(0);
  s.getState().undo();
  expect(s.getState().layout).toEqual(before);
});
