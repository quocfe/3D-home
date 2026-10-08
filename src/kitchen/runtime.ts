import { useStore } from "zustand";
import { createKitchen } from "./store";
import { load, save } from "./persistence";
import { initial } from "./domain";
let boot: { data: ReturnType<typeof initial>; error: string };
try {
  boot = load(window.localStorage);
} catch {
  boot = {
    data: initial(),
    error: "Bộ nhớ trình duyệt bị chặn. Hãy xuất JSON để lưu.",
  };
}
export const kitchen = createKitchen(boot.data);
export const bootError = boot.error;
export const useKitchen = () => useStore(kitchen);
export const persist = () => {
  try {
    return save(window.localStorage, kitchen.getState().data);
  } catch {
    return "Không thể tự lưu. Hãy xuất JSON để giữ bản sao.";
  }
};
