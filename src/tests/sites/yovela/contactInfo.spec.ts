import { expect, test } from "@playwright/test";
import { openContactForm } from "../../../helpers/getInTouch.helper";

// Info kontak perusahaan di section Contact (isinya khusus Yovela)
test.describe("Contact - Info Perusahaan", () => {
  test.describe("TCC-01 Verifikasi info kontak perusahaan tampil", () => {
    const dataUji = [
      { label: "Registered Address", expected: "Hong Kong SAR, China" },
      { label: "Company", expected: "Yovela Trade Limited · 樂易貿易有限公司" },
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
