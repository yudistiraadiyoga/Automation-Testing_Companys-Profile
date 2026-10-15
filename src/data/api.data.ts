import { SITE } from "../config";
import { validPayload } from "../helpers/api.helper";

/**
 * Data uji API kontak (GENERIK untuk semua website company profile).
 * Batas panjang diambil dari "rules" di config website.
 */

const rules = SITE.contactForm.rules;

// Body yang harus ditolak server dengan status 400
export const INVALID_BODIES = [
  { tc: "TCAPI-11", kasus: "Name kosong", body: validPayload({ name: "" }) },
  { tc: "TCAPI-12", kasus: "Email kosong", body: validPayload({ email: "" }) },
  { tc: "TCAPI-13", kasus: "Email tanpa domain", body: validPayload({ email: "budi@" }) },
  { tc: "TCAPI-13", kasus: "Email tanpa @", body: validPayload({ email: "budi.com" }) },
  { tc: "TCAPI-13", kasus: "Email tanpa nama", body: validPayload({ email: "@test.com" }) },
  { tc: "TCAPI-14", kasus: "Message kosong", body: validPayload({ message: "" }) },
  { tc: "TCAPI-15", kasus: "Interest di luar daftar", body: validPayload({ interest: "Senjata" }) },
  { tc: "TCAPI-17", kasus: "Name & Message hanya spasi", body: validPayload({ name: "   ", message: "   " }) },
  { tc: "TCAPI-21", kasus: "Tipe data salah", body: validPayload({ name: 12345, email: true }) },
  { tc: "TCAPI-29", kasus: "Name melebihi batas", body: validPayload({ name: "A".repeat(rules.name.max! * 6) }) },
  { tc: "TCAPI-30", kasus: "Email lebih dari 254 karakter", body: validPayload({ email: "a".repeat(250) + "@test.com" }) },
  { tc: "TCAPI-31", kasus: "Email header injection", body: validPayload({ email: "budi@test.com\r\nBcc: attacker@test.com" }) },
  { tc: "TCAPI-32", kasus: "Body object kosong", body: {} },
  { tc: "TCAPI-33", kasus: "Semua field null", body: { name: null, email: null, interest: null, message: null } },
  { tc: "TCAPI-34", kasus: "Field bertipe array/object", body: validPayload({ name: ["Budi", "Ani"], email: { a: "budi@test.com" } }) },
];

// Body mentah (bukan JSON valid) / Content-Type salah
export const INVALID_RAW_BODIES = [
  { tc: "TCAPI-23", kasus: "Body JSON rusak", body: '{"name": "Budi", "email": ', contentType: "application/json", expected: [400] },
  { tc: "TCAPI-24", kasus: "Content-Type text/plain", body: "name=Budi&email=budi@test.com", contentType: "text/plain", expected: [400, 415] },
  { tc: "TCAPI-32", kasus: "Body string kosong", body: "", contentType: "application/json", expected: [400] },
];

// HTTP method selain POST harus ditolak
export const INVALID_METHODS = [
  { tc: "TCAPI-25", method: "GET", expected: [404, 405] },
  { tc: "TCAPI-26", method: "PUT", expected: [405] },
  { tc: "TCAPI-26", method: "DELETE", expected: [405] },
];
