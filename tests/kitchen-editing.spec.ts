import { test, expect } from "@playwright/test";
test("multiple lower modules per zone, copies, variant edit, transfer and removal", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Chiều dài nhánh A").fill("4800");
  await page.getByLabel("Chiều dài nhánh A").press("Enter");
  await page.getByLabel("Rộng vùng Thực phẩm").fill("1200");
  await page.getByLabel("Rộng vùng Thực phẩm").press("Enter");
  await page
    .getByRole("button", { name: "Thêm Tủ dưới hai cánh", exact: true })
    .click();
  await page
    .getByRole("button", { name: "+ Thêm bản sao", exact: true })
    .click();
  await expect(page.getByTestId("module-row")).toHaveCount(2);
  await expect(page.getByTestId("quote-total")).toContainText("4.800.000");
  await page.getByLabel("Biến thể module").first().selectOption("1");
  await expect(page.locator(".checks")).toContainText(
    "tầng dưới/cao vượt 200 mm",
  );
  await page
    .getByRole("button", { name: "Xóa Tủ dưới hai cánh", exact: true })
    .last()
    .click();
  await page.getByLabel("Chuyển module sang vùng").selectOption("prep");
  await expect(page.getByTestId("module-row")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Chọn vùng Sơ chế", exact: true })
    .click();
  await expect(page.getByTestId("module-row")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Xóa Tủ dưới hai cánh", exact: true })
    .click();
  await expect(page.getByTestId("quote-total")).toContainText("0");
  await page.getByRole("button", { name: "Hoàn tác", exact: true }).click();
  await expect(page.getByTestId("module-row")).toHaveCount(1);
});
test("fully allocated kitchen yields a valid demo quote, not a construction quote", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Rộng vùng Sơ chế").fill("800");
  await page.getByLabel("Rộng vùng Sơ chế").press("Enter");
  await page.getByLabel("Chiều dài nhánh A").fill("3400");
  await page.getByLabel("Chiều dài nhánh A").press("Enter");
  for (const [zone, p, variant] of [
    ["Thực phẩm", "Tủ kho cao", "0"],
    ["Dụng cụ", "Tủ ba ngăn kéo", "0"],
    ["Rửa", "Tủ khoang chậu rửa", "1"],
    ["Sơ chế", "Tủ dưới hai cánh", "1"],
    ["Nấu", "Tủ khoang bếp", "0"],
  ]) {
    await page
      .getByRole("button", { name: `Chọn vùng ${zone}`, exact: true })
      .click();
    await page.getByLabel(`Biến thể ${p}`).selectOption(variant);
    await page.getByRole("button", { name: `Thêm ${p}`, exact: true }).click();
  }
  await expect(page.getByText("Đã phân bổ đủ", { exact: true })).toBeVisible();
  await expect(
    page.getByText("CẤU HÌNH HỢP LỆ · GIÁ DEMO", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".quote")).toContainText(
    "Không gồm thiết bị, chậu/vòi, mặt đá",
  );
});
test("import retains tall/upper conflict and removing upper repairs it", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Thêm Tủ kho cao", exact: true })
    .click();
  const snapshot = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("nep-kitchen-v1")!),
  );
  snapshot.zones[0].modules.push({
    id: "upper",
    productId: "wall",
    variant: 0,
    finish: "sage",
  });
  await page
    .getByLabel("Nhập JSON")
    .setInputFiles({
      name: "conflict.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(snapshot)),
    });
  await expect(page.getByTestId("module-row")).toHaveCount(2);
  await expect(page.locator(".checks")).toContainText(
    "tủ cao chặn vị trí tủ trên",
  );
  await page
    .getByRole("button", { name: "Xóa Tủ trên hai cánh", exact: true })
    .click();
  await expect(page.locator(".checks")).not.toContainText("chặn");
});
