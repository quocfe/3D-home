import { expect, it } from "vitest";
import { createKitchen } from "./store";
it("preserves contents on shrinking/shape changes, undo/redo and atomic failed import", () => {
  const store = createKitchen();
  store.getState().edit((s) => {
    s.zones[0].modules.push({
      id: "m",
      productId: "pantry",
      variant: 0,
      finish: "oak",
    });
    s.shape = "L";
    s.zones[0].run = "B";
  });
  store.getState().edit((s) => {
    s.shape = "straight";
    s.runs.B = 1000;
  });
  expect(store.getState().data.zones[0].modules).toHaveLength(1);
  store.getState().undo();
  expect(store.getState().data.shape).toBe("L");
  store.getState().redo();
  expect(store.getState().data.shape).toBe("straight");
  const before = store.getState().data;
  expect(store.getState().importJSON("{bad")).toBeTruthy();
  expect(store.getState().data).toBe(before);
});
