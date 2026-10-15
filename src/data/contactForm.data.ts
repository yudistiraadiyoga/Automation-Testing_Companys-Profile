import { SITE } from "../config";

/**
 * Data uji form kontak.
 * Data ini GENERIK (berlaku untuk semua website company profile).
 * Nilai batas (boundary) dihitung otomatis dari "rules" di config website,
 * jadi jika batas berbeda cukup ubah config, data uji ikut menyesuaikan.
 */

export interface InputData {
  tc: string; // nomor test case
  kasus: string; // penjelasan singkat data uji
  input: string; // nilai yang diisi ke field
}

const rules = SITE.contactForm.rules;

// Buat teks dengan panjang tertentu, contoh: textOfLength("B", 3) -> "BBB"
function textOfLength(char: string, length: number) {
  return char.repeat(length);
}

// ---------------------------------------------------------------------
// INPUT YANG HARUS DITOLAK
// ---------------------------------------------------------------------

export const INVALID_NAMES: InputData[] = [
  { tc: "TCC-06", kasus: "Name kosong", input: "" },
  { tc: "TCC-11", kasus: "Name hanya spasi", input: "   " },
  { tc: "TCC-20", kasus: "Name angka saja", input: "12345" },
  { tc: "TCC-21", kasus: "Name karakter spesial saja", input: "@#$%^&*" },
  { tc: "TCC-21", kasus: "Name karakter spesial saja", input: "----" },
  { tc: "TCC-21", kasus: "Name karakter spesial saja", input: "..." },
  { tc: "TCC-22", kasus: "Name huruf + angka", input: "Budi123" },
  { tc: "TCC-22", kasus: "Name huruf + simbol", input: "Budi@Santoso" },
  { tc: "TCC-22", kasus: "Name huruf + angka + simbol", input: "Budi_#1" },
  { tc: "TCC-23", kasus: "Name berisi emoji", input: "Budi 😀" },
  { tc: "TCC-23", kasus: "Name emoji saja", input: "😀😀" },
  { tc: "TCC-24", kasus: `Name ${rules.name.min! - 1} karakter (min-1)`, input: textOfLength("A", rules.name.min! - 1) },
  { tc: "TCC-30", kasus: "Name SQL injection", input: "' OR '1'='1" },
];

export const INVALID_COMPANIES: InputData[] = [
  { tc: "TCC-32", kasus: "Company karakter spesial saja", input: "@#$%" },
  { tc: "TCC-32", kasus: "Company karakter spesial saja", input: "&&&" },
];

export const INVALID_EMAILS: InputData[] = [
  { tc: "TCC-07", kasus: "Email kosong", input: "" },
  { tc: "TCC-08", kasus: "Email tanpa domain", input: "budi@" },
  { tc: "TCC-08", kasus: "Email tanpa @", input: "budi.com" },
  { tc: "TCC-08", kasus: "Email tanpa nama", input: "@test.com" },
  { tc: "TCC-08", kasus: "Email berisi spasi", input: "budi test@x.com" },
  { tc: "TCC-35", kasus: "Email hanya spasi", input: "   " },
  { tc: "TCC-36", kasus: "Email @ ganda", input: "budi@@test.com" },
  { tc: "TCC-36", kasus: "Email @ ganda", input: "budi@test@test.com" },
  { tc: "TCC-37", kasus: "Email diawali titik", input: ".budi@test.com" },
  { tc: "TCC-37", kasus: "Email titik sebelum @", input: "budi.@test.com" },
  { tc: "TCC-37", kasus: "Email titik ganda", input: "budi..santoso@test.com" },
  { tc: "TCC-37", kasus: "Email titik ganda di domain", input: "budi@test..com" },
  { tc: "TCC-38", kasus: "Email tanpa TLD", input: "budi@test" },
  { tc: "TCC-38", kasus: "Email TLD 1 huruf", input: "budi@test.c" },
  { tc: "TCC-38", kasus: "Email domain diawali -", input: "budi@-test.com" },
  { tc: "TCC-38", kasus: "Email domain berisi _", input: "budi@test_mail.com" },
  { tc: "TCC-39", kasus: "Email berisi #", input: "budi#@test.com" },
  { tc: "TCC-39", kasus: "Email berisi <>", input: "budi<>@test.com" },
  { tc: "TCC-39", kasus: "Email berisi koma", input: "budi,s@test.com" },
  { tc: "TCC-39", kasus: "Email berisi spasi sebelum @", input: "budi @test.com" },
  { tc: "TCC-41", kasus: "Email local part 65 karakter", input: textOfLength("a", 65) + "@test.com" },
  { tc: "TCC-41", kasus: "Email total 255 karakter", input: textOfLength("a", 60) + "@" + textOfLength("b", 190) + ".com" },
];

export const INVALID_MESSAGES: InputData[] = [
  { tc: "TCC-09", kasus: "Message kosong", input: "" },
  { tc: "TCC-11", kasus: "Message hanya spasi", input: "   " },
  { tc: "TCC-45", kasus: `Message ${rules.message.min! - 1} karakter (min-1)`, input: textOfLength("M", rules.message.min! - 1) },
  { tc: "TCC-49", kasus: "Message hanya Enter", input: "\n\n\n\n\n" },
  { tc: "TCC-49", kasus: "Message hanya Tab + spasi", input: "\t   " },
  { tc: "TCC-50", kasus: "Message karakter spesial saja", input: "!!!!!!!!!!!!" },
  { tc: "TCC-50", kasus: "Message karakter spesial saja", input: "@#$%^&*()_+" },
];

// ---------------------------------------------------------------------
// INPUT YANG HARUS TETAP DITERIMA
// field = nama key di CustomerData ("FULL NAME", "Company", "Email Address", "MASSAGE")
// ---------------------------------------------------------------------

export const ACCEPTED_INPUTS = [
  { tc: "TCC-13", kasus: "Name huruf Mandarin", field: "FULL NAME", input: "陳大文" },
  { tc: "TCC-13", kasus: "Name dengan apostrof", field: "FULL NAME", input: "O'Brien" },
  { tc: "TCC-13", kasus: "Name dengan aksen", field: "FULL NAME", input: "José" },
  { tc: "TCC-25", kasus: `Name ${rules.name.min} karakter (min)`, field: "FULL NAME", input: textOfLength("A", rules.name.min!) },
  { tc: "TCC-26", kasus: `Name ${rules.name.max} karakter (max)`, field: "FULL NAME", input: textOfLength("B", rules.name.max!) },
  { tc: "TCC-42", kasus: "Email huruf kapital", field: "Email Address", input: "BUDI@TEST.COM" },
  { tc: "TCC-46", kasus: `Message ${rules.message.min} karakter (min)`, field: "MASSAGE", input: textOfLength("M", rules.message.min!) },
  { tc: "TCC-47", kasus: `Message ${rules.message.max} karakter (max)`, field: "MASSAGE", input: textOfLength("M", rules.message.max!) },
] as const;

// ---------------------------------------------------------------------
// INPUT MELEBIHI BATAS MAKSIMAL (max + 1)
// ---------------------------------------------------------------------

export const OVER_MAX_INPUTS = [
  { tc: "TCC-27", kasus: `Name ${rules.name.max! + 1} karakter`, field: "name", max: rules.name.max! },
  { tc: "TCC-33", kasus: `Company ${rules.company.max! + 1} karakter`, field: "company", max: rules.company.max! },
  { tc: "TCC-48", kasus: `Message ${rules.message.max! + 1} karakter`, field: "message", max: rules.message.max! },
] as const;

// ---------------------------------------------------------------------
// INPUT BERBAHAYA (XSS / HTML / SQL) - tidak boleh dieksekusi
// ---------------------------------------------------------------------

export const DANGEROUS_INPUTS = [
  { tc: "TCC-14", kasus: "XSS di Message", field: "MASSAGE", input: "<script>alert(1)</script>" },
  { tc: "TCC-29", kasus: "HTML di Name", field: "FULL NAME", input: "<b>Budi</b>" },
  { tc: "TCC-29", kasus: "HTML onerror di Name", field: "FULL NAME", input: "<img src=x onerror=alert(1)>" },
  { tc: "TCC-34", kasus: "XSS di Company", field: "Company", input: "<script>alert(1)</script>" },
  { tc: "TCC-51", kasus: "HTML + link di Message", field: "MASSAGE", input: "<h1>Promo</h1><a href='http://evil.com'>klik</a>" },
  { tc: "TCC-52", kasus: "SQL injection di Message", field: "MASSAGE", input: "'; DROP TABLE enquiries; --" },
] as const;
