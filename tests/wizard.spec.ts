import { expect, test } from "@playwright/test";

const continueButton = (page: any) =>
  page.getByRole("button", { name: "Tiếp tục", exact: true });

test("complete wizard shape to product variant and review quote", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Bước 1 / 5", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Trực diện" })).toHaveCount(0);

  await page.getByRole("button", { name: /Bếp chữ L/ }).click();
  await continueButton(page).click();
  await expect(page.getByText("Bước 2 / 5", { exact: true })).toBeVisible();
  await page.getByLabel("Chiều dài nhánh A").fill("4250");
  await page.getByLabel("Chiều dài nhánh A").press("Enter");
  await page.getByLabel("Chiều dài nhánh B").fill("3000");
  await page.getByLabel("Chiều dài nhánh B").press("Enter");
  await continueButton(page).click();

  await expect(page.getByText("Bước 3 / 5", { exact: true })).toBeVisible();
  await expect(page.getByText("Chưa phân bổ 0 mm", { exact: true })).toBeVisible();
  await expect(page.getByText("Chưa phân bổ 2.350 mm", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Chọn khu Sơ chế" }).click();
  await expect(page.getByText("Khu đang chỉnh: Sơ chế", { exact: true })).toBeVisible();
  await continueButton(page).click();

  await expect(page.getByRole("heading", { name: "Đang chọn sản phẩm cho Khu Sơ chế", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Trực diện" })).toHaveCount(0);
  await page.getByLabel("Biến thể Tủ ba ngăn kéo").selectOption("1");
  await page.getByRole("button", { name: "Thêm Tủ ba ngăn kéo vào khu" }).click();
  await expect(page.getByTestId("module-row")).toHaveCount(1);
  await expect(continueButton(page)).toBeEnabled();
  await continueButton(page).click();

  await expect(page.getByText("Bước 5 / 5", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Trực diện" })).toBeVisible();
  await expect(page.getByRole("button", { name: "3D tổng thể" })).toBeVisible();
  await expect(page.getByTestId("quote-total")).toContainText("4.500.000");
  await expect(page.locator(".quote")).toContainText("Không gồm thiết bị");
});

test("wizard blocks invalid steps and Back preserves entered data", async ({ page }) => {
  await page.goto("/");
  await continueButton(page).click();
  await page.getByLabel("Chiều dài nhánh A").fill("999");
  await page.getByLabel("Chiều dài nhánh A").press("Enter");
  await expect(continueButton(page)).toBeDisabled();
  await expect(page.getByText("Nhánh A cần dài từ 1.000 đến 10.000 mm.")).toBeVisible();
  await page.getByLabel("Chiều dài nhánh A").fill("4200");
  await page.getByLabel("Chiều dài nhánh A").press("Enter");
  await continueButton(page).click();
  await page.getByRole("button", { name: "Quay lại" }).click();
  await expect(page.getByLabel("Chiều dài nhánh A")).toHaveValue("4200");
  await page.getByRole("button", { name: "Quay lại" }).click();
  await expect(page.getByRole("button", { name: /Bếp thẳng/ })).toHaveAttribute("aria-pressed", "true");
});

test("390px wizard has no horizontal page overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  for (let step = 1; step <= 3; step += 1) {
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await continueButton(page).click();
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "artifacts/wizard-mobile.png", fullPage: true });
});
