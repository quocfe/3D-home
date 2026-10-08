import { CATALOG_VERSION, functions, materials, product } from "./catalog";
import { initial, type Kitchen } from "./domain";
export const STORAGE_KEY = "nep-kitchen-v1";
export const MAX_BYTES = 100000;
type Storage = Pick<globalThis.Storage, "getItem" | "setItem">;
function object(
  v: unknown,
  keys: string[],
): asserts v is Record<string, unknown> {
  if (
    !v ||
    typeof v !== "object" ||
    Array.isArray(v) ||
    Object.keys(v).some((k) => !keys.includes(k)) ||
    keys.some((k) => !(k in v))
  )
    throw Error("Cấu trúc JSON không hợp lệ hoặc có trường lạ.");
}
function integer(v: unknown, min: number, max: number) {
  if (typeof v !== "number" || !Number.isInteger(v) || v < min || v > max)
    throw Error("Kích thước hoặc chỉ số không hợp lệ.");
}
const own = (o: object, k: unknown) =>
  typeof k === "string" && Object.prototype.hasOwnProperty.call(o, k);
export function parse(text: string): { data: Kitchen; warning: string } {
  if (new TextEncoder().encode(text).length > MAX_BYTES)
    throw Error("Tệp vượt 100.000 byte.");
  const s: unknown = JSON.parse(text);
  object(s, ["version", "catalogVersion", "shape", "runs", "zones"]);
  if (
    s.version !== 1 ||
    (s.shape !== "straight" && s.shape !== "L") ||
    typeof s.catalogVersion !== "string" ||
    s.catalogVersion.length > 80
  )
    throw Error("Phiên bản hoặc kiểu bếp không hỗ trợ.");
  object(s.runs, ["A", "B"]);
  integer(s.runs.A, 1000, 10000);
  integer(s.runs.B, 1000, 10000);
  if (!Array.isArray(s.zones) || s.zones.length !== 5)
    throw Error("Cần đủ 5 vùng công năng.");
  const ids = new Set<string>(),
    kinds = new Set<string>();
  let count = 0;
  const id = (v: unknown) => {
    if (typeof v !== "string" || !/^[-\w]{1,80}$/.test(v) || ids.has(v))
      throw Error("ID sai hoặc trùng.");
    ids.add(v);
  };
  for (const z of s.zones) {
    object(z, ["id", "kind", "run", "width", "modules"]);
    id(z.id);
    if (
      !own(functions, z.kind) ||
      kinds.has(String(z.kind)) ||
      (z.run !== "A" && z.run !== "B")
    )
      throw Error("Vùng hoặc nhánh không hợp lệ.");
    kinds.add(String(z.kind));
    integer(z.width, 100, 10000);
    if (!Array.isArray(z.modules))
      throw Error("Danh sách module không hợp lệ.");
    for (const m of z.modules) {
      object(m, ["id", "productId", "variant", "finish"]);
      id(m.id);
      const p = typeof m.productId === "string" ? product(m.productId) : null;
      if (!p || !own(materials, m.finish))
        throw Error("Module hoặc vật liệu không có trong danh mục.");
      integer(m.variant, 0, p.variants.length - 1);
      if (++count > 100) throw Error("Tối đa 100 module.");
    }
  }
  const warning =
    s.catalogVersion === CATALOG_VERSION
      ? ""
      : "Danh mục khác phiên bản: đã tính lại theo giá demo hiện tại.";
  return {
    data: { ...s, catalogVersion: CATALOG_VERSION } as Kitchen,
    warning,
  };
}
export function load(storage: Storage): { data: Kitchen; error: string } {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { data: initial(), error: "" };
    const r = parse(raw);
    return { data: r.data, error: r.warning };
  } catch {
    return {
      data: initial(),
      error:
        "Không đọc được bản tự lưu. Dữ liệu cũ được giữ nguyên; hãy xuất bản mới trước khi lưu tiếp.",
    };
  }
}
export function save(storage: Storage, s: Kitchen): string {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(s));
    return "";
  } catch {
    return "Không thể tự lưu trên trình duyệt. Hãy xuất JSON để giữ bản sao.";
  }
}
