import { expect, test } from "@playwright/test";
import { openContactForm } from "../../../helpers/getInTouch.helper";

// Info kontak perusahaan di section Contact (isinya khusus Nexus TradeTech Limited)
test.describe("Contact - Info Perusahaan", () => {
  test.describe("TCC-01 Verifikasi info kontak perusahaan tampil", () => {
    const dataUji = [
      { label: "Registered Address", expected: "Hong Kong SAR, China" },
      { label: "Company", expected: "Nexus TradeTech Limited · Nexus TradeTech Limited" },
      { label: "CR No. / BR No.", expected: "3305282 · 75580592" },
    ];

    for (const data of dataUji) {
      test(data.label, async ({ page }) => {
        await openContactForm(page);

        const infoItem = page.locator("#contact .info-item").filter({ hasText: data.label });
        await expect(infoItem).toContainText(data.expected);
      });
    }
  });
});
