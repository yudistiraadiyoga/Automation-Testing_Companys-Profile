import { expect, test } from "@playwright/test";
import { SITE } from "../../config";
import {
  BASE_URL,
  CONTACT_ID,
  MENU_SECTIONS,
  SECTIONS,
  blockResources,
  expectInsideViewportWidth,
  expectNoHorizontalScroll,
  expectSectionInView,
  manualTest,
  openHome,
  scrollToSection,
  setWidth,
  trackPageErrors,
  waitForScrollEnd,
} from "../../helpers/base.helper";
import { clickNavMenu, navMenu } from "../../helpers/navbar.helper";
import { buildCustomerData, formField, openContactForm, submitContactForm } from "../../helpers/getInTouch.helper";

// =====================================================================
// POSITIVE - RESPONSIVE
// =====================================================================
test.describe("General - Mobile", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("TCGN-01 Verifikasi tampilan di perangkat mobile", async ({ page }) => {
    await openHome(page);

    await expectNoHorizontalScroll(page);
  });

  test.describe("TCGN-02 Verifikasi tombol di mobile", () => {
    for (const button of SITE.hero.buttons) {
      test(`Tap ${button.name}`, async ({ page }) => {
        await openHome(page);

        await page.getByRole("link", { name: button.name }).first().tap();
        await waitForScrollEnd(page);

        await expectSectionInView(page, button.target);
      });
    }
  });
});

test.describe("General - Positive", () => {
  test("TCGN-03 Verifikasi tampilan di lebar 375px", async ({ page }) => {
    await setWidth(page, 375);
    await openHome(page);

    for (const section of SECTIONS) {
      await scrollToSection(page, section.id);
      await expectNoHorizontalScroll(page);
    }
  });
});

// =====================================================================
// NEGATIVE - URL
// =====================================================================
test.describe("TCGN-04 Verifikasi akses URL yang tidak tersedia", () => {
  const dataUji = [
    { path: "halaman-tidak-ada", expectedStatus: [404] },
    { path: "index.php", expectedStatus: [404] },
    { path: ".env", expectedStatus: [403, 404] },
  ];

  for (const data of dataUji) {
    test(`Akses /${data.path}`, async ({ page }) => {
      const response = await page.goto(BASE_URL + data.path);

      expect(data.expectedStatus).toContain(response!.status());
    });
  }
});

test.describe("TCGN-12 Verifikasi refresh saat berada di anchor section", () => {
  for (const section of MENU_SECTIONS) {
    test(`Refresh di #${section.id}`, async ({ page }) => {
      await openHome(page, section.id);

      await page.reload();
      await waitForScrollEnd(page);

      await expectSectionInView(page, section.id);
    });
  }
});

test.describe("General - Negative", () => {
  test("TCGN-05 Verifikasi akses via HTTP", async ({ page }) => {
    const httpUrl = BASE_URL.replace("https://", "http://");

    await page.goto(httpUrl);

    // Otomatis redirect ke https
    expect(page.url()).toBe(BASE_URL);
  });

  test("TCGN-06 Verifikasi tidak ada error di Console", async ({ page }) => {
    const errors = trackPageErrors(page);
    await openHome(page);

    for (const section of MENU_SECTIONS) {
      await clickNavMenu(page, section.menu!);
    }

    expect(errors, "Ada error di Console / request gagal").toEqual([]);
  });

  test("TCGN-07 Verifikasi halaman pada koneksi lambat", async ({ page, browserName }) => {
    test.skip(browserName !== "chromium", "Simulasi jaringan lambat hanya bisa di Chromium");
    test.setTimeout(180000);

    // Simulasi "Slow 3G" lewat Chrome DevTools Protocol
    const devtools = await page.context().newCDPSession(page);
    await devtools.send("Network.enable");
    await devtools.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 2000, // jeda 2 detik
      downloadThroughput: 62500, // 500 kbps
      uploadThroughput: 62500,
    });

    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 120000 });

    // Judul utama tampil
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 60000 });
  });

  test("TCGN-09 Verifikasi tampilan di lebar layar minimum 320px", async ({ page }) => {
    await setWidth(page, 320);
    await openHome(page);

    await expectNoHorizontalScroll(page);
    await expectInsideViewportWidth(page, "h1, h2");
  });

  test("TCGN-10 Verifikasi tampilan saat zoom browser 200%", async ({ page }) => {
    // Zoom 200% pada layar 1280x720 sama dengan layar 640x360
    await page.setViewportSize({ width: 640, height: 360 });
    const sentRequests = await openContactForm(page);

    await expectNoHorizontalScroll(page);
    await submitContactForm(page, buildCustomerData());

    expect(sentRequests.length, "Form tidak bisa dikirim saat zoom 200%").toBe(1);
  });

  test("TCGN-11 Verifikasi halaman saat file CSS gagal dimuat", async ({ page }) => {
    await blockResources(page, ["css"]);
    await openHome(page);

    // Semua judul section tetap ada
    for (const section of SECTIONS) {
      await expect(page.locator(`#${section.id}`)).toContainText(section.title);
    }

    // Link menu dan form tetap berfungsi
    const contactMenu = MENU_SECTIONS.find((section) => section.id === CONTACT_ID)!;
    await navMenu(page, contactMenu.menu!).click();
    await expect(page).toHaveURL(new RegExp(`#${CONTACT_ID}$`));
    await expect(formField(page).name).toBeEditable();
  });
});

test.describe("General - JavaScript dinonaktifkan", () => {
  test.use({ javaScriptEnabled: false });

  test.describe("TCGN-08 Verifikasi halaman saat JavaScript dinonaktifkan", () => {
    for (const section of SECTIONS) {
      test(`Judul section #${section.id} tetap terlihat`, async ({ page }) => {
        await page.goto(BASE_URL);
        const title = page.locator(`#${section.id}`).getByText(section.title).first();

        // checkVisibility() mengecek apakah elemen benar-benar terlihat,
        // termasuk jika elemen induknya disembunyikan dengan opacity: 0
        const terlihat = await title.evaluate((el) => el.checkVisibility({ opacityProperty: true }));
        expect(terlihat, "Konten tersembunyi tanpa JavaScript").toBe(true);
      });
    }
  });
});

test.describe("General - Dark Mode", () => {
  test.use({ colorScheme: "dark" });

  test("TCGN-13 Verifikasi tampilan saat mode gelap OS aktif", async ({ page }) => {
    await openHome(page, CONTACT_ID);
    const nameField = formField(page).name;

    // Warna teks harus berbeda dengan warna latar field
    const textColor = await nameField.evaluate((el) => getComputedStyle(el).color);
    const backgroundColor = await nameField.evaluate((el) => getComputedStyle(el).backgroundColor);

    expect(textColor, "Teks field tidak terbaca di dark mode").not.toBe(backgroundColor);
  });
});

manualTest("TCGN-14 Verifikasi kontras warna teks (Lighthouse)", "jalankan audit Lighthouse Accessibility di DevTools");
