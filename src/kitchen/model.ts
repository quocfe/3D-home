import { materials, type Finish, type Product, type Variant } from "./catalog";
export type Part = {
  name: string;
  position: [number, number, number];
  size: [number, number, number];
  color: string;
};
export function cabinetParts(p: Product, v: Variant, finish: Finish): Part[] {
  const w = v.w / 1000,
    h = v.h / 1000,
    d = v.d / 1000,
    toe = p.layer === "wall" ? 0 : 0.095;
  const parts: Part[] = [
    {
      name: "body",
      position: [0, h / 2, -0.015],
      size: [w - 0.008, h, d - 0.03],
      color: "#d5cdbc",
    },
  ];
  if (p.id === "drawer") {
    for (let i = 0; i < 3; i++) {
      const dh = (h - toe) / 3;
      parts.push(
        {
          name: `door-${i}`,
          position: [0, toe + dh * (i + 0.5), d / 2 - 0.014],
          size: [w - 0.012, dh - 0.008, 0.022],
          color: materials[finish].color,
        },
        {
          name: `handle-${i}`,
          position: [0, toe + dh * (i + 1) - 0.05, d / 2 - 0.002],
          size: [0.1, 0.009, 0.004],
          color: "#55564c",
        },
      );
    }
  } else
    for (let i = 0; i < 2; i++)
      parts.push(
        {
          name: `door-${i}`,
          position: [((i - 0.5) * w) / 2, toe + (h - toe) / 2, d / 2 - 0.014],
          size: [w / 2 - 0.01, h - toe - 0.015, 0.022],
          color: materials[finish].color,
        },
        {
          name: `handle-${i}`,
          position: [i === 0 ? -0.025 : 0.025, h - 0.13, d / 2 - 0.002],
          size: [0.035, 0.009, 0.004],
          color: "#55564c",
        },
      );
  if (toe)
    parts.push({
      name: "toe",
      position: [0, 0.045, d / 2 - 0.022],
      size: [w - 0.02, 0.09, 0.004],
      color: "#514e45",
    });
  return parts;
}
