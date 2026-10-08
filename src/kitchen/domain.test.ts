import { describe, it, expect } from "vitest";
import { initial, usable, layout, validate, canAdd, upperFree } from "./domain";
it("reports free upper width as interval union of tall and wall modules", () => {
  const s = initial(),
    z = s.zones[0];
  z.width = 1800;
  z.modules = [
    { id: "t", productId: "pantry", variant: 0, finish: "oak" },
    { id: "w", productId: "wall", variant: 0, finish: "oak" },
  ];
  expect(upperFree(s, z.id)).toBe(1200);
  z.modules = [
    { id: "b", productId: "base", variant: 0, finish: "oak" },
    { id: "t", productId: "pantry", variant: 0, finish: "oak" },
    { id: "w", productId: "wall", variant: 0, finish: "oak" },
  ];
  expect(upperFree(s, z.id)).toBe(600);
});
it("packs independent layers, rejects overflow and tall/upper overlap", () => {
  const s = initial(),
    z = s.zones[0];
  const base = {
    id: "b",
    productId: "base",
    variant: 0,
    finish: "oak" as const,
  };
  z.modules.push(base);
  expect(canAdd(s, z.id, { ...base, id: "w", productId: "wall" })).toBe("");
  expect(canAdd(s, z.id, { ...base, id: "b2" })).toContain("vượt");
  z.modules = [{ ...base, productId: "pantry" }];
  expect(canAdd(s, z.id, { ...base, id: "w", productId: "wall" })).toContain(
    "chặn",
  );
  z.modules = [{ ...base, productId: "wall" }];
  expect(canAdd(s, z.id, { ...base, id: "t", productId: "pantry" })).toContain(
    "chặn",
  );
});
it("rejects additions and copies when run allocations exceed usable length or item limit reached", () => {
  const s = initial();
  s.runs.A = 1000;
  const m = {
    id: "copy",
    productId: "base",
    variant: 0,
    finish: "oak" as const,
  };
  expect(canAdd(s, s.zones[0].id, m)).toContain("Nhánh A");
  s.runs.A = 10000;
  s.zones[4].modules = Array.from({ length: 100 }, (_, i) => ({
    ...m,
    id: "m" + i,
  }));
  expect(canAdd(s, s.zones[0].id, m)).toContain("100 module");
});
describe("kitchen geometry", () => {
  it("reserves the same inside corner on both L runs without overlapping cabinets", () => {
    const s = initial();
    s.shape = "L";
    s.runs.A = 4800;
    s.zones[0].modules.push({
      id: "one",
      productId: "pantry",
      variant: 0,
      finish: "oak",
    });
    expect(usable(s, "A")).toBe(s.runs.A - 650);
    expect(usable(s, "B")).toBe(s.runs.B - 650);
    const placed = layout(s);
    expect(placed.every((p) => p.start >= 650)).toBe(true);
    expect(validate(s).filter((x) => x.includes("vượt"))).toEqual([]);
  });
});
