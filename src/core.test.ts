import { describe, it, expect } from "vitest";
import * as core from "./core";
const sample = {
  version: 1,
  room: { length: 6, width: 5, height: 2.8 },
  items: [{ id: "a", catalogId: "sofa", x: 0, z: 0, angle: 0 }],
};
describe("versioned JSON", () => {
  it("round trips known catalog items without accepting untrusted fields", () => {
    expect(core.parseLayout).toBeTypeOf("function");
    expect(core.parseLayout(JSON.stringify(sample))).toEqual(sample);
    for (const invalid of [
      { ...sample, version: 2 },
      { ...sample, room: { ...sample.room, length: NaN } },
      { ...sample, items: [{ ...sample.items[0], catalogId: "evil" }] },
      { ...sample, items: [sample.items[0], sample.items[0]] },
      {
        ...sample,
        items: Array.from({ length: 101 }, (_, i) => ({
          ...sample.items[0],
          id: String(i),
        })),
      },
      { ...sample, items: [{ ...sample.items[0], x: "0" }] },
      {
        ...sample,
        items: [{ ...sample.items[0], url: "https://evil/model.glb" }],
      },
    ])
      expect(() => core.parseLayout(JSON.stringify(invalid))).toThrow();
    expect(() => core.parseLayout(" ".repeat(100001))).toThrow();
    expect(() => core.parseLayout("{bad")).toThrow();
  });
});
describe("footprint geometry", () => {
  it("finds a feasible rotation, including diagonal-only fits, and rejects height", () => {
    expect(core.fittingAngle).toBeTypeOf("function");
    for (const [room, size] of [
      [
        { length: 1, width: 3, height: 3 },
        { w: 2, d: 0.9, h: 1 },
      ],
      [
        { length: 1.6, width: 1.6, height: 3 },
        { w: 2, d: 0.2, h: 1 },
      ],
    ]) {
      const a = core.fittingAngle(room, size);
      expect(a).not.toBeNull();
      expect(core.fits(room, size, { x: 0, z: 0, angle: a! })).toBe(true);
    }
    expect(
      core.fittingAngle(
        { length: 1, width: 1, height: 3 },
        { w: 2, d: 2, h: 1 },
      ),
    ).toBeNull();
    expect(
      core.fittingAngle(
        { length: 4, width: 4, height: 1 },
        { w: 2, d: 2, h: 2 },
      ),
    ).toBeNull();
  });
  it("fits every rotated corner and height, including exact boundaries", () => {
    expect(core.fits).toBeTypeOf("function");
    expect(
      core.fits(
        { length: 4, width: 3, height: 2.5 },
        { w: 2, d: 1, h: 1 },
        { x: 1, z: 1, angle: 0 },
      ),
    ).toBe(true);
    expect(
      core.fits(
        { length: 4, width: 3, height: 2.5 },
        { w: 2, d: 1, h: 1 },
        { x: 1, z: 1, angle: Math.PI / 4 },
      ),
    ).toBe(false);
    expect(
      core.fits(
        { length: 4, width: 3, height: 0.9 },
        { w: 2, d: 1, h: 1 },
        { x: 0, z: 0, angle: 0 },
      ),
    ).toBe(false);
  });
});
