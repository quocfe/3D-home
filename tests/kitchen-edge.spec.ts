import { test, expect } from "@playwright/test";
import { addProduct, next, openStep, openToProducts } from "./helpers";

async function start(page: any) { await openToProducts(page); }

test("independent layers, invalid fit, tall collision and shrink retain contents", async ({ page }) => {
  await start(page);
  await addProduct(page, "Tủ kho cao");
  await expect(page.locator(".capacity")).toContainText("Trên trống 0 mm");
  await expect(page.getByRole("button", { name: "Thêm Tủ trên hai cánh vào khu", exact: true })).toBeDisabled();
  await expect(page.locator(".fit-note").filter({ hasText: "chặn" })).toBeVisible();
  await page.getByRole("button", { name: "Xóa Tủ kho cao", exact: true }).click();
  await addProduct(page, "Tủ dưới hai cánh");
  await addProduct(page, "Tủ trên hai cánh");
  await expect(page.getByTestId("module-row")).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Thêm Tủ dưới hai cánh vào khu", exact: true })).toBeDisabled();
  await openStep(page, "Phân khu");
  await page.getByRole("button", { name: "Chọn khu Thực phẩm" }).click();
  await page.getByLabel("Rộng vùng Thực phẩm").fill("400");
  await page.getByLabel("Rộng vùng Thực phẩm").press("Enter");
  await openStep(page, "Sản phẩm");
  await expect(page.getByTestId("module-row")).toHaveCount(2);
  await openStep(page, "Kích thước");
  await page.getByLabel("Chiều dài nhánh A").fill("1000");
  await page.getByLabel("Chiều dài nhánh A").press("Enter");
  await openStep(page, "Phân khu");
  await expect(page.getByText(/Nhánh A đang phân vùng vượt/)).toBeVisible();
  await openStep(page, "Sản phẩm");
  await expect(page.getByTestId("module-row")).toHaveCount(2);
  await page.locator(".utility-menu summary").click();
  await page.getByRole("button", { name: "Hoàn tác", exact: true }).click();
  await page.getByRole("button", { name: "Hoàn tác", exact: true }).click();
  await openStep(page, "Phân khu");
  await expect(page.getByLabel("Rộng vùng Thực phẩm")).toHaveValue("600");
});

test("L to straight retains hidden B modules, allows recovery and reordering", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Bếp chữ L/ }).click();
  await next(page);
  await next(page);
  await page.getByRole("button", { name: "Chọn khu Thực phẩm" }).click();
  await page.getByLabel("Nhánh của Thực phẩm").selectOption("B");
  await next(page);
  await addProduct(page, "Tủ kho cao");
  await openStep(page, "Kiểu bếp");
  await page.getByRole("button", { name: /Bếp thẳng/ }).click();
  await openStep(page, "Sản phẩm");
  await expect(page.getByTestId("module-row")).toHaveCount(1);
  await next(page);
  await expect(page.getByText(/Nhánh B không hoạt động/)).toBeVisible();
  await openStep(page, "Kiểu bếp");
  await page.getByRole("button", { name: /Bếp chữ L/ }).click();
  await openStep(page, "Phân khu");
  await page.getByRole("button", { name: "Chọn khu Thực phẩm" }).click();
  await page.getByLabel("Nhánh của Thực phẩm").selectOption("A");
  await page.getByRole("button", { name: "Đưa Thực phẩm xuống", exact: true }).click();
  const zones = await page.locator(".zone-main strong").allTextContents();
  expect(zones[1]).toBe("Thực phẩm");
});

test("unknown import is atomic, rejects supplied prices and warns about catalog version", async ({ page }) => {
  await start(page);
  await addProduct(page, "Tủ kho cao");
  const snapshot = await page.evaluate(() => localStorage.getItem("nep-kitchen-v1"));
  const bad = JSON.parse(snapshot!);
  bad.zones[0].modules[0].productId = "unknown";
  await page.getByLabel("Nhập JSON").setInputFiles({ name: "bad.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(bad)) });
  await expect(page.getByRole("status")).toContainText("không có trong danh mục");
  expect(await page.evaluate(() => localStorage.getItem("nep-kitchen-v1"))).toBe(snapshot);
  const forged = JSON.parse(snapshot!);
  forged.zones[0].modules[0].price = 1;
  await page.getByLabel("Nhập JSON").setInputFiles({ name: "price.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(forged)) });
  await expect(page.getByRole("status")).toContainText("trường lạ");
  expect(await page.evaluate(() => localStorage.getItem("nep-kitchen-v1"))).toBe(snapshot);
  const old = JSON.parse(snapshot!);
  old.catalogVersion = "old";
  await page.getByLabel("Nhập JSON").setInputFiles({ name: "old.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(old)) });
  await expect(page.getByRole("status")).toContainText("tính lại");
  await next(page);
  await expect(page.getByTestId("quote-total")).toContainText("7.200.000");
});

test("unknown catalog price is incomplete, not zero; old room data is untouched", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("nep-layout-v1", "old-room-data"));
  await start(page);
  await page.getByRole("button", { name: "Chọn vùng Dụng cụ", exact: true }).click();
  await addProduct(page, "Tủ trên kính mẫu");
  await next(page);
  await expect(page.getByText("Tổng chưa đầy đủ: có module chưa có giá, không được xem là 0 ₫.")).toBeVisible();
  await expect(page.getByText("Tạm cộng phần đã có giá", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("nep-layout-v1"))).toBe("old-room-data");
});

test("save errors remain honest and mobile layout fits viewport", async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw Error("quota"); }; });
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page);
  await addProduct(page, "Tủ kho cao");
  await expect(page.getByRole("alert")).toContainText("Không thể tự lưu");
  await page.getByRole("button", { name: "Đóng thông báo" }).click();
  await expect(page.getByText("Chưa lưu an toàn", { exact: true })).toBeAttached();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "artifacts/wizard-products-mobile.png", fullPage: true });
});

test("renders L kitchen in WebGL and desktop has no uncaught errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error: Error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("button", { name: /Bếp chữ L/ }).click();
  await next(page);
  await next(page);
  await page.getByRole("button", { name: "Chọn khu Thực phẩm" }).click();
  await page.getByLabel("Nhánh của Thực phẩm").selectOption("B");
  await page.getByRole("button", { name: "Chọn khu Rửa" }).click();
  await page.getByLabel("Nhánh của Rửa").selectOption("B");
  await next(page);
  await page.getByRole("button", { name: "Chọn vùng Thực phẩm", exact: true }).click();
  await addProduct(page, "Tủ kho cao");
  for (const [zone, product] of [["Dụng cụ", "Tủ ba ngăn kéo"], ["Rửa", "Tủ khoang chậu rửa"], ["Sơ chế", "Tủ dưới hai cánh"], ["Nấu", "Tủ khoang bếp"]]) {
    await page.getByRole("button", { name: `Chọn vùng ${zone}`, exact: true }).click();
    if (["Rửa", "Sơ chế"].includes(zone)) await page.getByLabel(`Biến thể ${product}`).selectOption("1");
    await addProduct(page, product);
    await page.getByLabel("Vật liệu Tủ trên hai cánh").selectOption("sage");
    if (zone === "Rửa") await page.getByLabel("Biến thể Tủ trên hai cánh").selectOption("1");
    await addProduct(page, "Tủ trên hai cánh");
  }
  await next(page);
  await page.getByRole("button", { name: "3D tổng thể", exact: true }).click();
  await expect(page.locator("canvas")).toBeVisible();
  await page.waitForFunction(() => { const canvas = document.querySelector("canvas"); return canvas && canvas.width > 0; });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "artifacts/wizard-review-3d.png", fullPage: true });
  await page.getByRole("button", { name: "Trực diện", exact: true }).click();
  await page.screenshot({ path: "artifacts/wizard-review-desktop.png", fullPage: true });
  expect(errors).toEqual([]);
});
