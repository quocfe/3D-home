import { materials, product } from "./catalog";
import type { Kitchen, Module } from "./domain";
export function price(m: Module): number | null {
  const v = product(m.productId)?.variants[m.variant];
  return v?.price == null ? null : v.price + materials[m.finish].extra;
}
export function quote(s: Kitchen) {
  const zones = s.zones.map((z) => {
    const lines = z.modules.map((m) => ({ module: m, price: price(m) }));
    return {
      zone: z,
      lines,
      subtotal: lines.reduce((n, l) => n + (l.price ?? 0), 0),
      complete: lines.every((l) => l.price !== null),
    };
  });
  return {
    zones,
    knownTotal: zones.reduce((n, z) => n + z.subtotal, 0),
    complete: zones.every((z) => z.complete),
  };
}
