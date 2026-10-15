import { expect, test } from "@playwright/test";
import { SITE } from "../../config";
import {
  HERO_ID,
  blockResources,
  countBrokenImages,
  expectSectionInView,
  openHome,
  waitForScrollEnd,
} from "../../helpers/base.helper";

// Section hero dan tombol-tombolnya (dari config)
const hero = SITE.hero;
const firstButton = hero.buttons[0];

// =====================================================================
// POSITIVE
// =====================================================================
test.describe("Hero - Positive", () => {
  test.beforeEach(async ({ page }) => {
    await openHome(page);
  });

  test.describe("TCH-01 Verifikasi konten Hero tampil lengkap", () => {
    for (const text of hero.texts) {
      test(`Teks "${text}"`, async ({ page }) => {
        await expect(page.locator(`#${HERO_ID}`)).toContainText(text);
      });
    }
  });

  test.describe("TCH-02 & TCH-03 Verifikasi tombol CTA Hero mengarah ke section", () => {
    for (const button of hero.buttons) {
      test(`Tombol ${button.name}`, async ({ page }) => {
        await page.locator(`#${HERO_ID}`).getByRole("link", { name: button.name }).click();
        await waitForScrollEnd(page);

        await expectSectionInView(page, button.target);
      });
    }
  });

  test("TCH-04 Verifikasi indikator Scroll tampil", async ({ page }) => {
    test.skip(!hero.scrollHint, "Website ini tidak punya indikator scroll");

    await expect(page.locator(hero.scrollHint!)).toBeVisible();
  });

  test("TCH-05 Verifikasi title tab browser tampil benar", async ({ page }) => {
    await expect(page).toHaveTitle(SITE.pageTitle);
  });
});

// =====================================================================
// NEGATIVE
// =====================================================================
test.describe("Hero - Negative", () => {
  test("TCH-06 Verifikasi Hero saat font dan gambar gagal dimuat", async ({ page }) => {
    await blockResources(page, ["woff2", "jpg", "png", "webp"]);
    await openHome(page);

    for (const text of hero.texts) {
      await expect(page.locator(`#${HERO_ID}`)).toContainText(text);
    }
    expect(await countBrokenImages(page), "Ada ikon gambar rusak").toBe(0);
  });

  test("TCH-08 Verifikasi double click pada tombol CTA Hero", async ({ page, context }) => {
    for (const button of hero.buttons) {
      await openHome(page);
      await page.locator(`#${HERO_ID}`).getByRole("link", { name: button.name }).dblclick();
      await waitForScrollEnd(page);
      await expectSectionInView(page, button.target);
    }

    expect(context.pages().length, "Terbuka tab baru").toBe(1);
  });
});

test.describe("TCH-07 Verifikasi Hero di viewport pendek (landscape mobile)", () => {
  const dataUji = [
    { width: 667, height: 375 },
    { width: 568, height: 320 },
  ];

  for (const size of dataUji) {
    test(`Ukuran ${size.width}x${size.height}`, async ({ page }) => {
      await page.setViewportSize(size);
      await openHome(page);

      // Konten hero tidak bertumpuk dengan navbar
      const navbarBox = await page.locator(SITE.selectors.navbar).boundingBox();
      const headlineBox = await page.locator(`#${HERO_ID} h1`).boundingBox();
      expect(headlineBox!.y, "Headline tertutup navbar").toBeGreaterThanOrEqual(navbarBox!.y + navbarBox!.height);

      // Semua tombol CTA terlihat utuh (boleh setelah di-scroll)
      for (const button of hero.buttons) {
        const buttonLocator = page.locator(`#${HERO_ID}`).getByRole("link", { name: button.name });
        await buttonLocator.scrollIntoViewIfNeeded();
        await expect(buttonLocator).toBeInViewport({ ratio: 1 });
      }
    });
  }
});

test.describe("Hero - Reduce Motion aktif", () => {
  test.use({ reducedMotion: "reduce" });

  test("TCH-09 Verifikasi Hero saat pengaturan Reduce Motion aktif", async ({ page }) => {
    await openHome(page);

    await expect(page.locator(`#${HERO_ID} h1`)).toBeVisible();
    if (hero.scrollHint) {
      await expect(page.locator(hero.scrollHint), "Animasi masih berjalan").toHaveCSS("animation-name", "none");
    }

    // Tombol pertama tetap bisa dipakai
    await expect(page.locator(`#${HERO_ID}`).getByRole("link", { name: firstButton.name })).toBeVisible();
  });
});
