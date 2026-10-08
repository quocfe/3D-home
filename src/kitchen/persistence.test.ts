import { expect, it } from "vitest";
import { initial } from "./domain";
import { parse, STORAGE_KEY, load, save } from "./persistence";
it("validates versioned snapshots without trusting client prices or unknown products", () => {
  const s = initial();
  expect(parse(JSON.stringify(s)).data).toEqual(s);
  s.zones[0].modules.push({
    id: "x",
    productId: "not-real",
    variant: 0,
    finish: "oak",
  });
  expect(() => parse(JSON.stringify(s))).toThrow();
  expect(STORAGE_KEY).not.toBe("nep-layout-v1");
  const storage = {
    getItem: () => "{broken",
    setItem: () => {
      throw Error("quota");
    },
  };
  expect(load(storage).error).toBeTruthy();
  expect(save(storage, initial())).toBeTruthy();
});
it.each([
  [
    "bad shape",
    (s: any) => {
      s.shape = ["L"];
    },
  ],
  [
    "bad run",
    (s: any) => {
      s.zones[0].run = ["A"];
    },
  ],
  [
    "duplicate ID",
    (s: any) => {
      s.zones[1].id = s.zones[0].id;
    },
  ],
  [
    "duplicate function",
    (s: any) => {
      s.zones[1].kind = "food";
    },
  ],
  [
    "unknown field",
    (s: any) => {
      s.price = 1;
    },
  ],
  [
    "client price",
    (s: any) => {
      s.zones[0].modules = [
        { id: "m", productId: "base", variant: 0, finish: "oak", price: 1 },
      ];
    },
  ],
  [
    "bad variant",
    (s: any) => {
      s.zones[0].modules = [
        { id: "m", productId: "base", variant: 99, finish: "oak" },
      ];
    },
  ],
  [
    "prototype finish",
    (s: any) => {
      s.zones[0].modules = [
        { id: "m", productId: "base", variant: 0, finish: "__proto__" },
      ];
    },
  ],
  [
    "missing function",
    (s: any) => {
      s.zones.pop();
    },
  ],
  [
    "bad dimensions",
    (s: any) => {
      s.runs.A = 999999;
    },
  ],
])("rejects %s atomically", (_, mutate) => {
  const s = initial();
  mutate(s);
  expect(() => parse(JSON.stringify(s))).toThrow();
});
it("warns and recalculates when catalog version differs, retaining invalid physical state", () => {
  const s = initial();
  s.catalogVersion = "old-demo";
  s.shape = "straight";
  s.zones[0].run = "B";
  s.runs.A = 1000;
  const r = parse(JSON.stringify(s));
  expect(r.warning).toContain("tính lại");
  expect(r.data.zones[0].run).toBe("B");
  expect(r.data.runs.A).toBe(1000);
});
it("limits UTF-8 bytes and total modules", () => {
  expect(() => parse(" ".repeat(100001))).toThrow("byte");
  const s = initial();
  s.zones[0].modules = Array.from({ length: 101 }, (_, i) => ({
    id: "m" + i,
    productId: "base",
    variant: 0,
    finish: "oak",
  }));
  expect(() => parse(JSON.stringify(s))).toThrow("100 module");
});
