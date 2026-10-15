import { expect, test } from "@playwright/test";
import { SITE } from "../../config";
import { expectInsideViewportWidth, expectNoHorizontalScroll, openHome, setWidth } from "../../helpers/base.helper";

// Selector footer dari config
const FOOTER = SITE.selectors.footer;

// =====================================================================
// POSITIVE
// =====================================================================
test.describe("Footer - Positive", () => {
  test.beforeEach(async ({ page }) => {
    await openHome(page);
    await page.locator(FOOTER).scrollIntoViewIfNeeded();
  });

  test.describe("TCF-01 Verifikasi konten footer tampil lengkap", () => {
    for (const text of SITE.footer.texts) {
      test(`Teks "${text}"`, async ({ page }) => {
        await expect(page.locator(FOOTER)).toContainText(text);
      });
    }
  });

  test("TCF-02 Verifikasi tahun copyright sesuai tahun berjalan", async ({ page }) => {
    const currentYear = new Date().getFullYear();

    await expect(page.locator(FOOTER)).toContainText(`© ${currentYear} ${SITE.footer.copyrightName}`);
  });
});

// =====================================================================
// NEGATIVE
// =====================================================================
test.describe("Footer - Negative", () => {
  test("TCF-03 Verifikasi tidak ada link mati di footer", async ({ page }) => {
    await openHome(page);

    const footerLinks = page.locator(`${FOOTER} a[href]`);
    const totalLinks = await footerLinks.count();

    // Setiap link di footer tidak boleh mengarah ke halaman error / 404
    for (let i = 0; i < totalLinks; i++) {
      const href = await footerLinks.nth(i).getAttribute("href");
      const response = await page.request.get(new URL(href!, page.url()).toString());
      expect(response.status(), `Link mati: ${href}`).toBeLessThan(400);
    }
  });

  test("TCF-04 Verifikasi footer di layar 320px", async ({ page }) => {
    await setWidth(page, 320);
    await openHome(page);
    await page.locator(FOOTER).scrollIntoViewIfNeeded();

    await expectNoHorizontalScroll(page);
    await expectInsideViewportWidth(page, `${FOOTER} > *`);
  });
});
