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