import { createStore } from "zustand/vanilla";
import {
  catalog,
  fits,
  parseLayout,
  validRoom,
  MAX_ITEMS,
  type Layout,
  type CatalogId,
  type Pose,
  type Room,
} from "./core";
export const initial: Layout = {
  version: 1,
  room: { length: 6, width: 5, height: 2.8 },
  items: [
    { id: "sample-sofa", catalogId: "sofa", x: -1.35, z: -1.65, angle: 0 },
    { id: "sample-coffee", catalogId: "coffee", x: -1.35, z: -0.35, angle: 0 },
    {
      id: "sample-chair",
      catalogId: "chair",
      x: 0.45,
      z: -0.2,
      angle: Math.PI / 6,
    },
    { id: "sample-shelf", catalogId: "shelf", x: 2.25, z: -2.1, angle: 0 },
    {
      id: "sample-desk",
      catalogId: "desk",
      x: 1.95,
      z: 0.5,
      angle: Math.PI / 2,
    },
  ],
};
export interface Planner {
  layout: Layout;
  past: Layout[];
  future: Layout[];
  selected: string | null;
  message: string;
  select: (id: string | null) => void;
  notify: (message: string) => void;
  add: (id: CatalogId, p: Pose) => boolean;
  transform: (id: string, p: Pose) => boolean;
  remove: (id: string) => void;
  room: (room: Room) => boolean;
  undo: () => void;
  redo: () => void;
  importText: (text: string) => boolean;
}
export function createPlanner(layout: Layout = initial) {
  return createStore<Planner>((set, get) => {
    const commit = (next: Layout) => {
      const s = get();
      if (JSON.stringify(next) === JSON.stringify(s.layout)) return;
      set({
        layout: next,
        past: [...s.past.slice(-99), s.layout],
        future: [],
        message: "",
      });
    };
    return {
      layout: structuredClone(layout),
      past: [],
      future: [],
      selected: null,
      message: "",
      select: (selected) => set({ selected }),
      notify: (message) => set({ message }),
      add: (catalogId, p) => {
        const s = get();
        if (s.layout.items.length >= MAX_ITEMS) {
          set({ message: "Tối đa 100 đồ vật." });
          return false;
        }
        if (!fits(s.layout.room, catalog[catalogId], p)) {
          set({
            message: "Không thể đặt: đồ vật vượt biên phòng hoặc quá cao.",
          });
          return false;
        }
        const id =
          "item-" +
          Array.from(crypto.getRandomValues(new Uint8Array(16)), (n) =>
            n.toString(16).padStart(2, "0"),
          ).join("");
        commit({
          ...s.layout,
          items: [...s.layout.items, { id, catalogId, ...p }],
        });
        set({ selected: id });
        return true;
      },
      transform: (id, p) => {
        const s = get(),
          item = s.layout.items.find((i) => i.id === id);
        if (!item) return false;
        if (!fits(s.layout.room, catalog[item.catalogId], p)) {
          set({
            message:
              "Không hợp lệ: vượt biên phòng hoặc quá cao. Đã giữ vị trí / góc trước.",
          });
          return false;
        }
        commit({
          ...s.layout,
          items: s.layout.items.map((i) => (i.id === id ? { ...i, ...p } : i)),
        });
        return true;
      },
      remove: (id) => {
        const s = get();
        commit({
          ...s.layout,
          items: s.layout.items.filter((i) => i.id !== id),
        });
        set({ selected: null });
      },
      room: (room) => {
        if (!validRoom(room)) {
          set({ message: "Chiều dài / rộng: 0,5–30 m; chiều cao: 0,5–10 m." });
          return false;
        }
        commit({ ...get().layout, room });
        return true;
      },
      undo: () => {
        const s = get();
        if (!s.past.length) return;
        set({
          layout: s.past.at(-1)!,
          past: s.past.slice(0, -1),
          future: [s.layout, ...s.future],
          selected: null,
          message: "",
        });
      },
      redo: () => {
        const s = get();
        if (!s.future.length) return;
        set({
          layout: s.future[0],
          past: [...s.past, s.layout],
          future: s.future.slice(1),
          selected: null,
          message: "",
        });
      },
      importText: (text) => {
        try {
          const next = parseLayout(text);
          commit(next);
          set({ selected: null });
          return true;
        } catch (e) {
          set({ message: (e as Error).message });
          return false;
        }
      },
    };
  });
}
