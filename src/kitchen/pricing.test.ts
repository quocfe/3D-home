import { expect, it } from "vitest";
import { initial } from "./domain";
import { quote } from "./pricing";
it("recalculates integer demo prices from catalog and finish, grouped by zone", () => {
  const s = initial();
  s.zones[0].modules = [
    { id: "a", productId: "base", variant: 1, finish: "oak" },
    { id: "b", productId: "base", variant: 0, finish: "sage" },
  ];
  const q = quote(s);
  expect(q.knownTotal).toBe(6100000);
  expect(q.zones[0].subtotal).toBe(6100000);
  expect(q.complete).toBe(true);
});
