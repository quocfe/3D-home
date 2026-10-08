import { allocated, usable, type Kitchen } from "./domain";

export type WizardStep = 1 | 2 | 3 | 4 | 5;

export const stepBlocker = (step: WizardStep, kitchen: Kitchen): string => {
  if (step === 2) {
    const runs = kitchen.shape === "L" ? (["A", "B"] as const) : (["A"] as const);
    for (const run of runs) {
      if (kitchen.runs[run] < 1000 || kitchen.runs[run] > 10000)
        return `Nhánh ${run} cần dài từ 1.000 đến 10.000 mm.`;
    }
  }
  if (step === 3) {
    for (const run of ["A", "B"] as const) {
      if (run === "B" && kitchen.shape === "straight") continue;
      const overflow = allocated(kitchen, run) - usable(kitchen, run);
      if (overflow > 0)
        return `Nhánh ${run} đang phân vùng vượt ${overflow.toLocaleString("vi-VN")} mm. Hãy giảm chiều rộng hoặc chuyển khu sang nhánh khác.`;
    }
  }
  if (
    step === 4 &&
    !kitchen.zones.some((zone) => zone.modules.length > 0)
  )
    return "Hãy thêm ít nhất một sản phẩm vào một khu trước khi xem kết quả.";
  return "";
};
