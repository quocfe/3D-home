import { test, expect, type Page } from "@playwright/test";
async function point(page: Page, x: number, z: number) {
  const b = await page.locator("canvas").boundingBox();
  if (!b) throw Error("canvas missing");
  const length = Number(
      await page
        .getByRole("spinbutton", { name: "Chiều dài", exact: true })
        .inputValue(),
    ),
    width = Number(
      await page
        .getByRole("spinbutton", { name: "Chiều rộng", exact: true })
        .inputValue(),
    );
  const zoom = Math.min(b.width / (length + 2), b.height / (width + 2));
  return { x: b.x + b.width / 2 + x * zoom, y: b.y + b.height / 2 + z * zoom };
}
async function saved(page: Page) {
  return page.evaluate(() =>
    JSON.parse(localStorage.getItem("nep-layout-v1") || "null"),
  );
}
async function move(
  page: Page,
  from: [number, number],
  to: [number, number],
  finish = true,
) {
  const a = await point(page, ...from),
    b = await point(page, ...to);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(b.x, b.y, { steps: 10 });
  if (finish) await page.mouse.up();
}
test("drag is transactional; invalid drop, Escape, blur, pointercancel and leaving canvas restore orbit", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Mặt bằng", exact: true }).click();
  await move(page, [0.45, -0.2], [0.65, 1.3]);
  await expect(page.getByTestId("z-value")).toHaveText("1,3");
  expect(
    (await saved(page)).items.find((i: any) => i.id === "sample-chair").z,
  ).toBeCloseTo(1.3);
  await expect(page.getByTestId("scene")).toHaveAttribute(
    "data-orbit-locked",
    "false",
  );
  await page.getByRole("button", { name: "Hoàn tác", exact: true }).click();
  expect(
    (await saved(page)).items.find((i: any) => i.id === "sample-chair").z,
  ).toBe(-0.2);
  await page.getByRole("button", { name: "Làm lại", exact: true }).click();
  await move(page, [0.65, 1.3], [0.65, 2.45]);
  await expect(page.getByTestId("z-value")).toHaveText("1,3");
  await expect(page.getByRole("alert")).toContainText("Không hợp lệ");
  await page.getByRole("button", { name: "Đóng thông báo" }).click();
  for (const cancel of [
    "Escape",
    "blur",
    "pointercancel",
    "lostcapture",
    "outside",
  ]) {
    await move(page, [0.65, 1.3], [1.4, 1.4], false);
    await expect(page.getByTestId("scene")).toHaveAttribute(
      "data-orbit-locked",
      "true",
    );
    if (cancel === "Escape") await page.keyboard.press("Escape");
    if (cancel === "blur")
      await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    if (cancel === "pointercancel")
      await page
        .locator("canvas")
        .dispatchEvent("pointercancel", { pointerId: 1 });
    if (cancel === "lostcapture")
      await page
        .locator("canvas")
        .evaluate((el) => (el as HTMLCanvasElement).releasePointerCapture(1));
    if (cancel === "outside") await page.mouse.move(30, 30);
    await page.mouse.up();
    await expect(page.getByTestId("scene")).toHaveAttribute(
      "data-orbit-locked",
      "false",
    );
    await expect(page.getByTestId("z-value")).toHaveText("1,3");
  }
  // Tiny movement is selection, never a new history entry.
  const tiny = await point(page, 0.65, 1.3);
  await page.mouse.move(tiny.x, tiny.y);
  await page.mouse.down();
  await page.mouse.move(tiny.x + 2, tiny.y + 1);
  await page.mouse.up();
  await expect(page.getByTestId("z-value")).toHaveText("1,3");
  await page.getByRole("button", { name: "Hoàn tác", exact: true }).click();
  expect(
    (await saved(page)).items.find((i: any) => i.id === "sample-chair").z,
  ).toBe(-0.2);
  const before = await page.locator("canvas").screenshot();
  const box = await page.locator("canvas").boundingBox();
  await page.mouse.move(box!.x + box!.width * 0.8, box!.y + box!.height * 0.8);
  await page.mouse.down({ button: "right" });
  await page.mouse.move(
    box!.x + box!.width * 0.65,
    box!.y + box!.height * 0.7,
    { steps: 10 },
  );
  await page.mouse.up({ button: "right" });
  expect(before.equals(await page.locator("canvas").screenshot())).toBe(false);
});
test("room shrink preserves invalid objects; moving repairs them; rotation rejects corners", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Mặt bằng", exact: true }).click();
  await page
    .getByRole("spinbutton", { name: "Chiều dài", exact: true })
    .fill("3");
  await page.getByRole("button", { name: "Áp dụng kích thước" }).click();
  await expect(page.getByRole("status")).toContainText("đồ vật vượt biên");
  const before = await saved(page);
  expect(before.items.find((i: any) => i.id === "sample-sofa").x).toBe(-1.35);
  await move(page, [-1.35, -1.65], [0, 1.3]);
  expect(
    (await saved(page)).items.find((i: any) => i.id === "sample-sofa").x,
  ).toBeCloseTo(0);
  await page
    .getByRole("spinbutton", { name: "Chiều rộng", exact: true })
    .fill("1");
  await page.getByRole("button", { name: "Áp dụng kích thước" }).click();
  // Import an exact edge case, then exercise real rotate controls.
  const layout = {
    version: 1,
    room: { length: 2.4, width: 1, height: 2.8 },
    items: [{ id: "edge", catalogId: "sofa", x: 0, z: 0, angle: 0 }],
  };
  await page
    .getByLabel("Nhập tệp JSON")
    .setInputFiles({
      name: "edge.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(layout)),
    });
  await clickFloor(page, 0, 0);
  await page.getByRole("button", { name: "Xoay +15°", exact: true }).click();
  await expect(page.getByTestId("angle-value")).toHaveText("0°");
  await expect(page.getByRole("alert")).toContainText("Không hợp lệ");
  expect((await saved(page)).items[0].angle).toBe(0);
});
test("oversize and height rejection, rotation-aware placement, Escape cancels preview", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Mặt bằng", exact: true }).click();
  const layout = {
    version: 1,
    room: { length: 1, width: 3, height: 2.8 },
    items: [],
  };
  await page
    .getByLabel("Nhập tệp JSON")
    .setInputFiles({
      name: "empty.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(layout)),
    });
  await page.getByTestId("catalog-sofa").click();
  await expect(page.getByTestId("placement-banner")).toContainText("Nhấp sàn");
  await clickFloor(page, 0, 0);
  await expect(page.getByTestId("item-count")).toHaveText("1 đồ vật");
  expect((await saved(page)).items[0].angle).toBeGreaterThan(1);
  await page.getByTestId("catalog-bed").click();
  await expect(page.getByRole("alert")).toContainText("kể cả khi xoay");
  await expect(page.getByTestId("placement-banner")).toBeHidden();
  await page
    .getByRole("spinbutton", { name: "Chiều cao", exact: true })
    .fill("0.5");
  await page.getByRole("button", { name: "Áp dụng kích thước" }).click();
  await page.getByTestId("catalog-wardrobe").click();
  await expect(page.getByRole("alert")).toContainText("cao hơn trần");
  await page.getByTestId("catalog-coffee").click();
  await expect(page.getByTestId("placement-banner")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("placement-banner")).toBeHidden();
  await expect(page.getByTestId("item-count")).toHaveText("1 đồ vật");
});
test("invalid imports are atomic; JSON export round trip; file size limit", async ({
  page,
}) => {
  await page.goto("/");
  const layout = {
    version: 1,
    room: { length: 6, width: 5, height: 2.8 },
    items: [{ id: "a", catalogId: "bed", x: 0, z: 0, angle: 0 }],
  };
  const upload = async (value: any) =>
    page
      .getByLabel("Nhập tệp JSON")
      .setInputFiles({
        name: "layout.json",
        mimeType: "application/json",
        buffer: Buffer.from(
          typeof value === "string" ? value : JSON.stringify(value),
        ),
      });
  await upload(layout);
  await expect(page.getByTestId("item-count")).toHaveText("1 đồ vật");
  for (const bad of [
    { ...layout, version: 9 },
    { ...layout, items: [{ ...layout.items[0], catalogId: "remote" }] },
    { ...layout, items: [layout.items[0], layout.items[0]] },
    "{bad",
    " ".repeat(100001),
  ]) {
    await upload(bad);
    await expect(page.getByRole("alert")).toBeVisible();
    expect(await saved(page)).toEqual(layout);
  }
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Xuất bản vẽ" }).click();
  const download = await downloadPromise;
  const file = await download.path();
  const fs = await import("node:fs/promises");
  expect(JSON.parse(await fs.readFile(file!, "utf8"))).toEqual(layout);
  await page.reload();
  await expect(page.getByTestId("item-count")).toHaveText("1 đồ vật");
});
test("storage failures are surfaced without losing the live layout", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = function () {
      throw new DOMException("Quota", "QuotaExceededError");
    };
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Mặt bằng", exact: true }).click();
  await page.getByTestId("catalog-chair").click();
  await clickFloor(page, 0, 1.5);
  await expect(page.getByTestId("item-count")).toHaveText("6 đồ vật");
  await expect(page.getByRole("alert")).toContainText("Không thể tự lưu");
  await expect(page.getByText("● Chưa lưu")).toBeVisible();
  await page.getByRole("button", { name: "Đóng thông báo" }).click();
  await expect(page.getByRole("alert")).toBeHidden();
  await expect(page.getByText("● Chưa lưu")).toBeVisible();
});
test("20-item scene benchmark, perspective orbit after cancel, responsive layout", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  const ids = ["sofa", "coffee", "chair", "desk", "bed", "wardrobe", "shelf"];
  const layout = {
    version: 1,
    room: { length: 10, width: 8, height: 2.8 },
    items: Array.from({ length: 20 }, (_, i) => ({
      id: "perf-" + i,
      catalogId: ids[i % 7],
      x: ((i % 5) - 2) * 1.8,
      z: (Math.floor(i / 5) - 1.5) * 1.7,
      angle: 0,
    })),
  };
  await page
    .getByLabel("Nhập tệp JSON")
    .setInputFiles({
      name: "20-items.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(layout)),
    });
  await expect(page.getByTestId("item-count")).toHaveText("20 đồ vật");
  // Wait for actual rendered frames (not a made-up FPS target).
  const result = await page.evaluate(async () => {
    const canvas = document.querySelector("canvas")!,
      gl = canvas.getContext("webgl2")!;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = ext
      ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
      : gl.getParameter(gl.RENDERER);
    await new Promise<void>((resolve) => {
      let n = 0;
      function warm() {
        if (++n === 20) resolve();
        else requestAnimationFrame(warm);
      }
      requestAnimationFrame(warm);
    });
    const times: number[] = [];
    await new Promise<void>((resolve) => {
      let prev = performance.now(),
        start = prev;
      function tick(now: number) {
        times.push(now - prev);
        prev = now;
        if (now - start >= 3000) resolve();
        else requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
    const total = times.reduce((a, b) => a + b, 0);
    return {
      objects: 20,
      frames: times.length,
      durationMs: total,
      averageFps: (1000 * times.length) / total,
      p95FrameMs: times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)],
      renderer,
      viewport: { width: innerWidth, height: innerHeight },
      dpr: devicePixelRatio,
    };
  });
  const fs = await import("node:fs/promises");
  await fs.mkdir("artifacts", { recursive: true });
  await fs.writeFile(
    "artifacts/performance.json",
    JSON.stringify(result, null, 2),
  );
  expect(result.frames).toBeGreaterThan(0);
  await page.screenshot({ path: "artifacts/20-items.png", fullPage: true });
  await page.getByTestId("catalog-chair").click();
  await page.keyboard.press("Escape");
  const before = await page.locator("canvas").screenshot();
  const b = await page.locator("canvas").boundingBox();
  await page.mouse.move(b!.x + b!.width * 0.8, b!.y + b!.height * 0.85);
  await page.mouse.down();
  await page.mouse.move(b!.x + b!.width * 0.55, b!.y + b!.height * 0.75, {
    steps: 10,
  });
  await page.mouse.up();
  const after = await page.locator("canvas").screenshot();
  expect(before.equals(after)).toBe(false);
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(
    page.getByRole("button", { name: "Mặt bằng", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "artifacts/responsive.png", fullPage: true });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
async function clickFloor(page: Page, x: number, z: number) {
  const p = await point(page, x, z);
  await page.mouse.click(p.x, p.y);
}
test("one-shot placement, furniture event isolation, selection, rotation, deletion, history and reload", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Không gian của bạn" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Mặt bằng", exact: true }).click();
  await expect(page.getByTestId("item-count")).toHaveText("5 đồ vật");
  await page.getByTestId("catalog-chair").click();
  await expect(page.getByTestId("placement-banner")).toBeVisible();
  // A center on the floor is insufficient: the full footprint must fit.
  await clickFloor(page, 2.9, 2.4);
  await expect(page.getByTestId("item-count")).toHaveText("5 đồ vật");
  await expect(page.getByTestId("placement-banner")).toBeVisible();
  // Clicking existing sofa must not place through it.
  await clickFloor(page, -1.35, -1.65);
  await expect(page.getByTestId("item-count")).toHaveText("5 đồ vật");
  await clickFloor(page, 0, 1.5);
  await expect(page.getByTestId("item-count")).toHaveText("6 đồ vật");
  await expect(page.getByTestId("placement-banner")).toBeHidden();
  await clickFloor(page, 1, 1.5);
  await expect(page.getByTestId("item-count")).toHaveText("6 đồ vật");
  await clickFloor(page, 0, 1.5);
  await page.getByRole("button", { name: "Xoay +15°", exact: true }).click();
  await expect(page.getByTestId("angle-value")).toContainText("15");
  await page.screenshot({ path: "artifacts/top-view.png", fullPage: true });
  await page.getByRole("button", { name: "Xóa đồ vật", exact: true }).click();
  await expect(page.getByTestId("item-count")).toHaveText("5 đồ vật");
  await page.getByRole("button", { name: "Hoàn tác", exact: true }).click();
  await expect(page.getByTestId("item-count")).toHaveText("6 đồ vật");
  await page.reload();
  await expect(page.getByTestId("item-count")).toHaveText("6 đồ vật");
  expect(errors).toEqual([]);
  await page
    .locator(".object-list button")
    .filter({ hasText: "Sofa Mây" })
    .click();
  await page.screenshot({ path: "artifacts/workspace.png", fullPage: true });
});
