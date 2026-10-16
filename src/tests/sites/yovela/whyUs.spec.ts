import { expect, test } from "@playwright/test";
import {
  expectInsideViewportWidth,
  expectNoHorizontalScroll,
  manualTest,
  openHome,
  scrollToSection,
  setWidth,
} from "../../../helpers/base.helper";

// =====================================================================
// POSITIVE
// =====================================================================
test.describe("Why Us - Positive", () => {
  test.beforeEach(async ({ page }) => {
    await openHome(page);
    await scrollToSection(page, "why");
  });

  test("TCW-01 Verifikasi empat kartu keunggulan tampil lengkap", async ({ page }) => {
    await expect(page.locator(".pillar h3")).toHaveText([
      "Licensed & Registered",
      "Curated Quality",
      "Global Network",
      "Reliable Partnership",
    ]);
    await expect(page.locator(".pillar-icon")).toHaveCount(4);
  });

  test("TCW-02 Verifikasi ikon emoji tampil (browser saat ini)", async ({ page }) => {
    const icons = page.locator(".pillar-icon");

    for (let i = 0; i < 4; i++) {
      await expect(icons.nth(i)).toBeVisible();
      await expect(icons.nth(i)).not.toBeEmpty();
    }
  });
});

// =====================================================================
// NEGATIVE
// =====================================================================
test.describe("Why Us - Negative", () => {
  test("TCW-03 Verifikasi emoji dekoratif disembunyikan dari screen reader", async ({ page }) => {
    await openHome(page);
    const icons = page.locator(".pillar-icon");

    // Emoji dekoratif harus diberi aria-hidden="true"
    for (let i = 0; i < 4; i++) {
      await expect(icons.nth(i)).toHaveAttribute("aria-hidden", "true");
    }
  });

  test("TCW-04 Verifikasi kartu keunggulan di layar 320px", async ({ page }) => {
    await setWidth(page, 320);
    await openHome(page);
    await scrollToSection(page, "why");

    await expectNoHorizontalScroll(page);
    await expectInsideViewportWidth(page, ".pillar");
  });
});

manualTest("TCW-02 Verifikasi ikon emoji di Windows, macOS, Android, iOS", "perlu dicek di perangkat/OS fisik");
manualTest("TCW-03 Verifikasi pembacaan emoji dengan NVDA / VoiceOver", "perlu screen reader sungguhan");
