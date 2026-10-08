export type Kind = "food" | "utensils" | "wash" | "prep" | "cook";
export type Run = "A" | "B";
export type Layer = "base" | "wall" | "tall";
export const functions: Record<
  Kind,
  { name: string; color: string; hint: string }
> = {
  food: {
    name: "Thực phẩm",
    color: "#b4bfa5",
    hint: "Đồ khô và thực phẩm dự trữ",
  },
  utensils: {
    name: "Dụng cụ",
    color: "#ddc69d",
    hint: "Bát đĩa, nồi và dụng cụ",
  },
  wash: { name: "Rửa", color: "#a6c9d0", hint: "Khoang chậu rửa và vệ sinh" },
  prep: { name: "Sơ chế", color: "#c8bbd8", hint: "Mặt bàn trống để chuẩn bị" },
  cook: { name: "Nấu", color: "#dcae9e", hint: "Khoang bếp và thiết bị nấu" },
};
export const materials = {
  melamine: { name: "Melamine · trắng ấm", color: "#e8e5dc", extra: 0 },
  oak: { name: "Laminate · vân sồi", color: "#bc9465", extra: 450000 },
  sage: { name: "Laminate · xanh xám", color: "#84958a", extra: 350000 },
};
export type Finish = keyof typeof materials;
export type Variant = { w: number; h: number; d: number; price: number | null };
export type Product = {
  id: string;
  name: string;
  kind: Kind[];
  layer: Layer;
  detail: string;
  variants: Variant[];
};
export const CATALOG_VERSION = "2026-demo-1";
export const catalog: Product[] = [
  {
    id: "pantry",
    name: "Tủ kho cao",
    kind: ["food"],
    layer: "tall",
    detail: "Hai cánh · đợt chứa đồ khô",
    variants: [{ w: 600, h: 2200, d: 600, price: 7200000 }],
  },
  {
    id: "base",
    name: "Tủ dưới hai cánh",
    kind: ["food", "utensils", "prep"],
    layer: "base",
    detail: "Thùng MDF chống ẩm · đợt cố định",
    variants: [
      { w: 600, h: 820, d: 600, price: 2400000 },
      { w: 800, h: 820, d: 600, price: 2900000 },
    ],
  },
  {
    id: "drawer",
    name: "Tủ ba ngăn kéo",
    kind: ["utensils", "prep"],
    layer: "base",
    detail: "Ba ngăn kéo · ray giảm chấn",
    variants: [
      { w: 600, h: 820, d: 600, price: 3800000 },
      { w: 800, h: 820, d: 600, price: 4500000 },
    ],
  },
  {
    id: "sink",
    name: "Tủ khoang chậu rửa",
    kind: ["wash"],
    layer: "base",
    detail: "Khoang rỗng · không gồm chậu và vòi",
    variants: [
      { w: 600, h: 820, d: 600, price: 2300000 },
      { w: 800, h: 820, d: 600, price: 2800000 },
    ],
  },
  {
    id: "hob",
    name: "Tủ khoang bếp",
    kind: ["cook"],
    layer: "base",
    detail: "Khoang thiết bị · không gồm bếp",
    variants: [
      { w: 600, h: 820, d: 600, price: 2600000 },
      { w: 800, h: 820, d: 600, price: 3100000 },
    ],
  },
  {
    id: "wall",
    name: "Tủ trên hai cánh",
    kind: ["food", "utensils", "wash", "prep", "cook"],
    layer: "wall",
    detail: "Hai cánh · đáy tủ cách sàn 1.450 mm",
    variants: [
      { w: 600, h: 720, d: 350, price: 1800000 },
      { w: 800, h: 720, d: 350, price: 2200000 },
    ],
  },
  {
    id: "glass",
    name: "Tủ trên kính mẫu",
    kind: ["utensils"],
    layer: "wall",
    detail: "Mẫu thử · chưa có giá chính thức",
    variants: [{ w: 600, h: 720, d: 350, price: null }],
  },
];
export const product = (id: string) => catalog.find((p) => p.id === id);
export const layerName: Record<Layer, string> = {
  base: "Tủ dưới",
  wall: "Tủ trên",
  tall: "Tủ cao",
};
export const vnd = (n: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);
