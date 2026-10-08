import { expect, it } from "vitest";
import { initial, layout, validate, canAdd, usable } from "./domain";
import { quote } from "./pricing";
import { createKitchen } from "./store";
import { load, save, STORAGE_KEY } from "./persistence";
it("flags unknown prices rather than claiming a complete zero total", () => {
  const s = initial();
  s.zones[1].modules = [
    { id: "m", productId: "glass", variant: 0, finish: "oak" },
  ];
  const q = quote(s);
  expect(q.complete).toBe(false);
  expect(q.zones[1].lines[0].price).toBeNull();
});
it("sums multiple modules per layer and packs independently in zone order", () => {
  const s = initial();
  s.runs.A = 6000;
  const z = s.zones[0];
  z.width = 1400;
  z.modules = [
    { id: "b1", productId: "base", variant: 0, finish: "oak" },
    { id: "w1", productId: "wall", variant: 1, finish: "sage" },
    { id: "b2", productId: "base", variant: 1, finish: "melamine" },
  ];
  expect(layout(s).map((p) => [p.module.id, p.start, p.width])).toEqual([
    ["b1", 0, 600],
    ["w1", 0, 800],
    ["b2", 600, 800],
  ]);
  expect(
    canAdd(s, z.id, { id: "w2", productId: "wall", variant: 0, finish: "oak" }),
  ).toBe("");
});
it("can place upper over base before a tall module but not over the tall interval", () => {
  const s = initial();
  const z = s.zones[0];
  z.width = 1200;
  z.modules = [
    { id: "b", productId: "base", variant: 0, finish: "oak" },
    { id: "t", productId: "pantry", variant: 0, finish: "oak" },
  ];
  expect(
    canAdd(s, z.id, { id: "w", productId: "wall", variant: 0, finish: "oak" }),
  ).toBe("");
  expect(
    canAdd(s, z.id, { id: "w", productId: "wall", variant: 1, finish: "oak" }),
  ).toContain("chặn");
});
it("L cabinet footprints cannot intersect across reserved inside corner", () => {
  const s = initial();
  s.shape = "L";
  s.runs.A = 6000;
  s.runs.B = 4000;
  s.zones[0].run = "B";
  s.zones[0].modules = [
    { id: "t", productId: "pantry", variant: 0, finish: "oak" },
  ];
  s.zones[1].modules = [
    { id: "b", productId: "base", variant: 0, finish: "oak" },
  ];
  const all = layout(s),
    a = all.find((p) => p.zone.run === "A")!,
    b = all.find((p) => p.zone.run === "B")!;
  expect(a.start).toBe(650);
  expect(b.start).toBe(650);
  expect(a.start).toBeGreaterThan(b.depth);
  expect(b.start).toBeGreaterThan(a.depth);
  expect(usable(s, "A") + usable(s, "B")).toBe(8700);
});
it("reports inactive B, overallocated zones, incompatibility and wall collision from valid-schema imports", () => {
  const s = initial();
  s.runs.A = 1000;
  s.zones[0].run = "B";
  s.zones[0].modules = [
    { id: "t", productId: "pantry", variant: 0, finish: "oak" },
    { id: "w", productId: "wall", variant: 0, finish: "oak" },
  ];
  s.zones[1].modules = [
    { id: "x", productId: "sink", variant: 0, finish: "oak" },
  ];
  const issues = validate(s).join(" ");
  expect(issues).toContain("Nhánh A: vùng vượt");
  expect(issues).toContain("Nhánh B: vùng vượt");
  expect(issues).toContain("chặn");
  expect(issues).toContain("không tương thích");
});
it("retains one hundred history entries and drops redo after new edit", () => {
  const store = createKitchen();
  for (let i = 0; i < 110; i++)
    store.getState().edit((s) => {
      s.runs.A = 5000 + i;
    });
  expect(store.getState().past).toHaveLength(100);
  store.getState().undo();
  expect(store.getState().future).toHaveLength(1);
  store.getState().edit((s) => {
    s.runs.A = 9000;
  });
  expect(store.getState().future).toHaveLength(0);
});
it("saves and loads only its dedicated key with exact JSON roundtrip", () => {
  const values = new Map([["nep-layout-v1", "old"]]);
  const storage = {
    getItem: (k: string) => values.get(k) ?? null,
    setItem: (k: string, v: string) => {
      values.set(k, v);
    },
  };
  const s = initial();
  expect(save(storage, s)).toBe("");
  expect(load(storage).data).toEqual(s);
  expect(values.get("nep-layout-v1")).toBe("old");
  expect(values.has(STORAGE_KEY)).toBe(true);
});
