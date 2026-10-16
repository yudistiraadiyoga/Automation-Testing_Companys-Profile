import { expect, test } from "@playwright/test";
import { SITE } from "../../config";
import { INVALID_BODIES, INVALID_METHODS, INVALID_RAW_BODIES } from "../../data/api.data";
import { manualTest } from "../../helpers/base.helper";
import {
  CONTACT_API,
  expectNoInternalInfo,
  expectStatusIn,
  postContact,
  postRaw,
  validPayload,
} from "../../helpers/api.helper";
import {
  AreaOfInterest,
  SUCCESS_MESSAGE,
  buildCustomerData,
  fillForm,
  formField,
  lastPayload,
  openContactForm,
  submitContactForm,
} from "../../helpers/getInTouch.helper";

/**
 * Semua test di file ini memanggil server staging SUNGGUHAN (tidak di-mock),
 * jadi setiap request yang sukses akan mengirim email ke admin.
 * openContactForm(page, false) -> false artinya API tidak di-mock.
 */

// =====================================================================
// POSITIVE - submit lewat form, cek request & response di Network
// =====================================================================
test.describe("Contact API - Submit Enquiry", () => {
  test("TCAPI-01 Verifikasi request dan response saat submit data valid", async ({ page }) => {
    await openContactForm(page, false);
    const waitResponse = page.waitForResponse(`**/${SITE.api.contactEndpoint}`);

    await submitContactForm(page, buildCustomerData());
    const response = await waitResponse;

    expect(response.request().method()).toBe("POST");
    expectStatusIn(response.status(), [200, 201]);
    const body = await response.json();
    expect(body.success).toBe(true);
    await expect(page.getByText(SUCCESS_MESSAGE)).toBeVisible();
  });

  test("TCAPI-02 Verifikasi payload yang dikirim sesuai input form", async ({ page }) => {
    const sentRequests = await openContactForm(page, false);
    const waitResponse = page.waitForResponse(`**/${SITE.api.contactEndpoint}`);

    await submitContactForm(page, {
      "FULL NAME": "Budi Santoso",
      Company: "PT Maju Jaya",
      "Email Address": "budi@test.com",
      "Area of Interest": AreaOfInterest[0],
      MASSAGE: "Tes enquiry",
    });
    await waitResponse;

    expect(lastPayload(sentRequests)).toEqual({
      name: "Budi Santoso",
      company: "PT Maju Jaya",
      email: "budi@test.com",
      interest: AreaOfInterest[0],
      message: "Tes enquiry",
    });
  });

  test("TCAPI-03 Verifikasi submit tanpa Company", async ({ request }) => {
    const result = await postContact(request, validPayload({ company: "" }));

    expectStatusIn(result.status, [200, 400]); // 200 jika opsional, 400 jika wajib
  });

  test.describe("TCAPI-04 Verifikasi nilai interest di payload untuk setiap opsi", () => {
    for (const interest of AreaOfInterest) {
      test(`Interest: ${interest}`, async ({ page }) => {
        const sentRequests = await openContactForm(page, false);
        const waitResponse = page.waitForResponse(`**/${SITE.api.contactEndpoint}`);

        await submitContactForm(page, buildCustomerData({ "Area of Interest": interest }));
        const response = await waitResponse;

        expect(response.status()).toBe(200);
        expect(lastPayload(sentRequests).interest).toBe(interest);
      });
    }
  });

  test("TCAPI-05 Verifikasi payload dengan karakter Unicode", async ({ page }) => {
    const sentRequests = await openContactForm(page, false);
    const waitResponse = page.waitForResponse(`**/${SITE.api.contactEndpoint}`);

    await submitContactForm(page, buildCustomerData({ "FULL NAME": "陳大文", MASSAGE: "Halo José" }));
    const response = await waitResponse;

    expect(response.status()).toBe(200);
    expect(lastPayload(sentRequests).name).toBe("陳大文");
    expect(lastPayload(sentRequests).message).toBe("Halo José");
  });

  test("TCAPI-06 Verifikasi response time submit", async ({ request }) => {
    let totalTime = 0;

    for (let i = 1; i <= 5; i++) {
      const start = Date.now();
      await postContact(request, validPayload({ message: `Tes response time ke-${i}` }));
      totalTime = totalTime + (Date.now() - start);
    }

    const averageTime = totalTime / 5;
    console.log(`Rata-rata response time: ${averageTime} ms`);
    expect(averageTime, "Rata-rata respons lebih dari 2 detik").toBeLessThan(2000);
  });

  test("TCAPI-07 Verifikasi response header", async ({ request }) => {
    const result = await postContact(request, validPayload());

    expect(result.headers["content-type"]).toContain("application/json");
    expect(result.headers["x-powered-by"], "Header membocorkan nama framework").toBeUndefined();
  });

  test("TCAPI-08 Verifikasi data dikirim via POST dan HTTPS", async ({ page }) => {
    await openContactForm(page, false);
    const waitResponse = page.waitForResponse(`**/${SITE.api.contactEndpoint}`);

    await submitContactForm(page, buildCustomerData({ "Email Address": "budi@test.com" }));
    const response = await waitResponse;

    expect(response.request().method()).toBe("POST");
    expect(response.url()).toContain("https://");
    expect(page.url(), "Data form muncul di URL").not.toContain("budi");
  });

  test("TCAPI-10 Verifikasi double submit menghasilkan satu request", async ({ page }) => {
    const sentRequests = await openContactForm(page, false);
    await fillForm({ data: buildCustomerData(), page }).fillAll();

    await formField(page).submit.click({ force: true });
    await formField(page).submit.click({ force: true });
    await formField(page).submit.click({ force: true });
    await page.waitForTimeout(3000);

    expect(sentRequests.length, "Terkirim lebih dari 1 request").toBe(1);
  });
});

// =====================================================================
// NEGATIVE - VALIDASI SERVER
// Langkahnya sama untuk semua data uji:
//   1. Kirim POST ke endpoint API kontak dengan body negatif (data: src/data/api.data.ts)
//   2. Server HARUS menolak dengan status 400 (bukan 200 dan bukan 500)
// =====================================================================
test.describe("Contact API - Negative Validasi Server (harus 400)", () => {
  for (const data of INVALID_BODIES) {
    test(`${data.tc} ${data.kasus}`, async ({ request }) => {
      const result = await postContact(request, data.body);

      expect(result.status, `Respons server: ${result.text}`).toBe(400);
    });
  }
});

test.describe("Contact API - Negative Body & Content-Type", () => {
  for (const data of INVALID_RAW_BODIES) {
    test(`${data.tc} ${data.kasus}`, async ({ request }) => {
      const result = await postRaw(request, data.body, data.contentType);

      expectStatusIn(result.status, data.expected);
      expectNoInternalInfo(result.text);
    });
  }

  test("TCAPI-18 Verifikasi server membatasi panjang input", async ({ request }) => {
    const result = await postContact(request, validPayload({ message: "X".repeat(10001) }));

    expectStatusIn(result.status, [400, 413]);
  });
});

// =====================================================================
// NEGATIVE - HTTP METHOD
// Endpoint hanya boleh menerima POST
// =====================================================================
test.describe("Contact API - Negative HTTP Method", () => {
  for (const data of INVALID_METHODS) {
    test(`${data.tc} Method ${data.method} ditolak`, async ({ request }) => {
      const response = await request.fetch(CONTACT_API, { method: data.method, data: validPayload() });

      expectStatusIn(response.status(), data.expected);
    });
  }
});

// =====================================================================
// NEGATIVE - SECURITY
// =====================================================================
test.describe("Contact API - Negative Security", () => {
  test("TCAPI-16 Verifikasi submit dengan interest kosong", async ({ request }) => {
    const result = await postContact(request, validPayload({ interest: "" }));

    expectStatusIn(result.status, [200, 400]); // konfirmasi ke tim: interest wajib atau opsional
  });

  test("TCAPI-19 Verifikasi respons terhadap payload XSS", async ({ request }) => {
    const result = await postContact(request, validPayload({ message: "<script>alert(1)</script>" }));

    expect(result.text, "Respons memantulkan script mentah").not.toContain("<script>");
  });

  test("TCAPI-20 Verifikasi respons terhadap payload SQL injection", async ({ request }) => {
    const result = await postContact(request, validPayload({ name: "' OR '1'='1", message: "'; DROP TABLE users; --" }));

    expect(result.status).not.toBe(500);
    expectNoInternalInfo(result.text);
  });

  test("TCAPI-22 Verifikasi field tambahan yang tidak dikenal", async ({ request }) => {
    const result = await postContact(request, validPayload({ isAdmin: true, role: "admin" }));

    expectStatusIn(result.status, [200, 400]);
  });

  test("TCAPI-27 Verifikasi rate limiting", async ({ request }) => {
    const statusList: number[] = [];

    for (let i = 1; i <= 20; i++) {
      const result = await postContact(request, validPayload({ message: `Tes rate limit ke-${i}` }));
      statusList.push(result.status);
    }

    console.log(`Status 20 request: ${statusList.join(", ")}`);
    expect(statusList, "Tidak ada status 429 setelah 20 request").toContain(429);
  });

  test("TCAPI-28 Verifikasi request dari website lain (CORS)", async ({ page }) => {
    await page.goto("https://example.com/");

    // Jalankan fetch dari domain lain (example.com) ke endpoint API kontak
    const result = await page.evaluate(async (url) => {
      try {
        await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Budi", email: "budi@test.com", message: "Tes CORS" }),
        });
        return "berhasil";
      } catch {
        return "diblokir";
      }
    }, CONTACT_API);

    expect(result, "Endpoint bisa dipanggil dari domain lain").toBe("diblokir");
  });

  test("TCAPI-35 Verifikasi error response tidak membocorkan info internal", async ({ request }) => {
    const brokenJson = await postRaw(request, '{"name": "Budi", "email": ');
    const nullFields = await postContact(request, { name: null, email: null, interest: null, message: null });
    const arrayFields = await postContact(request, validPayload({ name: ["Budi"], email: { a: "x" } }));

    expectNoInternalInfo(brokenJson.text);
    expectNoInternalInfo(nullFields.text);
    expectNoInternalInfo(arrayFields.text);
  });
});

manualTest("TCAPI-09 Verifikasi enquiry sampai ke email admin", "cek inbox admin setelah TCAPI-01");
manualTest("TCAPI-31 Cek header email admin (tidak ada Bcc tambahan)", "cek header email di inbox admin");
