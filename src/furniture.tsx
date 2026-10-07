import { catalog, type CatalogId } from "./core";
export type Part = {
  p: [number, number, number];
  s: [number, number, number];
  color: string;
};
export function partsFor(id: CatalogId): Part[] {
  const { w, d, h, color } = catalog[id],
    wood = "#a88059",
    dark = "#514b40",
    cream = "#ece4d5";
  const a: Part[] = [];
  const box = (
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    c: string = color,
  ) => a.push({ p: [x, y, z], s: [sx, sy, sz], color: c });
  const legs = (height: number, inset = 0.07) => {
    for (const x of [-1, 1])
      for (const z of [-1, 1])
        box(
          x * (w / 2 - inset),
          height / 2,
          z * (d / 2 - inset),
          0.06,
          height,
          0.06,
          wood,
        );
  };
  if (id === "sofa") {
    legs(0.16, 0.12);
    box(0, 0.28, 0, w, 0.25, d);
    box(0, 0.63, -d / 2 + 0.1, w, 0.44, 0.2);
    for (const x of [-1, 1]) box(x * (w / 2 - 0.09), 0.48, 0, 0.18, 0.45, d);
    for (const x of [-0.48, 0.48]) {
      box(x, 0.45, 0.06, 0.93, 0.17, 0.63, "#709b8d");
      box(x, 0.66, -0.24, 0.88, 0.3, 0.12, "#85a99b");
    }
  } else if (id === "coffee" || id === "desk") {
    legs(h - 0.07, 0.1);
    box(0, h - 0.035, 0, w, 0.07, d);
    if (id === "desk") {
      box(w / 2 - 0.22, 0.52, 0, 0.38, 0.26, d - 0.06, "#b98e62");
      box(w / 2 - 0.22, 0.54, d / 2 - 0.025, 0.12, 0.025, 0.02, dark);
    }
  } else if (id === "chair") {
    legs(0.43, 0.05);
    box(0, 0.45, 0, w, 0.07, d);
    box(0, 0.7, -d / 2 + 0.035, w, 0.3, 0.07);
    for (const x of [-1, 1])
      box(x * (w / 2 - 0.04), 0.63, -d / 2 + 0.04, 0.055, 0.42, 0.055, wood);
  } else if (id === "bed") {
    legs(0.18, 0.1);
    box(0, 0.22, 0, w, 0.22, d, wood);
    box(0, 0.4, 0.03, w - 0.05, 0.18, d - 0.12, cream);
    box(0, 0.63, -d / 2 + 0.06, w, 0.64, 0.12, wood);
    box(0, 0.505, 0.35, w - 0.07, 0.05, d * 0.6, color);
    for (const x of [-0.4, 0.4]) box(x, 0.52, -0.65, 0.64, 0.1, 0.4, "#f7f2e7");
  } else if (id === "wardrobe") {
    box(0, h / 2, -0.015, w, h, d - 0.03);
    for (const x of [-1, 1]) {
      box(
        (x * w) / 4,
        h / 2,
        d / 2 - 0.04,
        w / 2 - 0.018,
        h - 0.05,
        0.05,
        "#c49d74",
      );
      box(x * 0.06, h * 0.48, d / 2 - 0.006, 0.025, 0.23, 0.012, dark);
    }
  } else {
    box(0, h / 2, -d / 2 + 0.02, w, h, 0.04, "#b78d62");
    for (const x of [-1, 1]) box(x * (w / 2 - 0.03), h / 2, 0, 0.06, h, d);
    for (const y of [0.04, 0.48, 0.92, 1.36, 1.77]) box(0, y, 0, w, 0.06, d);
    for (const [i, x] of [-0.28, -0.16, -0.04, 0.08].entries())
      box(
        x,
        0.66,
        0,
        0.085,
        0.3 + (i % 2) * 0.05,
        0.23,
        ["#647d73", "#d6c4a3", "#a8674f", "#455e62"][i],
      );
    box(0.17, 1.07, 0, 0.26, 0.24, 0.24, "#dbd0ba");
  }
  return a;
}
export function Furniture({
  id,
  ghost = false,
}: {
  id: CatalogId;
  ghost?: boolean;
}) {
  return (
    <group>
      {partsFor(id).map((p, i) => (
        <mesh key={i} position={p.p} castShadow={!ghost} receiveShadow>
          <boxGeometry args={p.s} />
          <meshStandardMaterial
            color={p.color}
            roughness={0.8}
            transparent={ghost}
            opacity={ghost ? 0.5 : 1}
          />
        </mesh>
      ))}
    </group>
  );
}
export function Thumbnail({ id }: { id: CatalogId }) {
  const parts = partsFor(id),
    dim = catalog[id];
  const scale = 58 / Math.max(dim.w, dim.d, dim.h * 1.1);
  const project = ([x, y, z]: number[]) => [
    60 + (x - z) * 0.78 * scale,
    76 + ((x + z) * 0.32 - y) * scale,
  ];
  return (
    <svg viewBox="0 0 120 100" aria-hidden="true">
      {[...parts]
        .sort((a, b) => a.p[0] + a.p[2] - (b.p[0] + b.p[2]) || a.p[1] - b.p[1])
        .map((p, i) => {
          const [x, y, z] = p.p,
            [w, h, d] = p.s;
          const v = [
            [-1, -1, -1],
            [1, -1, -1],
            [1, -1, 1],
            [-1, -1, 1],
            [-1, 1, -1],
            [1, 1, -1],
            [1, 1, 1],
            [-1, 1, 1],
          ].map(([a, b, c]) =>
            project([x + (a * w) / 2, y + (b * h) / 2, z + (c * d) / 2]),
          );
          return (
            <g
              key={i}
              fill={p.color}
              stroke="#51483b"
              strokeOpacity=".13"
              strokeWidth=".5"
            >
              {[
                [1, 2, 6, 5],
                [2, 3, 7, 6],
                [4, 5, 6, 7],
              ].map((face, j) => (
                <g key={j}>
                  <polygon points={face.map((n) => v[n].join(",")).join(" ")} />
                  <polygon
                    points={face.map((n) => v[n].join(",")).join(" ")}
                    fill={j === 0 ? "#000" : "#fff"}
                    fillOpacity={j === 0 ? 0.1 : j === 2 ? 0.16 : 0}
                  />
                </g>
              ))}
            </g>
          );
        })}
    </svg>
  );
}
