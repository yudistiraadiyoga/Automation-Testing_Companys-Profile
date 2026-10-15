import { expect, test, type Page } from "@playwright/test";
import {
  blockResources,
  countBrokenImages,
  expectInsideViewportWidth,
  expectNoHorizontalScroll,
  openHome,
  scrollToSection,
  setWidth,
} from "../../../helpers/base.helper";

// Ambil nilai di kartu info perusahaan berdasarkan label, contoh: cardValue(page, "Date of Incorporation")
function cardValue(page: Page, label: string) {
  return page.locator(".company-card .card-item").filter({ hasText: label }).locator("span");
}

// =====================================================================
// POSITIVE
// =====================================================================
test.describe("About - Positive", () => {
  test.beforeEach(async ({ page }) => {
    await openHome(page);
    await scrollToSection(page, "about");
  });

  test("TCA-01 Verifikasi konten About dan nilai perusahaan tampil", async ({ page }) => {
    await expect(page.locator("#about .section-label")).toHaveText("Our Story");
    await expect(page.locator("#about .about-text")).toContainText("incorporated in Hong Kong in August 2023");

    await expect(page.locator(".value-label")).toHaveText(["Integrity", "Quality", "Partnership"]);
    await expect(page.locator(".value-icon")).toHaveCount(3);
  });

  test.describe("TCA-02 Verifikasi data legal perusahaan sesuai", () => {
    const dataUji = [
      { label: "Companies Registry No.", expected: "3305282" },
      { label: "Business Registration No.", expected: "75580592" },
      { label: "Date of Incorporation", expected: "03 August 2023" },
      { label: "Registered Jurisdiction", expected: "Hong Kong SAR, China" },
    ];

    for (const data of dataUji) {
      test(data.label, async ({ page }) => {
        await expect(cardValue(page, data.label)).toHaveText(data.expected);
      });
    }
  });

  test("TCA-03 Verifikasi konsistensi data legal di seluruh halaman", async ({ page }) => {
    // About
    await expect(cardValue(page, "Companies Registry No.")).toHaveText("3305282");
    await expect(cardValue(page, "Business Registration No.")).toHaveText("75580592");

    // Contact
    await expect(page.locator("#contact .contact-info")).toContainText("3305282 · 75580592");

    // Footer
    const footer = page.locator("footer .footer-legal");
    await expect(footer).toContainText("CR No. 3305282");
    await expect(footer).toContainText("BR No. 75580592");
    await expect(footer).toContainText("Incorporated 03 Aug 2023");
  });

  test("TCA-04 Verifikasi Business Scope tampil benar", async ({ page }) => {
    await expect(cardValue(page, "Business Scope")).toHaveText("Household Products · Consumer Goods · Import & Export");
  });
});

// =====================================================================
// NEGATIVE
// =====================================================================
test.describe("About - Negative", () => {
  test("TCA-05 Verifikasi kartu info perusahaan di layar 320px", async ({ page }) => {
    await setWidth(page, 320);
    await openHome(page);
    await scrollToSection(page, "about");

    await expectNoHorizontalScroll(page);
    await expectInsideViewportWidth(page, ".company-card .card-item span");
  });

  test("TCA-06 Verifikasi ikon nilai perusahaan saat gagal dimuat", async ({ page }) => {
    await blockResources(page, ["svg", "png", "jpg", "webp", "woff2"]);
    await openHome(page);
    await scrollToSection(page, "about");

    await expect(page.locator(".value-label")).toHaveText(["Integrity", "Quality", "Partnership"]);
    expect(await countBrokenImages(page), "Ada ikon gambar rusak").toBe(0);
  });

  test("TCA-07 Verifikasi teks legal dapat diseleksi dan disalin", async ({ page }) => {
    await openHome(page);
    await scrollToSection(page, "about");

    // Teks bisa diseleksi (user-select bukan "none")
    await expect(cardValue(page, "Companies Registry No.")).not.toHaveCSS("user-select", "none");

    // Isi teks persis, tanpa spasi/karakter tersembunyi
    expect(await cardValue(page, "Companies Registry No.").textContent()).toBe("3305282");
    expect(await cardValue(page, "Business Registration No.").textContent()).toBe("75580592");
  });
});
