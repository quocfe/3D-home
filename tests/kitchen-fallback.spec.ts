import { test, expect } from "@playwright/test";
test("3D failure never takes down the editable front elevation", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      type: any,
      ...args: any[]
    ) {
      if (String(type).includes("webgl")) return null;
      return original.apply(this, [type, ...args] as any);
    } as typeof original;
  });
  await page.goto("/");
  await page.getByRole("button", { name: "3D tổng thể", exact: true }).click();
  await expect(
    page.getByText(
      "Không mở được 3D. Anh vẫn có thể cấu hình bằng bản trực diện.",
      { exact: true },
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "Trực diện", exact: true }).click();
  await page
    .getByRole("button", { name: "Thêm Tủ kho cao", exact: true })
    .click();
  await expect(page.getByTestId("module-row")).toHaveCount(1);
});
