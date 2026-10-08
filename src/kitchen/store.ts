import { createStore } from "zustand/vanilla";
import { initial, type Kitchen } from "./domain";
import { parse } from "./persistence";
type State = {
  data: Kitchen;
  past: Kitchen[];
  future: Kitchen[];
  edit: (fn: (s: Kitchen) => void) => void;
  undo: () => void;
  redo: () => void;
  importJSON: (text: string) => string;
  notice: string;
};
export const createKitchen = (data = initial()) =>
  createStore<State>((set, get) => ({
    data,
    past: [],
    future: [],
    notice: "",
    edit: (fn) => {
      const old = get().data,
        next = structuredClone(old);
      fn(next);
      if (JSON.stringify(next) === JSON.stringify(old)) return;
      set({
        data: next,
        past: [...get().past, old].slice(-100),
        future: [],
        notice: "",
      });
    },
    undo: () => {
      const s = get();
      if (!s.past.length) return;
      set({
        data: s.past.at(-1)!,
        past: s.past.slice(0, -1),
        future: [s.data, ...s.future],
        notice: "",
      });
    },
    redo: () => {
      const s = get();
      if (!s.future.length) return;
      set({
        data: s.future[0],
        past: [...s.past, s.data],
        future: s.future.slice(1),
        notice: "",
      });
    },
    importJSON: (text) => {
      try {
        const r = parse(text);
        set({
          data: r.data,
          past: [...get().past, get().data].slice(-100),
          future: [],
          notice:
            r.warning || "Đã nhập cấu hình; giá được tính lại từ danh mục.",
        });
        return "";
      } catch (e) {
        return e instanceof Error ? e.message : "Tệp không hợp lệ.";
      }
    },
  }));
export function newId() {
  return (
    "m-" +
    Array.from(crypto.getRandomValues(new Uint32Array(3)), (n) =>
      n.toString(36),
    ).join("-")
  );
}
