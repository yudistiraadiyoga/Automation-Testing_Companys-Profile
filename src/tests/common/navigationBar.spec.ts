import { expect, test } from "@playwright/test";
import { SITE } from "../../config";
import {
  BASE_URL,
  CONTACT_ID,
  HERO_ID,
  MENU_SECTIONS,
  expectSectionInView,
  expectTitleNotUnderNavbar,
  openHome,
  scrollToSection,
  setWidth,
  trackDialogs,
  trackPageErrors,
  waitForScrollEnd,
} from "../../helpers/base.helper";
import {
  clickLogo,
  clickNavCta,
  clickNavMenu,
  expectHash,
  expectNavbarSticky,
  hamburgerButton,
  navMenu,
  navMenuList,
  navbar,
} from "../../helpers/navbar.helper";

// Menu pertama dan terakhir di navbar, dipakai untuk beberapa skenario
const FIRST_MENU = MENU_SECTIONS[0];
const LAST_MENU = MENU_SECTIONS[MENU_SECTIONS.length - 1];

// =====================================================================
// POSITIVE
// =====================================================================
test.describe("Navigation Bar - Positive", () => {
  test.beforeEach(async ({ page }) => {
    await openHome(page);
  });

  test("TCN-01 Verifikasi klik Logo mengarah ke Hero", async ({ page }) => {
    await scrollToSection(page, CONTACT_ID);

    await clickLogo(page);

    await expectSectionInView(page, HERO_ID);
  });

  test.describe("TCN-02 s/d TCN-06 Verifikasi menu navbar mengarah ke section", () => {
    for (const section of MENU_SECTIONS) {
      test(`Menu ${section.menu}`, async ({ page }) => {
        await clickNavMenu(page, section.menu!);

        await expectSectionInView(page, section.id);
      });
    }
  });

  test("TCN-07 Verifikasi tombol CTA navbar mengarah ke section Contact", async ({ page }) => {
    await clickNavCta(page);

    await expectSectionInView(page, CONTACT_ID);
  });

  test("TCN-08 Verifikasi navbar tetap tampil saat halaman di-scroll", async ({ page }) => {
    for (const section of MENU_SECTIONS) {
      await scrollToSection(page, section.id);
      await expectNavbarSticky(page);
    }

    // Menu tetap bisa diklik saat posisi di tengah halaman
    await clickNavMenu(page, FIRST_MENU.menu!);
    await expectSectionInView(page, FIRST_MENU.id);
  });

  test("TCN-09 Verifikasi judul section tidak tertutup navbar setelah navigasi", async ({ page }) => {
    for (const section of MENU_SECTIONS) {
      await clickNavMenu(page, section.menu!);
      await expectTitleNotUnderNavbar(page, section.id);
    }
  });

  test("TCN-10 Verifikasi URL hash berubah sesuai menu yang diklik", async ({ page }) => {
    for (const section of MENU_SECTIONS) {
      await clickNavMenu(page, section.menu!);
      await expectHash(page, section.id);
    }
  });
});

test.describe("TCN-11 Verifikasi akses langsung via URL anchor", () => {
  for (const section of MENU_SECTIONS) {
    test(`Akses #${section.id}`, async ({ page }) => {
      await openHome(page, section.id);

      await expectSectionInView(page, section.id);
      await expectTitleNotUnderNavbar(page, section.id);
    });
  }
});

// =====================================================================
// NEGATIVE
// =====================================================================
test.describe("TCN-12 Verifikasi akses URL anchor yang tidak tersedia", () => {
  const dataUji = ["tidakada", "<script>alert(1)</script>"];

  for (const hash of dataUji) {
    test(`Akses #${hash}`, async ({ page }) => {
      const alerts = trackDialogs(page);
      const errors = trackPageErrors(page);

      await page.goto(`${BASE_URL}#${hash}`);
      await waitForScrollEnd(page);

      await expectSectionInView(page, HERO_ID);
      expect(alerts, "Muncul alert").toEqual([]);
      expect(errors, "Ada error di halaman").toEqual([]);
    });
  }
});

test.describe("Navigation Bar - Negative", () => {
  test.beforeEach(async ({ page }) => {
    await openHome(page);
  });

  test("TCN-13 Verifikasi klik menu berulang kali dengan cepat", async ({ page }) => {
    const errors = trackPageErrors(page);

    // Klik semua menu dengan cepat tanpa menunggu scroll selesai
    for (const section of MENU_SECTIONS) {
      await navMenu(page, section.menu!).click();
    }
    await waitForScrollEnd(page);

    // Halaman berhenti di menu terakhir yang diklik
    await expectSectionInView(page, LAST_MENU.id);
    expect(errors).toEqual([]);
  });

  test("TCN-14 Verifikasi tombol Back dan Forward browser setelah navigasi menu", async ({ page }) => {
    await clickNavMenu(page, FIRST_MENU.menu!);
    await clickNavMenu(page, LAST_MENU.menu!);

    await page.goBack();
    await expectHash(page, FIRST_MENU.id);

    await page.goForward();
    await expectHash(page, LAST_MENU.id);
  });

  test("TCN-16 Verifikasi menutup hamburger menu tanpa memilih menu", async ({ page }) => {
    await setWidth(page, 375, 812);

    // Hamburger harus ada di tampilan mobile
    await expect(hamburgerButton(page), "Ikon hamburger tidak ditemukan").toBeVisible();

    // Buka menu, lalu tap di luar menu -> menu tertutup
    await hamburgerButton(page).click();
    await expect(navMenuList(page)).toBeVisible();
    await page.mouse.click(10, 600);
    await expect(navMenuList(page)).toBeHidden();

    // Buka menu, lalu tap ikon close -> menu tertutup
    await hamburgerButton(page).click();
    await hamburgerButton(page).click();
    await expect(navMenuList(page)).toBeHidden();
  });

  test("TCN-18 Verifikasi navbar saat zoom browser 200%", async ({ page }) => {
    // Zoom 200% pada layar 1280x800 sama dengan layar 640x400
    await setWidth(page, 640, 400);

    const navbarBox = await navbar(page).boundingBox();
    expect(navbarBox!.height, "Navbar menutupi lebih dari setengah layar").toBeLessThan(200);

    // Menu harus tetap terjangkau: tampil langsung, atau lewat hamburger
    const menuTampil = await navMenuList(page).isVisible();
    if (menuTampil) {
      await clickNavMenu(page, FIRST_MENU.menu!);
      await expectSectionInView(page, FIRST_MENU.id);
    } else {
      await expect(hamburgerButton(page), "Menu tidak terjangkau saat zoom 200%").toBeVisible();
    }
  });

  test("TCN-19 Verifikasi navigasi menu menggunakan keyboard", async ({ page }) => {
    // Tab pertama -> logo, Tab berikutnya -> menu satu per satu
    await page.keyboard.press("Tab");
    await expect(page.locator("*:focus")).toHaveCount(1);

    for (const section of MENU_SECTIONS) {
      await page.keyboard.press("Tab");
      await expect(navMenu(page, section.menu!)).toBeFocused();
    }

    // Enter pada menu pertama
    await navMenu(page, FIRST_MENU.menu!).focus();
    await page.keyboard.press("Enter");
    await waitForScrollEnd(page);
    await expectSectionInView(page, FIRST_MENU.id);
  });
});

test.describe("TCN-17 Verifikasi navbar di lebar tablet (batas breakpoint)", () => {
  const dataUji = [768, 820, 1024, 1100];

  for (const width of dataUji) {
    test(`Lebar ${width}px`, async ({ page }) => {
      await setWidth(page, width);
      await openHome(page);

      const menuTampil = await navMenuList(page).isVisible();

      if (menuTampil) {
        // Menu dalam satu baris: tinggi navbar tidak bertambah (tidak turun ke baris kedua)
        const navbarBox = await navbar(page).boundingBox();
        expect(navbarBox!.height, "Menu turun ke baris kedua").toBeLessThan(100);

        // Tombol CTA navbar tidak terpotong di kanan
        const ctaBox = await page.locator(SITE.selectors.navCta).boundingBox();
        expect(ctaBox!.x + ctaBox!.width, "Tombol CTA navbar terpotong").toBeLessThanOrEqual(width);
      } else {
        // Menu disembunyikan -> harus ada hamburger sebagai pengganti
        await expect(hamburgerButton(page), "Menu hilang tanpa hamburger").toBeVisible();
      }
    });
  }
});

test.describe("Navigation Bar - JavaScript dinonaktifkan", () => {
  test.use({ javaScriptEnabled: false });

  test("TCN-15 Verifikasi navbar saat JavaScript dinonaktifkan", async ({ page }) => {
    await page.goto(BASE_URL);

    for (const section of MENU_SECTIONS) {
      await navMenu(page, section.menu!).click();
      await expectHash(page, section.id);
    }
  });
});
