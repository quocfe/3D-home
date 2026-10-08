import { test, expect } from "@playwright/test";
import { addProduct, next, openStep, openToProducts } from "./helpers";

test("3D failure never takes down the editable product flow and elevation", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type: any, ...args: any[]) {
      if (String(type).includes("webgl")) return null;
      return original.apply(this, [type, ...args] as any);
    } as typeof original;
  });
  await openToProducts(page);
  await addProduct(page, "Tủ kho cao");
  await next(page);
  await page.getByRole("button", { name: "3D tổng thể", exact: true }).click();
  await expect(page.getByText("Không mở được 3D. Anh vẫn có thể cấu hình bằng bản trực diện.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Trực diện", exact: true }).click();
  await expect(page.locator(".elevation")).toBeVisible();
  await openStep(page, "Sản phẩm");
  await expect(page.getByTestId("module-row")).toHaveCount(1);
});
