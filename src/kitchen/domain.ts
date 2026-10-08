import {
  CATALOG_VERSION,
  functions,
  product,
  type Kind,
  type Run,
  type Finish,
} from "./catalog";
export const CORNER = 650;
export type Module = {
  id: string;
  productId: string;
  variant: number;
  finish: Finish;
};
export type Zone = {
  id: string;
  kind: Kind;
  run: Run;
  width: number;
  modules: Module[];
};
export type Kitchen = {
  version: 1;
  catalogVersion: string;
  shape: "straight" | "L";
  runs: Record<Run, number>;
  zones: Zone[];
};
export const initial = (): Kitchen => ({
  version: 1,
  catalogVersion: CATALOG_VERSION,
  shape: "straight",
  runs: { A: 4200, B: 2400 },
  zones: [
    { id: "food", kind: "food", run: "A", width: 600, modules: [] },
    { id: "utensils", kind: "utensils", run: "A", width: 600, modules: [] },
    { id: "wash", kind: "wash", run: "A", width: 800, modules: [] },
    { id: "prep", kind: "prep", run: "A", width: 1000, modules: [] },
    { id: "cook", kind: "cook", run: "A", width: 600, modules: [] },
  ],
});
export const reserve = (s: Kitchen) => (s.shape === "L" ? CORNER : 0);
export const usable = (s: Kitchen, run: Run) =>
  run === "B" && s.shape === "straight"
    ? 0
    : Math.max(0, s.runs[run] - reserve(s));
export const allocated = (s: Kitchen, run: Run) =>
  s.zones.filter((z) => z.run === run).reduce((n, z) => n + z.width, 0);
export type Placed = {
  zone: Zone;
  module: Module;
  start: number;
  width: number;
  height: number;
  depth: number;
  y: number;
  layer: "base" | "wall" | "tall";
};
export function layout(s: Kitchen): Placed[] {
  const offsets = { A: reserve(s), B: reserve(s) };
  const result: Placed[] = [];
  for (const z of s.zones) {
    const start = offsets[z.run];
    let lower = 0,
      upper = 0;
    for (const m of z.modules) {
      const p = product(m.productId),
        v = p?.variants[m.variant];
      if (!p || !v) continue;
      const x = p.layer === "wall" ? upper : lower;
      result.push({
        zone: z,
        module: m,
        start: start + x,
        width: v.w,
        height: v.h,
        depth: v.d,
        y: p.layer === "wall" ? 1450 : 0,
        layer: p.layer,
      });
      if (p.layer === "wall") upper += v.w;
      else lower += v.w;
    }
    offsets[z.run] += z.width;
  }
  return result;
}
export function upperFree(s: Kitchen, zoneId: string): number {
  const z = s.zones.find((z) => z.id === zoneId)!;
  const start =
    reserve(s) +
    s.zones
      .slice(0, s.zones.indexOf(z))
      .filter((x) => x.run === z.run)
      .reduce((n, x) => n + x.width, 0);
  const spans = layout(s)
    .filter((p) => p.zone.id === zoneId && p.layer !== "base")
    .map((p) => [
      Math.max(start, p.start),
      Math.min(start + z.width, p.start + p.width),
    ])
    .sort((a, b) => a[0] - b[0]);
  let cursor = start,
    used = 0;
  for (const [a, b] of spans) {
    used += Math.max(0, b - Math.max(cursor, a));
    cursor = Math.max(cursor, b);
  }
  return z.width - used;
}
export function canAdd(s: Kitchen, zoneId: string, m: Module): string {
  const z = s.zones.find((z) => z.id === zoneId),
    p = product(m.productId);
  if (!z || !p || !p.variants[m.variant] || !p.kind.includes(z.kind))
    return "Module không tương thích.";
  if (allocated(s, z.run) > usable(s, z.run))
    return `Nhánh ${z.run} thiếu chiều dài hữu dụng. Sửa phân vùng trước.`;
  if (s.zones.reduce((n, z) => n + z.modules.length, 0) >= 100)
    return "Tối đa 100 module.";
  const draft = structuredClone(s);
  draft.zones.find((z) => z.id === zoneId)!.modules.push(m);
  const issues = validate(draft).filter(
    (x) =>
      x.startsWith(functions[z.kind].name) &&
      /vượt|chặn|không tương thích/.test(x),
  );
  return issues[0] ?? "";
}
export function validate(s: Kitchen): string[] {
  const issues: string[] = [];
  for (const r of ["A", "B"] as Run[]) {
    const a = allocated(s, r),
      u = usable(s, r);
    if (a > u) issues.push(`Nhánh ${r}: vùng vượt ${a - u} mm hữu dụng.`);
    if (a < u) issues.push(`Nhánh ${r}: còn ${u - a} mm chưa phân vùng.`);
  }
  const all = layout(s);
  for (const z of s.zones) {
    const name = functions[z.kind].name,
      ps = all.filter((p) => p.zone.id === z.id);
    for (const layer of ["base", "wall"] as const) {
      const width = ps
        .filter((p) =>
          layer === "base" ? p.layer !== "wall" : p.layer === "wall",
        )
        .reduce((n, p) => n + p.width, 0);
      if (width > z.width)
        issues.push(
          `${name}: ${layer === "base" ? "tầng dưới/cao" : "tầng trên"} vượt ${width - z.width} mm.`,
        );
      if (layer === "base" && width < z.width)
        issues.push(
          `${name}: còn ${z.width - width} mm tầng dưới chưa chọn tủ.`,
        );
    }
    for (const p of ps) {
      if (!product(p.module.productId)!.kind.includes(z.kind))
        issues.push(`${name}: module không tương thích.`);
    }
    const tall = ps.filter((p) => p.layer === "tall"),
      wall = ps.filter((p) => p.layer === "wall");
    if (
      tall.some((t) =>
        wall.some(
          (w) => w.start < t.start + t.width && t.start < w.start + w.width,
        ),
      )
    )
      issues.push(`${name}: tủ cao chặn vị trí tủ trên.`);
  }
  return issues;
}
