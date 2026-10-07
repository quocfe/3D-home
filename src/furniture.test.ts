import { it, expect } from "vitest";
import { catalog, type CatalogId } from "./core";
import { partsFor } from "./furniture";
it("all procedural parts stay within the advertised fixed meter bounds", () => {
  for (const id of Object.keys(catalog) as CatalogId[]) {
    const d = catalog[id];
    for (const part of partsFor(id)) {
      expect(
        Math.abs(part.p[0]) + part.s[0] / 2,
        `${id} X`,
      ).toBeLessThanOrEqual(d.w / 2 + 1e-8);
      expect(
        Math.abs(part.p[2]) + part.s[2] / 2,
        `${id} Z`,
      ).toBeLessThanOrEqual(d.d / 2 + 1e-8);
      expect(part.p[1] - part.s[1] / 2, `${id} base`).toBeGreaterThanOrEqual(
        -1e-8,
      );
      expect(part.p[1] + part.s[1] / 2, `${id} height`).toBeLessThanOrEqual(
        d.h + 1e-8,
      );
    }
  }
});
