import { test, expect } from "@playwright/test";
async function start(page: any) {
  await page.goto("/");
}
test("independent layers, invalid fit, tall collision and shrink retain contents", async ({
  page,
}) => {
  await start(page);
  await page
    .getByRole("button", { name: "Thêm Tủ kho cao", exact: true })
    .click();
  await expect(page.locator(".capacity")).toContainText("Trên trống 0 mm");
  await expect(
    page.getByRole("button", { name: "Thêm Tủ trên hai cánh", exact: true }),
  ).toBeDisabled();
  await expect(
    page.locator(".fit-note").filter({ hasText: "chặn" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Xóa Tủ kho cao", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Thêm Tủ dưới hai cánh", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Thêm Tủ trên hai cánh", exact: true })
    .click();
  await expect(page.getByTestId("module-row")).toHaveCount(2);
  await expect(
    page.getByRole("button", { name: "Thêm Tủ dưới hai cánh", exact: true }),
  ).toBeDisabled();
  await page.getByLabel("Rộng vùng Thực phẩm").fill("400");
  await page.getByLabel("Rộng vùng Thực phẩm").press("Enter");
  await expect(page.getByTestId("module-row")).toHaveCount(2);
  await expect(
    page
      .locator(".checks")
      .getByText("Thực phẩm: tầng dưới/cao vượt 200 mm.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Chiều dài nhánh A").fill("1000");
  await page.getByLabel("Chiều dài nhánh A").press("Enter");
  await expect(page.getByText(/Nhánh A: vùng vượt/)).toBeVisible();
  await expect(page.getByTestId("module-row")).toHaveCount(2);
  await page.getByRole("button", { name: "Hoàn tác", exact: true }).click();
  await expect(page.getByLabel("Chiều dài nhánh A")).toHaveValue("4200");
  await page.getByRole("button", { name: "Hoàn tác", exact: true }).click();
  await expect(page.getByLabel("Rộng vùng Thực phẩm")).toHaveValue("600");
  await expect(page.locator(".checks")).not.toContainText("vượt");
});
test("L to straight retains hidden B modules, allows recovery and reordering", async ({
  page,
}) => {
  await start(page);
  await page.getByRole("button", { name: "Chữ L", exact: true }).click();
  await page.getByLabel("Nhánh của Thực phẩm").selectOption("B");
  await page
    .getByRole("button", { name: "Thêm Tủ kho cao", exact: true })
    .click();
  await page.getByRole("button", { name: "Thẳng", exact: true }).click();
  await expect(page.getByTestId("module-row")).toHaveCount(1);
  await expect(page.getByText(/Nhánh B không hoạt động/)).toBeVisible();
  await page.getByLabel("Nhánh của Thực phẩm").selectOption("A");
  await expect(page.getByTestId("module-row")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Đưa Thực phẩm xuống", exact: true })
    .click();
  const zones = await page.locator(".zone-select strong").allTextContents();
  expect(zones[1]).toBe("Thực phẩm");
  await expect(page.locator(".checks")).not.toContainText("vượt");
});
test("unknown import is atomic, rejects supplied prices and warns about catalog version", async ({
  page,
}) => {
  await start(page);
  await page
    .getByRole("button", { name: "Thêm Tủ kho cao", exact: true })
    .click();
  const snapshot = await page.evaluate(() =>
    localStorage.getItem("nep-kitchen-v1"),
  );
  const bad = JSON.parse(snapshot!);
  bad.zones[0].modules[0].productId = "unknown";
  await page.getByLabel("Nhập JSON").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(bad)),
  });
  await expect(page.getByRole("status")).toContainText(
    "không có trong danh mục",
  );
  expect(
    await page.evaluate(() => localStorage.getItem("nep-kitchen-v1")),
  ).toBe(snapshot);
  const forged = JSON.parse(snapshot!);
  forged.zones[0].modules[0].price = 1;
  await page.getByLabel("Nhập JSON").setInputFiles({
    name: "price.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(forged)),
  });
  await expect(page.getByRole("status")).toContainText("trường lạ");
  expect(
    await page.evaluate(() => localStorage.getItem("nep-kitchen-v1")),
  ).toBe(snapshot);
  const old = JSON.parse(snapshot!);
  old.catalogVersion = "old";
  await page.getByLabel("Nhập JSON").setInputFiles({
    name: "old.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(old)),
  });
  await expect(page.getByRole("status")).toContainText("tính lại");
  await expect(page.getByTestId("quote-total")).toContainText("7.200.000");
});
test("unknown catalog price is incomplete, not zero; old room data is untouched", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("nep-layout-v1", "old-room-data"),
  );
  await start(page);
  await page
    .getByRole("button", { name: "Chọn vùng Dụng cụ", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Thêm Tủ trên kính mẫu", exact: true })
    .click();
  await expect(
    page.getByText(
      "Tổng chưa đầy đủ: có module chưa có giá, không được xem là 0 ₫.",
    ),
  ).toBeVisible();
  await expect(
    page.getByText("Tạm cộng phần đã có giá", { exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("nep-layout-v1"))).toBe(
    "old-room-data",
  );
});
test("save errors remain honest and mobile layout fits viewport", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw Error("quota");
    };
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page);
  await page
    .getByRole("button", { name: "Thêm Tủ kho cao", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Không thể tự lưu");
  await page.getByRole("button", { name: "Đóng thông báo" }).click();
  await expect(
    page.getByText("Chưa lưu an toàn", { exact: true }),
  ).toBeAttached();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/kitchen-mobile.png",
    fullPage: true,
  });
});
test("renders L kitchen in WebGL and desktop has no uncaught errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page);
  await page.getByRole("button", { name: "Chữ L", exact: true }).click();
  await page.getByLabel("Nhánh của Thực phẩm").selectOption("B");
  await page.getByLabel("Nhánh của Rửa").selectOption("B");
  await page
    .getByRole("button", { name: "Chọn vùng Thực phẩm", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Thêm Tủ kho cao", exact: true })
    .click();
  for (const [zone, p] of [
    ["Dụng cụ", "Tủ ba ngăn kéo"],
    ["Rửa", "Tủ khoang chậu rửa"],
    ["Sơ chế", "Tủ dưới hai cánh"],
    ["Nấu", "Tủ khoang bếp"],
  ]) {
    await page
      .getByRole("button", { name: `Chọn vùng ${zone}`, exact: true })
      .click();
    if (["Rửa", "Sơ chế"].includes(zone))
      await page.getByLabel(`Biến thể ${p}`).selectOption("1");
    await page.getByRole("button", { name: `Thêm ${p}`, exact: true }).click();
    await page.getByLabel(`Vật liệu Tủ trên hai cánh`).selectOption("sage");
    if (zone === "Rửa")
      await page.getByLabel("Biến thể Tủ trên hai cánh").selectOption("1");
    await page
      .getByRole("button", { name: "Thêm Tủ trên hai cánh", exact: true })
      .click();
  }
  await page.getByRole("button", { name: "3D tổng thể", exact: true }).click();
  await expect(page.locator("canvas")).toBeVisible();
  await page.waitForFunction(() => {
    const c = document.querySelector("canvas");
    return c && c.width > 0;
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: "artifacts/kitchen-3d.png", fullPage: true });
  await page
    .locator(".visual-panel")
    .screenshot({ path: "artifacts/kitchen-3d-detail.png" });
  await page.getByRole("button", { name: "Trực diện", exact: true }).click();
  await page.getByRole("button", { name: /Nhánh A.*hữu dụng/ }).click();
  await page.screenshot({ path: "artifacts/kitchen-full.png", fullPage: true });
  expect(errors).toEqual([]);
});
