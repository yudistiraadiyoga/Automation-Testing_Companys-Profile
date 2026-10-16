import { expect, test, type TestInfo } from "@playwright/test";
import { SITE } from "../../config";
import {
  CONTACT_ID,
  HERO_ID,
  MENU_SECTIONS,
  expectNoHorizontalScroll,
  expectSectionInView,
  expectTitleNotUnderNavbar,
  openHome,
  waitForScrollEnd,
} from "../../helpers/base.helper";
import { clickNavCta, clickNavMenu, hamburgerButton } from "../../helpers/navbar.helper";
import {
  AreaOfInterest,
  buildCustomerData,
  expectFieldInvalid,
  expectNotSubmitted,
  expectSubmitted,
  formField,
  openContactForm,
  submitContactForm,
} from "../../helpers/getInTouch.helper";

/**
 * File ini dijalankan di semua browser project (lihat playwright.config.ts).
 * Nomor TC per browser:
 *   chromium      -> TCCB-01..05 (Chrome)
 *   firefox       -> TCCB-06..10
 *   webkit        -> TCCB-11..15 (Safari)
 *   edge          -> TCCB-16..20
 *   mobile-chrome -> TCCB-21..25 (Chrome Android)
 *   mobile-safari -> TCCB-26..30 (Safari iOS)
 * Nomor TC dicatat sebagai annotation dan tampil di HTML report.
 */
const FIRST_TC_NUMBER: Record<string, number> = {
  chromium: 1,
  firefox: 6,
  webkit: 11,
  edge: 16,
  "mobile-chrome": 21,
  "mobile-safari": 26,
};

// Contoh: addTcId(testInfo, 2) di project firefox -> "TCCB-08"
function addTcId(testInfo: TestInfo, urutan: number) {
  const number = FIRST_TC_NUMBER[testInfo.project.name] + urutan;
  const tcId = "TCCB-" + String(number).padStart(2, "0");
  testInfo.annotations.push({ type: "TC ID", description: tcId });
}

const firstHeroButton = SITE.hero.buttons[0];

test.describe("Cross Browsing", () => {
  test("Tampilan seluruh halaman", async ({ page }, testInfo) => {
    addTcId(testInfo, 0);
    await openHome(page);

    // Teks hero dan footer tampil benar (termasuk karakter non-latin)
    for (const text of SITE.hero.texts) {
      await expect(page.locator(`#${HERO_ID}`)).toContainText(text);
    }
    for (const text of SITE.footer.texts) {
      await expect(page.locator(SITE.selectors.footer)).toContainText(text);
    }

    // Layout tidak melebar ke samping
    await expectNoHorizontalScroll(page);
  });

  test("Navigasi menu", async ({ page, isMobile }, testInfo) => {
    addTcId(testInfo, 1);
    await openHome(page);

    for (const section of MENU_SECTIONS) {
      // Di mobile, menu dibuka lewat ikon hamburger terlebih dahulu
      if (isMobile) {
        await hamburgerButton(page).click();
      }

      await clickNavMenu(page, section.menu!);

      await expectSectionInView(page, section.id);
      await expectTitleNotUnderNavbar(page, section.id);
    }

    if (!isMobile) {
      await clickNavCta(page);
      await expectSectionInView(page, CONTACT_ID);
    }

    await openHome(page);
    await page.getByRole("link", { name: firstHeroButton.name }).first().click();
    await waitForScrollEnd(page);
    await expectSectionInView(page, firstHeroButton.target);
  });

  test("Dropdown kategori", async ({ page }, testInfo) => {
    addTcId(testInfo, 2);
    await openContactForm(page);

    await expect(formField(page).interest.locator("option")).toHaveText([SITE.contactForm.placeholderOption, ...AreaOfInterest]);

    await formField(page).interest.selectOption(AreaOfInterest[0]);
    await expect(formField(page).interest).toHaveValue(AreaOfInterest[0]);
  });

  test("Validasi form", async ({ page }, testInfo) => {
    addTcId(testInfo, 3);
    const sentRequests = await openContactForm(page);

    // Submit tanpa mengisi apa pun
    await formField(page).submit.click();
    await expectNotSubmitted(page, sentRequests);
    await expectFieldInvalid(page, "name");

    // Submit dengan email tidak valid
    await submitContactForm(page, buildCustomerData({ "Email Address": "budi@" }));
    await expectNotSubmitted(page, sentRequests);
    await expectFieldInvalid(page, "email");
  });

  test("Submit form dengan data valid", async ({ page }, testInfo) => {
    addTcId(testInfo, 4);
    const sentRequests = await openContactForm(page);

    await submitContactForm(page, buildCustomerData({ MASSAGE: `Tes cross browser ${testInfo.project.name}` }));

    await expectSubmitted(page, sentRequests);
  });
});
