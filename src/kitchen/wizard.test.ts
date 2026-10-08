import { describe, expect, it } from "vitest";
import { initial } from "./domain";
import { stepBlocker } from "./wizard";

describe("wizard step gating", () => {
  it("blocks invalid dimensions with an actionable reason", () => {
    const kitchen = initial();
    kitchen.runs.A = 999;
    expect(stepBlocker(2, kitchen)).toBe(
      "Nhánh A cần dài từ 1.000 đến 10.000 mm.",
    );
  });

  it("requires valid dimensions on both runs for an L kitchen", () => {
    const kitchen = initial();
    kitchen.shape = "L";
    kitchen.runs.B = 10001;
    expect(stepBlocker(2, kitchen)).toBe(
      "Nhánh B cần dài từ 1.000 đến 10.000 mm.",
    );
  });

  it("blocks over-allocation but permits clearly reported unallocated length", () => {
    const kitchen = initial();
    kitchen.zones[0].width = 1300;
    expect(stepBlocker(3, kitchen)).toContain("vượt 100 mm");
    kitchen.zones[0].width = 600;
    expect(stepBlocker(3, kitchen)).toBe("");
  });

  it("requires at least one selected product before review", () => {
    const kitchen = initial();
    expect(stepBlocker(4, kitchen)).toBe(
      "Hãy thêm ít nhất một sản phẩm vào một khu trước khi xem kết quả.",
    );
    kitchen.zones[0].modules.push({
      id: "one",
      productId: "pantry",
      variant: 0,
      finish: "melamine",
    });
    expect(stepBlocker(4, kitchen)).toBe("");
  });
});
