export type Room = { length: number; width: number; height: number };
export const catalog = {
  sofa: {
    name: "Sofa Mây",
    category: "Phòng khách",
    w: 2.2,
    d: 0.9,
    h: 0.85,
    color: "#59877c",
  },
  coffee: {
    name: "Bàn trà Sồi",
    category: "Phòng khách",
    w: 1.1,
    d: 0.6,
    h: 0.42,
    color: "#bf9061",
  },
  chair: {
    name: "Ghế An",
    category: "Góc làm việc",
    w: 0.55,
    d: 0.55,
    h: 0.85,
    color: "#ba795b",
  },
  desk: {
    name: "Bàn làm việc",
    category: "Góc làm việc",
    w: 1.4,
    d: 0.7,
    h: 0.75,
    color: "#d0a578",
  },
  bed: {
    name: "Giường Êm",
    category: "Phòng ngủ",
    w: 1.6,
    d: 2.1,
    h: 0.95,
    color: "#b1bfae",
  },
  wardrobe: {
    name: "Tủ áo Gỗ",
    category: "Phòng ngủ",
    w: 1.6,
    d: 0.6,
    h: 2.1,
    color: "#ad845d",
  },
  shelf: {
    name: "Kệ Mộc",
    category: "Lưu trữ",
    w: 0.9,
    d: 0.35,
    h: 1.8,
    color: "#c49d72",
  },
} as const;
export type CatalogId = keyof typeof catalog;
export type Item = Pose & { id: string; catalogId: CatalogId };
export type Layout = { version: 1; room: Room; items: Item[] };
export const MAX_BYTES = 100000,
  MAX_ITEMS = 100;
function record(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}
function keys(v: Record<string, unknown>, allowed: string[]) {
  return Object.keys(v).every((k) => allowed.includes(k));
}
function num(v: unknown, min: number, max: number): v is number {
  return typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
}
export function validRoom(v: unknown): v is Room {
  return (
    record(v) &&
    keys(v, ["length", "width", "height"]) &&
    num(v.length, 0.5, 30) &&
    num(v.width, 0.5, 30) &&
    num(v.height, 0.5, 10)
  );
}
export function parseLayout(text: string): Layout {
  if (new TextEncoder().encode(text).length > MAX_BYTES)
    throw Error("Tệp vượt quá 100 KB.");
  let v: unknown;
  try {
    v = JSON.parse(text);
  } catch {
    throw Error("JSON không hợp lệ.");
  }
  if (
    !record(v) ||
    !keys(v, ["version", "room", "items"]) ||
    v.version !== 1 ||
    !validRoom(v.room) ||
    !Array.isArray(v.items) ||
    v.items.length > MAX_ITEMS
  )
    throw Error(
      "Sai cấu trúc, phiên bản, kích thước phòng hoặc quá 100 đồ vật.",
    );
  const ids = new Set<string>();
  for (const i of v.items) {
    if (
      !record(i) ||
      !keys(i, ["id", "catalogId", "x", "z", "angle"]) ||
      typeof i.id !== "string" ||
      !/^[\w-]{1,80}$/.test(i.id) ||
      ids.has(i.id) ||
      typeof i.catalogId !== "string" ||
      !Object.hasOwn(catalog, i.catalogId) ||
      !num(i.x, -100, 100) ||
      !num(i.z, -100, 100) ||
      !num(i.angle, -Math.PI * 2, Math.PI * 2)
    )
      throw Error("Đồ vật không hợp lệ: mã, tọa độ, góc hoặc ID trùng lặp.");
    ids.add(i.id);
  }
  return v as Layout;
}
export type Dimensions = { w: number; d: number; h: number };
export type Pose = { x: number; z: number; angle: number };
// All feasibility changes occur at an extent/room boundary; no sampling gaps.
export function fittingAngle(room: Room, size: Dimensions): number | null {
  const candidates = [0, Math.PI / 2];
  for (const [a, b, limit] of [
    [size.w, size.d, room.length],
    [size.d, size.w, room.width],
  ]) {
    const radius = Math.hypot(a, b),
      phase = Math.atan2(b, a);
    if (limit <= radius)
      for (const sign of [-1, 1]) {
        const theta = phase + sign * Math.acos(limit / radius);
        if (theta >= 0 && theta <= Math.PI / 2) candidates.push(theta);
      }
  }
  return (
    candidates.find((angle) => fits(room, size, { x: 0, z: 0, angle })) ?? null
  );
}
export function fits(room: Room, size: Dimensions, pose: Pose): boolean {
  const c = Math.abs(Math.cos(pose.angle)),
    s = Math.abs(Math.sin(pose.angle));
  const hx = (size.w * c + size.d * s) / 2,
    hz = (size.w * s + size.d * c) / 2;
  return (
    size.h <= room.height + 1e-8 &&
    Math.abs(pose.x) + hx <= room.length / 2 + 1e-8 &&
    Math.abs(pose.z) + hz <= room.width / 2 + 1e-8
  );
}
