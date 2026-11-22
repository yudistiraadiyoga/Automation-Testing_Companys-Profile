import { expect, test, type Page } from "@playwright/test";
import {
  expectInsideViewportWidth,
  expectNoHorizontalScroll,
  manualTest,
  openHome,
  scrollToSection,
  setWidth,
  waitForScrollEnd,
} from "../../../helpers/base.helper";

const REGIONS = ["Hong Kong", "Mainland China", "Southeast Asia", "Europe", "Americas", "Middle East"];
const STAT_NUMBERS = ["HK", "2+", "6+", "100%"];
const STAT_LABELS = ["Base of Operations", "Trade Directions", "Market Regions", "Compliance"];

// Pastikan angka statistik tampil di nilai akhir yang benar
async function expectFinalStats(page: Page) {
  await expect(page.locator(".stat-num")).toHaveText(STAT_NUMBERS);
}

// =====================================================================
// POSITIVE
// =====================================================================
test.describe("Global Trade - Positive", () => {
  test.beforeEach(async ({ page }) => {
    await openHome(page);
    await scrollToSection(page, "global");
  });

  test("TCG-01 Verifikasi daftar 6 region tampil", async ({ page }) => {
    await expect(page.locator(".region-tag")).toHaveText(REGIONS);
  });

  test("TCG-02 Verifikasi pemisah antar region", async ({ page }) => {
    // Setiap region adalah elemen terpisah (terbaca terpisah oleh screen reader)
    await expect(page.locator(".region-tag")).toHaveCount(6);

    // Region pertama dan kedua tidak menempel (ada jarak di antaranya)
    const firstRegion = await page.locator(".region-tag").nth(0).boundingBox();
    const secondRegion = await page.locator(".region-tag").nth(1).boundingBox();
    expect(secondRegion!.x, "Region menempel").toBeGreaterThan(firstRegion!.x + firstRegion!.width);
  });

  test("TCG-03 Verifikasi blok statistik tampil benar", async ({ page }) => {
    await expectFinalStats(page);
    await expect(page.locator(".stat-label")).toHaveText(STAT_LABELS);
    await expect(page.locator(".stat-desc")).toHaveCount(4);
  });

  test("TCG-04 Verifikasi animasi counter statistik", async ({ page }) => {
    await page.waitForTimeout(2500); // tunggu animasi counter (jika ada) selesai

    await expectFinalStats(page);
  });
});

// =====================================================================
// NEGATIVE
// =====================================================================
test.describe("Global Trade - Negative", () => {
  test("TCG-06 Verifikasi counter saat scroll cepat bolak-balik", async ({ page }) => {
    await openHome(page);

    // Scroll bolak-balik Global <-> Contact sebanyak 3 kali
    for (let i = 1; i <= 3; i++) {
      await page.locator("#contact").scrollIntoViewIfNeeded();
      await page.locator("#global").scrollIntoViewIfNeeded();
    }
    await waitForScrollEnd(page);
    await page.waitForTimeout(2500);

    await expectFinalStats(page);
  });

  test("TCG-07 Verifikasi statistik saat halaman di-refresh di section Global", async ({ page }) => {
    await openHome(page, "global");

    await page.reload();
    await page.waitForTimeout(2500);

    await expectFinalStats(page);
  });

  test("TCG-08 Verifikasi daftar region di layar 320px", async ({ page }) => {
    await setWidth(page, 320);
    await openHome(page);
    await scrollToSection(page, "global");

    await expectNoHorizontalScroll(page);
    await expectInsideViewportWidth(page, ".region-tag");
  });
});

test.describe("Global Trade - Reduce Motion aktif", () => {
  test.use({ reducedMotion: "reduce" });

  test("TCG-05 Verifikasi counter saat Reduce Motion aktif", async ({ page }) => {
    await openHome(page);
    await scrollToSection(page, "global");

    await expectFinalStats(page);
  });
});

manualTest("TCG-02 Verifikasi pembacaan region dengan screen reader", "perlu screen reader sungguhan");
