import { test, expect } from "@playwright/test";
import fs from "node:fs";
test("configure kitchen, variants, quote, undo, export/import and reload", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Thiết kế bếp của anh" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Chữ L", exact: true }).click();
  await expect(
    page.getByText("Góc chết 650 × 650 mm", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Nhánh của Thực phẩm").selectOption("B");
  await page
    .getByRole("button", { name: "Chọn vùng Thực phẩm", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Thêm Tủ kho cao", exact: true })
    .click();
  await expect(page.getByTestId("module-row")).toHaveCount(1);
  await page.getByLabel("Vật liệu module").selectOption("oak");
  await expect(page.getByTestId("quote-total")).toContainText("7.650.000");
  await page
    .getByRole("button", { name: "Chọn vùng Sơ chế", exact: true })
    .click();
  await page.getByLabel("Biến thể Tủ ba ngăn kéo").selectOption("1");
  await page
    .getByRole("button", { name: "Thêm Tủ ba ngăn kéo", exact: true })
    .click();
  await expect(page.getByTestId("module-row")).toHaveCount(1);
  await page.getByRole("button", { name: "Hoàn tác", exact: true }).click();
  await expect(page.getByTestId("module-row")).toHaveCount(0);
  await page.getByRole("button", { name: "Làm lại", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Xuất JSON" }).click();
  const file = await (await download).path();
  const saved = JSON.parse(fs.readFileSync(file!, "utf8"));
  expect(saved.shape).toBe("L");
  expect(saved.zones.flatMap((z: any) => z.modules)).toHaveLength(2);
  await page.getByLabel("Nhập JSON").setInputFiles({
    name: "kitchen.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(saved)),
  });
  await expect(page.getByRole("status")).toContainText("Đã nhập");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Mặt đứng · nhánh B" }),
  ).toBeVisible();
  await expect(page.getByTestId("quote-total")).toContainText("12.150.000");
  await page.screenshot({
    path: "artifacts/kitchen-workspace.png",
    fullPage: true,
  });
});
