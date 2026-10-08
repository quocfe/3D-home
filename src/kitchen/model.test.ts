import { expect, it } from "vitest";
import { catalog, materials } from "./catalog";
import { cabinetParts } from "./model";
it("keeps every procedural part inside its advertised size with finish visible in front of carcass", () => {
  for (const p of catalog)
    for (const v of p.variants) {
      const parts = cabinetParts(p, v, "sage");
      for (const part of parts)
        for (let axis = 0; axis < 3; axis++) {
          const min = axis === 1 ? 0 : -[v.w, v.h, v.d][axis] / 2000,
            max = axis === 1 ? v.h / 1000 : [v.w, v.h, v.d][axis] / 2000;
          expect(
            part.position[axis] - part.size[axis] / 2,
          ).toBeGreaterThanOrEqual(min - 1e-9);
          expect(part.position[axis] + part.size[axis] / 2).toBeLessThanOrEqual(
            max + 1e-9,
          );
        }
      const body = parts.find((p) => p.name === "body")!,
        door = parts.find((p) => p.name === "door-0")!;
      expect(door.color).toBe(materials.sage.color);
      expect(door.position[2] - door.size[2] / 2).toBeGreaterThanOrEqual(
        body.position[2] + body.size[2] / 2,
      );
    }
});
