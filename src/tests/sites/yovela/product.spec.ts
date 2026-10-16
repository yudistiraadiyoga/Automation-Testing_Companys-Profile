import { expect, test, type Page } from "@playwright/test";
import {
  BASE_URL,
  expectInsideViewportWidth,
  expectNoHorizontalScroll,
  expectSectionInView,
  openHome,
  scrollToSection,
  setWidth,
  waitForScrollEnd,
} from "../../../helpers/base.helper";

// Ambil kartu produk berdasarkan judulnya
function productCard(page: Page, title: string) {
  return page.locator(".product-card").filter({ hasText: title });
}

// Ambil link di dalam kartu produk
function productLink(page: Page, title: string) {
  return productCard(page, title).locator("a.product-tag");
}

const PRODUCTS = [
  { tc: "TCP-02", title: "Household Products", link: "Explore Range" },
  { tc: "TCP-03", title: "Daily Consumer Goods", link: "View Catalogue" },
  { tc: "TCP-04", title: "Import Services", link: "Learn More" },
  { tc: "TCP-05", title: "Export Services", link: "Learn More" },
];

// =====================================================================
// POSITIVE
// =====================================================================
test.describe("Products & Services - Positive", () => {
  test.beforeEach(async ({ page }) => {
    await openHome(page);
    await scrollToSection(page, "products");
  });

  test("TCP-01 Verifikasi empat kartu layanan tampil lengkap", async ({ page }) => {
    await expect(page.locator(".product-card")).toHaveCount(4);

    for (const product of PRODUCTS) {
      await expect(productCard(page, product.title).locator(".product-title")).toHaveText(product.title);
      await expect(productCard(page, product.title).locator(".product-desc")).not.toBeEmpty();
    }
  });

  for (const product of PRODUCTS) {
    test(`${product.tc} Verifikasi link ${product.link} (${product.title}) mengarah ke section Contact`, async ({ page }) => {
      await expect(productLink(page, product.title)).toHaveText(product.link);

      await productLink(page, product.title).click();
      await waitForScrollEnd(page);

      await expectSectionInView(page, "contact");
    });
  }

  test("TCP-06 Verifikasi efek hover pada kartu dan link", async ({ page }) => {
    const card = productCard(page, "Household Products");
    const link = productLink(page, "Household Products");

    await card.hover();

    // Kursor berubah menjadi pointer pada link
    await expect(link).toHaveCSS("cursor", "pointer");
  });
});

// =====================================================================
// NEGATIVE
// =====================================================================
test.describe("Products & Services - Negative", () => {
  test.beforeEach(async ({ page }) => {
    await openHome(page);
    await scrollToSection(page, "products");
  });

  test("TCP-07 Verifikasi buka link kartu di tab baru", async ({ page, context }) => {
    // Ctrl+klik membuka href link di tab baru, jadi kita buka href tersebut di tab baru
    const href = await productLink(page, "Household Products").getAttribute("href");
    expect(href).toBe("#contact");

    const newTab = await context.newPage();
    const response = await newTab.goto(BASE_URL + href);
    await waitForScrollEnd(newTab);

    expect(response!.status(), "Tab baru error / 404").toBe(200);
    await expectSectionInView(newTab, "contact");
  });

  test("TCP-08 Verifikasi tombol Back setelah klik link kartu", async ({ page }) => {
    await productLink(page, "Import Services").click();
    await waitForScrollEnd(page);

    await page.goBack();
    await waitForScrollEnd(page);

    expect(page.url()).toContain("staging.yovela-trading.com");
    await expectSectionInView(page, "products");
  });

  test("TCP-09 Verifikasi kartu layanan di layar 320px", async ({ page }) => {
    await setWidth(page, 320);
    await scrollToSection(page, "products");

    await expectNoHorizontalScroll(page);
    await expectInsideViewportWidth(page, ".product-card");

    // 1 kolom: kartu pertama dan kedua berada di posisi kiri yang sama
    const firstCard = await page.locator(".product-card").nth(0).boundingBox();
    const secondCard = await page.locator(".product-card").nth(1).boundingBox();
    expect(secondCard!.x).toBe(firstCard!.x);
  });

  test("TCP-11 Verifikasi fokus keyboard pada link kartu", async ({ page }) => {
    // Fokus ke link pertama, lalu Tab ke link berikutnya (urutan kiri ke kanan)
    await productLink(page, "Household Products").focus();
    await expect(productLink(page, "Household Products")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(productLink(page, "Daily Consumer Goods")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(productLink(page, "Import Services")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(productLink(page, "Export Services")).toBeFocused();

    // Enter membawa ke section Contact
    await page.keyboard.press("Enter");
    await waitForScrollEnd(page);
    await expectSectionInView(page, "contact");
  });
});

test.describe("Products & Services - Perangkat sentuh", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test("TCP-10 Verifikasi efek hover di perangkat sentuh", async ({ page }) => {
    await openHome(page);
    await scrollToSection(page, "products");

    // Tap pertama pada link langsung menjalankan aksi (tidak perlu tap dua kali)
    await productLink(page, "Household Products").tap();
    await waitForScrollEnd(page);

    await expectSectionInView(page, "contact");
  });
});
