import type { APIRequestContext } from "@playwright/test";
import { expect } from "@playwright/test";
import { SITE } from "../config";

export const CONTACT_API = SITE.baseUrl + SITE.api.contactEndpoint;

// Payload valid default. Field bisa ditimpa, contoh: validPayload({ name: "" })
export function validPayload(override: Record<string, unknown> = {}) {
  return {
    name: "Budi Santoso",
    company: "PT Maju Jaya",
    email: "budi@test.com",
    interest: SITE.contactForm.interestOptions[0],
    message: "Tes enquiry dari automation",
    ...override,
  };
}

// Kirim POST JSON ke endpoint contact, hasilnya: status, isi respons (text), dan headers
export async function postContact(request: APIRequestContext, body: unknown) {
  const response = await request.post(CONTACT_API, { data: body as object });
  return {
    status: response.status(),
    text: await response.text(),
    headers: response.headers(),
  };
}

// Kirim POST dengan body berupa teks mentah, Content-Type bisa diganti
export async function postRaw(request: APIRequestContext, body: string, contentType = "application/json") {
  const response = await request.post(CONTACT_API, {
    data: body,
    headers: { "Content-Type": contentType },
  });
  return {
    status: response.status(),
    text: await response.text(),
  };
}

// Pastikan status termasuk salah satu yang diharapkan, contoh: expectStatusIn(400, [400, 415])
export function expectStatusIn(status: number, expectedStatus: number[]) {
  expect(expectedStatus, `Status dari server: ${status}`).toContain(status);
}

// Pastikan respons tidak membocorkan info internal server (stack trace, path file, nama library)
export function expectNoInternalInfo(text: string) {
  expect(text, "Respons berisi stack trace").not.toContain("    at ");
  expect(text, "Respons berisi path node_modules").not.toContain("node_modules");
  expect(text, "Respons berisi detail error internal").not.toMatch(/SQL|syntax error|ECONN|nodemailer|stack/i);
}
