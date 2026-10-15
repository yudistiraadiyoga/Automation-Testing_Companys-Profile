import type { Page, Request } from "@playwright/test";
import { expect } from "@playwright/test";
import { faker } from "@faker-js/faker";
import { SITE } from "../config";
import { CONTACT_ID, openHome } from "./base.helper";

// Semua data form diambil dari config website
const form = SITE.contactForm;

export const AreaOfInterest = form.interestOptions;
export const SUCCESS_MESSAGE = form.successMessage;
export const ERROR_MESSAGE = form.errorMessage;

export interface CustomerData {
  "FULL NAME": string;
  Company: string;
  "Email Address": string;
  "Area of Interest": string;
  MASSAGE: string;
}

interface IFillForm {
  data: CustomerData;
  page: Page;
}

function generateSafeName(): string {
  const name = faker.person.fullName();
  return name.replace(/[^a-zA-Z\s]/g, "").trim();
}

function generateSafeCompanyName(): string {
  const companyName = faker.company.name();
  return companyName
    .replace(/[^a-zA-Z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function generateSafeEmail(): string {
  const email = faker.internet.email();
  return email.replace(/[^a-zA-Z0-9@._-]/g, "").trim();
}

function generateSafeMessage(): string {
  const message = faker.lorem.paragraph();
  return message.replace(/[^a-zA-Z0-9\s.,!?]/g, "").trim();
}

// Data valid acak. Field bisa ditimpa, contoh: buildCustomerData({ "FULL NAME": "A" })
export function buildCustomerData(override: Partial<CustomerData> = {}): CustomerData {
  return {
    "FULL NAME": generateSafeName(),
    Company: generateSafeCompanyName(),
    "Email Address": generateSafeEmail(),
    "Area of Interest": faker.helpers.arrayElement(AreaOfInterest),
    MASSAGE: generateSafeMessage(),
    ...override,
  };
}

// Selector field form kontak (selector dari config, dicari di dalam section kontak)
export const formField = (page: Page) => {
  const section = page.locator(`#${CONTACT_ID}`);
  return {
    name: section.locator(form.selectors.name),
    company: section.locator(form.selectors.company),
    email: section.locator(form.selectors.email),
    interest: section.locator(form.selectors.interest),
    message: section.locator(form.selectors.message),
    submit: section.locator(form.selectors.submit),
  };
};

export type FieldName = "name" | "company" | "email" | "interest" | "message";

export const fillForm = ({ data, page }: IFillForm) => ({
  async fillFullName() {
    await formField(page).name.fill(data["FULL NAME"]);
  },
  async fillCompany() {
    await formField(page).company.fill(data.Company);
  },
  async fillEmail() {
    await formField(page).email.fill(data["Email Address"]);
  },
  async selectAreaOfInterest() {
    await formField(page).interest.selectOption(data["Area of Interest"]);
  },
  async fillMessage() {
    await formField(page).message.fill(data.MASSAGE);
  },
  async submitForm() {
    await formField(page).submit.click();
  },
  async fillAll() {
    await this.fillFullName();
    await this.fillCompany();
    await this.fillEmail();
    if (data["Area of Interest"]) await this.selectAreaOfInterest();
    await this.fillMessage();
  },
  async verifySubmission() {
    await expect(page.getByText(SUCCESS_MESSAGE)).toBeVisible();
  },
});

// Isi semua field lalu klik tombol kirim
export async function submitContactForm(page: Page, data: CustomerData) {
  const contactForm = fillForm({ data, page });
  await contactForm.fillAll();
  await contactForm.submitForm();
}

/**
 * Buka section kontak dan siapkan pencatat request API kontak.
 * Mengembalikan "sentRequests": daftar request yang terkirim (kosong = form tidak terkirim).
 *
 * Secara default API di-mock agar server tidak dibanjiri email tes.
 * Jalankan dengan REAL_API=true untuk mengirim ke server sungguhan,
 * atau panggil openContactForm(page, false) untuk satu test saja.
 */
export async function openContactForm(page: Page, mock = process.env.REAL_API !== "true") {
  const sentRequests: Request[] = [];
  page.on("request", (request) => {
    if (request.url().includes(SITE.api.contactEndpoint) && request.method() === "POST") {
      sentRequests.push(request);
    }
  });

  if (mock) await mockContactApi(page);
  await openHome(page, CONTACT_ID);
  return sentRequests;
}

// Mock respons API kontak dengan status tertentu (200 = sukses, 400 ke atas = gagal)
// delayMs dipakai untuk mensimulasikan server lambat
export async function mockContactApi(page: Page, status = 200, delayMs = 0) {
  let responseBody = { success: true, error: "" };
  if (status >= 400) {
    responseBody = { success: false, error: "Server error" };
  }

  await page.route(`**/${SITE.api.contactEndpoint}`, async (route) => {
    await page.waitForTimeout(delayMs);
    await route.fulfill({
      status: status,
      contentType: "application/json",
      body: JSON.stringify(responseBody),
    });
  });
}

// Pastikan field ditolak validasi (checkValidity() = false berarti browser menolak isi field)
export async function expectFieldInvalid(page: Page, field: FieldName) {
  const valid = await formField(page)[field].evaluate((el: HTMLInputElement) => el.checkValidity());
  expect(valid, `Field "${field}" seharusnya tidak valid`).toBe(false);
}

export async function expectFieldValid(page: Page, field: FieldName) {
  const valid = await formField(page)[field].evaluate((el: HTMLInputElement) => el.checkValidity());
  expect(valid, `Field "${field}" seharusnya valid`).toBe(true);
}

// Pastikan form TIDAK terkirim (tidak ada request dan tidak ada pesan sukses)
export async function expectNotSubmitted(page: Page, sentRequests: Request[]) {
  await page.waitForTimeout(500);
  expect(sentRequests.length, "Form seharusnya tidak terkirim").toBe(0);
  await expect(page.getByText(SUCCESS_MESSAGE)).toBeHidden();
}

// Pastikan form terkirim 1 kali, pesan sukses tampil, dan form ter-reset
export async function expectSubmitted(page: Page, sentRequests: Request[]) {
  await expect(page.getByText(SUCCESS_MESSAGE)).toBeVisible({ timeout: 15000 });
  expect(sentRequests.length).toBe(1);
  await expect(formField(page).name).toHaveValue("");
  await expect(formField(page).email).toHaveValue("");
  await expect(formField(page).message).toHaveValue("");
}

// Ambil isi (payload JSON) dari request terakhir yang terkirim
export function lastPayload(sentRequests: Request[]) {
  return sentRequests[sentRequests.length - 1].postDataJSON();
}
