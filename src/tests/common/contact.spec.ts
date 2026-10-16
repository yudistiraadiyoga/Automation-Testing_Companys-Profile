import { expect, test } from "@playwright/test";
import { SITE } from "../../config";
import {
  ACCEPTED_INPUTS,
  DANGEROUS_INPUTS,
  INVALID_COMPANIES,
  INVALID_EMAILS,
  INVALID_MESSAGES,
  INVALID_NAMES,
  OVER_MAX_INPUTS,
} from "../../data/contactForm.data";
import { CONTACT_ID, manualTest, trackDialogs } from "../../helpers/base.helper";
import {
  AreaOfInterest,
  ERROR_MESSAGE,
  SUCCESS_MESSAGE,
  buildCustomerData,
  expectFieldInvalid,
  expectFieldValid,
  expectNotSubmitted,
  expectSubmitted,
  fillForm,
  formField,
  lastPayload,
  mockContactApi,
  openContactForm,
  submitContactForm,
} from "../../helpers/getInTouch.helper";

/**
 * Catatan:
 * - openContactForm() membuka section kontak dan mengembalikan "sentRequests",
 *   yaitu daftar request API kontak yang terkirim. Jika kosong = form tidak terkirim.
 * - buildCustomerData() membuat data valid. Isi field yang ingin diuji, contoh:
 *   buildCustomerData({ "Email Address": "budi@" }) -> semua valid kecuali email.
 * - Data uji ada di src/data/contactForm.data.ts
 */

const form = SITE.contactForm;
const contactSection = `#${CONTACT_ID}`;

// =====================================================================
// POSITIVE & KONTEN
// =====================================================================
test.describe("Contact - Konten & Positive", () => {
  test("TCC-02 Verifikasi opsi dropdown kategori lengkap", async ({ page }) => {
    await openContactForm(page);

    const options = formField(page).interest.locator("option");
    await expect(options).toHaveText([form.placeholderOption, ...AreaOfInterest]);
  });

  test("TCC-04 Verifikasi submit form dengan data valid", async ({ page }) => {
    const sentRequests = await openContactForm(page);

    await submitContactForm(page, {
      "FULL NAME": "Budi Santoso",
      Company: "PT Maju",
      "Email Address": "budi@test.com",
      "Area of Interest": AreaOfInterest[0],
      MASSAGE: "Ingin info produk",
    });

    await expectSubmitted(page, sentRequests);
  });

  test("TCC-17 Verifikasi navigasi form menggunakan keyboard", async ({ page }) => {
    const sentRequests = await openContactForm(page);
    await fillForm({ data: buildCustomerData(), page }).fillAll();
    const field = formField(page);

    // Mulai dari field Name, lalu tekan Tab satu per satu
    await field.name.focus();
    await page.keyboard.press("Tab");
    await expect(field.company).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(field.email).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(field.interest).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(field.message).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(field.submit).toBeFocused();

    // Submit dengan tombol Enter
    await page.keyboard.press("Enter");
    await expectSubmitted(page, sentRequests);
  });

  test.describe("TCC-18 Verifikasi label terhubung ke input", () => {
    const dataUji = [
      { label: form.labels.name, field: "name" },
      { label: form.labels.company, field: "company" },
      { label: form.labels.email, field: "email" },
      { label: form.labels.interest, field: "interest" },
      { label: form.labels.message, field: "message" },
    ] as const;

    for (const data of dataUji) {
      test(`Klik label "${data.label}"`, async ({ page }) => {
        await openContactForm(page);

        await page.locator(`${contactSection} form label`, { hasText: data.label }).first().click();

        await expect(formField(page)[data.field]).toBeFocused();
      });
    }
  });
});

// =====================================================================
// NEGATIVE - INPUT DITOLAK
// Langkahnya sama untuk semua data uji:
//   1. Buka section kontak
//   2. Isi field yang diuji dengan data negatif, field lain diisi benar
//   3. Klik tombol kirim
//   4. Form TIDAK boleh terkirim
// =====================================================================

test.describe("Contact - Negative Field Name", () => {
  for (const data of INVALID_NAMES) {
    test(`${data.tc} ${data.kasus}: "${data.input}"`, async ({ page }) => {
      const sentRequests = await openContactForm(page);

      await submitContactForm(page, buildCustomerData({ "FULL NAME": data.input }));

      await expectNotSubmitted(page, sentRequests);
    });
  }
});

test.describe("Contact - Negative Field Company", () => {
  for (const data of INVALID_COMPANIES) {
    test(`${data.tc} ${data.kasus}: "${data.input}"`, async ({ page }) => {
      const sentRequests = await openContactForm(page);

      await submitContactForm(page, buildCustomerData({ Company: data.input }));

      await expectNotSubmitted(page, sentRequests);
    });
  }
});

test.describe("Contact - Negative Field Email", () => {
  for (const data of INVALID_EMAILS) {
    test(`${data.tc} ${data.kasus}: "${data.input.slice(0, 40)}"`, async ({ page }) => {
      const sentRequests = await openContactForm(page);

      await submitContactForm(page, buildCustomerData({ "Email Address": data.input }));

      await expectNotSubmitted(page, sentRequests);
    });
  }
});

test.describe("Contact - Negative Field Message", () => {
  for (const data of INVALID_MESSAGES) {
    test(`${data.tc} ${data.kasus}: ${JSON.stringify(data.input)}`, async ({ page }) => {
      const sentRequests = await openContactForm(page);

      await submitContactForm(page, buildCustomerData({ MASSAGE: data.input }));

      await expectNotSubmitted(page, sentRequests);
    });
  }
});

test.describe("Contact - Negative Dropdown Kategori & Form", () => {
  test("TCC-03 Verifikasi submit tanpa memilih kategori", async ({ page }) => {
    const sentRequests = await openContactForm(page);

    await submitContactForm(page, buildCustomerData({ "Area of Interest": "" }));

    await expectNotSubmitted(page, sentRequests);
    await expectFieldInvalid(page, "interest");
  });

  test("TCC-43 Verifikasi memilih kategori lalu kembali ke placeholder", async ({ page }) => {
    const sentRequests = await openContactForm(page);
    await fillForm({ data: buildCustomerData(), page }).fillAll();

    await formField(page).interest.selectOption(AreaOfInterest[0]);
    await formField(page).interest.selectOption({ label: form.placeholderOption });
    await formField(page).submit.click();

    await expectNotSubmitted(page, sentRequests);
    await expectFieldInvalid(page, "interest");
  });

  test("TCC-44 Verifikasi placeholder tidak dapat dipilih sebagai opsi", async ({ page }) => {
    await openContactForm(page);

    // Pilih placeholder, lalu pastikan dropdown tetap dianggap belum diisi
    await formField(page).interest.selectOption({ label: form.placeholderOption });

    await expectFieldInvalid(page, "interest");
  });

  test("TCC-05 Verifikasi submit form kosong", async ({ page }) => {
    const sentRequests = await openContactForm(page);

    await formField(page).submit.click();

    await expectNotSubmitted(page, sentRequests);
    await expectFieldInvalid(page, "name");
    await expectFieldInvalid(page, "email");
    await expectFieldInvalid(page, "interest");
    await expectFieldInvalid(page, "message");
  });

  test("TCC-60 Verifikasi submit dengan tombol Enter pada field yang belum valid", async ({ page }) => {
    const sentRequests = await openContactForm(page);

    await formField(page).name.fill("Budi Santoso");
    await formField(page).name.press("Enter");

    await expectNotSubmitted(page, sentRequests);
  });
});

// =====================================================================
// NEGATIVE - INPUT TETAP DITERIMA (boundary & karakter khusus yang valid)
// Langkah sama: isi data uji -> klik kirim -> form HARUS terkirim
// =====================================================================

test.describe("Contact - Input valid tetap diterima", () => {
  for (const data of ACCEPTED_INPUTS) {
    test(`${data.tc} ${data.kasus}`, async ({ page }) => {
      const sentRequests = await openContactForm(page);

      await submitContactForm(page, buildCustomerData({ [data.field]: data.input }));

      await expectSubmitted(page, sentRequests);
    });
  }

  test("TCC-10 Verifikasi submit dengan Company kosong", async ({ page }) => {
    const sentRequests = await openContactForm(page);

    await submitContactForm(page, buildCustomerData({ Company: "" }));

    // Hasil mengikuti aturan di config: wajib -> ditolak, opsional -> terkirim
    if (form.rules.company.required) {
      await expectNotSubmitted(page, sentRequests);
    } else {
      await expectSubmitted(page, sentRequests);
    }
  });
});

// =====================================================================
// NEGATIVE - SPASI DI AWAL/AKHIR HARUS DIPANGKAS
// =====================================================================

test.describe("Contact - Spasi dipangkas sebelum dikirim", () => {
  test("TCC-28 Verifikasi Name dengan spasi di awal dan akhir", async ({ page }) => {
    const sentRequests = await openContactForm(page);

    await submitContactForm(page, buildCustomerData({ "FULL NAME": "  Budi Santoso  " }));

    await expectSubmitted(page, sentRequests);
    expect(lastPayload(sentRequests).name).toBe("Budi Santoso");
  });

  test("TCC-31 Verifikasi Company berisi spasi saja", async ({ page }) => {
    const sentRequests = await openContactForm(page);

    await submitContactForm(page, buildCustomerData({ Company: "   " }));

    await expectSubmitted(page, sentRequests);
    expect(lastPayload(sentRequests).company).toBe("");
  });

  test("TCC-40 Verifikasi Email dengan spasi di awal dan akhir", async ({ page }) => {
    const sentRequests = await openContactForm(page);

    await submitContactForm(page, buildCustomerData({ "Email Address": "  budi@test.com  " }));

    await expectSubmitted(page, sentRequests);
    expect(lastPayload(sentRequests).email).toBe("budi@test.com");
  });
});

// =====================================================================
// NEGATIVE - BATAS MAKSIMAL KARAKTER
// Input melebihi batas: field harus memotong input (maxlength)
// =====================================================================

test.describe("Contact - Melebihi batas maksimal", () => {
  for (const data of OVER_MAX_INPUTS) {
    test(`${data.tc} ${data.kasus}`, async ({ page }) => {
      await openContactForm(page);

      await formField(page)[data.field].fill("X".repeat(data.max + 1));

      const value = await formField(page)[data.field].inputValue();
      expect(value.length, `Field menerima lebih dari ${data.max} karakter`).toBeLessThanOrEqual(data.max);
    });
  }

  test("TCC-12 Verifikasi input dengan karakter sangat panjang", async ({ page }) => {
    await openContactForm(page);

    await submitContactForm(page, buildCustomerData({ "FULL NAME": "A".repeat(256), MASSAGE: "B".repeat(5000) }));

    // Sistem tetap stabil: halaman tidak error dan form masih tampil
    await expect(formField(page).submit).toBeVisible();
  });
});

// =====================================================================
// NEGATIVE - KEAMANAN (XSS / HTML / SQL)
// Script tidak boleh dijalankan dan HTML tidak boleh dirender
// =====================================================================

test.describe("Contact - Input berbahaya tidak dieksekusi", () => {
  for (const data of DANGEROUS_INPUTS) {
    test(`${data.tc} ${data.kasus}`, async ({ page }) => {
      const alerts = trackDialogs(page);
      await openContactForm(page);

      await submitContactForm(page, buildCustomerData({ [data.field]: data.input }));
      await page.waitForTimeout(1000);

      expect(alerts, "Muncul alert, script dieksekusi").toEqual([]);
      await expect(page.locator(`${contactSection} h1`)).toHaveCount(0);
      await expect(page.locator(`${contactSection} img[src='x']`)).toHaveCount(0);
      await expect(page.locator(`${contactSection} a[href='http://evil.com']`)).toHaveCount(0);
    });
  }
});

// =====================================================================
// NEGATIVE - PERILAKU FORM
// =====================================================================

test.describe("Contact - Perilaku form", () => {
  test("TCC-15 Verifikasi klik tombol kirim berulang kali", async ({ page }) => {
    const sentRequests = await openContactForm(page);
    await mockContactApi(page, 200, 1500); // server dibuat lambat 1,5 detik
    await fillForm({ data: buildCustomerData(), page }).fillAll();

    for (let i = 0; i < 5; i++) {
      await formField(page).submit.click({ force: true });
    }

    await expect(page.getByText(SUCCESS_MESSAGE)).toBeVisible({ timeout: 10000 });
    expect(sentRequests.length, "Terkirim lebih dari 1 kali").toBe(1);
  });

  test("TCC-16 Verifikasi submit saat koneksi terputus", async ({ page }) => {
    await openContactForm(page);
    await page.route(`**/${SITE.api.contactEndpoint}`, (route) => route.abort("internetdisconnected"));
    const data = buildCustomerData();

    await submitContactForm(page, data);

    await expect(page.getByText(ERROR_MESSAGE)).toBeVisible();
    await expect(formField(page).name).toHaveValue(data["FULL NAME"]);
    await expect(formField(page).message).toHaveValue(data.MASSAGE);
  });

  test("TCC-53 Verifikasi data form tidak hilang saat validasi gagal", async ({ page }) => {
    const sentRequests = await openContactForm(page);
    const data = buildCustomerData({ "Email Address": "budi@" });

    await submitContactForm(page, data);

    await expectNotSubmitted(page, sentRequests);
    await expect(formField(page).name).toHaveValue(data["FULL NAME"]);
    await expect(formField(page).company).toHaveValue(data.Company);
    await expect(formField(page).interest).toHaveValue(data["Area of Interest"]);
    await expect(formField(page).message).toHaveValue(data.MASSAGE);
  });

  test("TCC-54 Verifikasi pesan error hilang setelah field diperbaiki", async ({ page }) => {
    await openContactForm(page);

    await formField(page).submit.click(); // submit kosong -> semua error
    await fillForm({ data: buildCustomerData(), page }).fillAll();

    await expectFieldValid(page, "name");
    await expectFieldValid(page, "company");
    await expectFieldValid(page, "email");
    await expectFieldValid(page, "interest");
    await expectFieldValid(page, "message");
  });

  test("TCC-55 Verifikasi refresh halaman setelah submit berhasil", async ({ page }) => {
    const sentRequests = await openContactForm(page);
    await submitContactForm(page, buildCustomerData());
    await expect(page.getByText(SUCCESS_MESSAGE)).toBeVisible();

    await page.reload();
    await page.waitForTimeout(1000);

    expect(sentRequests.length, "Enquiry terkirim ulang setelah refresh").toBe(1);
    await expect(formField(page).name).toHaveValue("");
  });

  test("TCC-56 Verifikasi tombol Back setelah submit berhasil", async ({ page }) => {
    const sentRequests = await openContactForm(page);
    await submitContactForm(page, buildCustomerData());
    await expect(page.getByText(SUCCESS_MESSAGE)).toBeVisible();

    await page.goBack();
    await page.goForward();
    await page.waitForTimeout(1000);

    expect(sentRequests.length, "Enquiry terkirim ulang").toBe(1);
  });

  test("TCC-57 Verifikasi submit saat koneksi lambat", async ({ page }) => {
    const sentRequests = await openContactForm(page);
    await mockContactApi(page, 200, 3000); // server dibuat lambat 3 detik
    await fillForm({ data: buildCustomerData(), page }).fillAll();

    await formField(page).submit.click();

    // Selama loading, tombol disabled dan menampilkan teks loading
    await expect(formField(page).submit).toBeDisabled();
    await expect(formField(page).submit).toHaveText(form.loadingText);
    await expect(page.getByText(SUCCESS_MESSAGE)).toBeVisible({ timeout: 10000 });
    expect(sentRequests.length).toBe(1);
  });

  test("TCC-58 Verifikasi submit saat server mengembalikan error", async ({ page }) => {
    await openContactForm(page);
    await mockContactApi(page, 500); // server dibuat error 500
    const data = buildCustomerData();

    await submitContactForm(page, data);

    await expect(page.getByText(ERROR_MESSAGE)).toBeVisible();
    await expect(formField(page).name).toHaveValue(data["FULL NAME"]);
    await expect(formField(page).submit).toBeEnabled();
  });

  test("TCC-62 Verifikasi field error ditandai untuk screen reader", async ({ page }) => {
    await openContactForm(page);

    await formField(page).submit.click();

    await expect(formField(page).name).toBeFocused();
    await expect(formField(page).name).toHaveAttribute("aria-invalid", "true");
  });

  test("TCC-63 Verifikasi form saat rotasi layar di mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // portrait
    await openContactForm(page);
    const data = buildCustomerData();
    await fillForm({ data, page }).fillAll();

    await page.setViewportSize({ width: 844, height: 390 }); // landscape
    await page.setViewportSize({ width: 390, height: 844 }); // portrait lagi

    await expect(formField(page).name).toHaveValue(data["FULL NAME"]);
    await expect(formField(page).email).toHaveValue(data["Email Address"]);
    await expect(formField(page).message).toHaveValue(data.MASSAGE);
  });
});

test.describe("Contact - JavaScript dinonaktifkan", () => {
  test.use({ javaScriptEnabled: false });

  test("TCC-59 Verifikasi form saat JavaScript dinonaktifkan", async ({ page }) => {
    await openContactForm(page);

    await submitContactForm(page, buildCustomerData({ "Email Address": "budi@test.com" }));
    await page.waitForLoadState();

    expect(page.url(), "Data form muncul di URL (method GET)").not.toContain("email=");
  });
});

manualTest("TCC-19 Verifikasi enquiry diterima di email admin", "cek inbox admin (jalankan TCC-04 dengan REAL_API=true)");
manualTest("TCC-61 Verifikasi validasi tetap berjalan dengan autofill browser", "autofill browser tidak bisa diotomasi");
manualTest("TCC-62 Verifikasi pesan error dibacakan NVDA / VoiceOver", "perlu screen reader sungguhan");
