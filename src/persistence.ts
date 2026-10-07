import { parseLayout, type Layout } from "./core";
export const STORAGE_KEY = "nep-layout-v1";
export type StorageLike = Pick<Storage, "getItem" | "setItem">;
export function loadSaved(storage: StorageLike): {
  layout: Layout | null;
  error: string;
} {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    return { layout: raw ? parseLayout(raw) : null, error: "" };
  } catch {
    return {
      layout: null,
      error:
        "Không đọc được bản lưu. Đang dùng bố cục mẫu; hãy xuất JSON để giữ bản sao.",
    };
  }
}
export function saveLayout(storage: StorageLike, layout: Layout): string {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(layout));
    return "";
  } catch {
    return "Không thể tự lưu (bộ nhớ đầy hoặc bị chặn). Hãy xuất JSON.";
  }
}
