import type { Page } from "@playwright/test";

export const next = (page: Page) =>
  page.getByRole("button", { name: "Tiếp tục", exact: true }).click();

export async function openToProducts(page: Page) {
  await page.goto("/");
  await next(page);
  await next(page);
  await next(page);
}

export const openStep = (page: Page, name: "Kiểu bếp" | "Kích thước" | "Phân khu" | "Sản phẩm" | "Kết quả") =>
  page.getByRole("button", { name: new RegExp(name) }).click();

export const addProduct = (page: Page, name: string) =>
  page.getByRole("button", { name: `Thêm ${name} vào khu`, exact: true }).click();
