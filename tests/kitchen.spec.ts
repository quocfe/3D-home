import { test, expect } from "@playwright/test";
import fs from "node:fs";
import { addProduct, next, openToProducts } from "./helpers";

test("configure kitchen, variants, quote, undo, export/import and reload", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Bếp nhà mình theo kiểu nào?" })).toBeVisible();
  await page.getByRole("button", { name: /Bếp chữ L/ }).click();
  await next(page);
  await expect(page.getByText("650 mm cho góc")).toBeVisible();
  await next(page);
  await page.getByRole("button", { name: "Chọn khu Thực phẩm" }).click();
  await page.getByLabel("Nhánh của Thực phẩm").selectOption("B");
  await next(page);
  await addProduct(page, "Tủ kho cao");
  await expect(page.getByTestId("module-row")).toHaveCount(1);
  await page.getByLabel("Vật liệu module").selectOption("oak");
  await page.getByRole("button", { name: "Chọn vùng Sơ chế", exact: true }).click();
  await page.getByLabel("Biến thể Tủ ba ngăn kéo").selectOption("1");
  await addProduct(page, "Tủ ba ngăn kéo");
  await expect(page.getByTestId("module-row")).toHaveCount(1);

  await page.locator(".utility-menu summary").click();
  await page.getByRole("button", { name: "Hoàn tác", exact: true }).click();
  await expect(page.getByTestId("module-row")).toHaveCount(0);
  await page.getByRole("button", { name: "Làm lại", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Xuất JSON" }).click();
  const file = await (await download).path();
  const saved = JSON.parse(fs.readFileSync(file!, "utf8"));
  expect(saved.shape).toBe("L");
  expect(saved.zones.flatMap((zone: any) => zone.modules)).toHaveLength(2);
  await page.getByLabel("Nhập JSON").setInputFiles({
    name: "kitchen.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(saved)),
  });
  await expect(page.getByRole("status")).toContainText("Đã nhập");
  await next(page);
  await expect(page.getByTestId("quote-total")).toContainText("12.150.000");

  await page.reload();
  await openToProducts(page);
  await next(page);
  await expect(page.getByRole("heading", { name: "Mặt trực diện · nhánh B" })).toBeVisible();
  await expect(page.getByTestId("quote-total")).toContainText("12.150.000");
  await page.screenshot({ path: "artifacts/wizard-desktop.png", fullPage: true });
});
