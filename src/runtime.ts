import { useStore } from "zustand";
import { createPlanner, initial, type Planner } from "./store";
import { loadSaved, saveLayout } from "./persistence";
let boot = { layout: null, error: "" } as ReturnType<typeof loadSaved>;
try {
  boot = loadSaved(window.localStorage);
} catch {
  boot.error = "Bộ nhớ trình duyệt bị chặn. Hãy xuất JSON.";
}
export const planner = createPlanner(boot.layout ?? initial);
export const bootError = boot.error;
export const usePlanner = <T>(selector: (s: Planner) => T) =>
  useStore(planner, selector);
export function persist() {
  try {
    return saveLayout(window.localStorage, planner.getState().layout);
  } catch {
    return "Không thể tự lưu. Hãy xuất JSON.";
  }
}
