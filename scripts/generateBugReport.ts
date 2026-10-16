/**
 * Membuat Bug Report Excel dari hasil automation test.
 *
 * Cara pakai:
 *   1. Jalankan test dulu        : pnpm run test:ui
 *   2. Buat bug report           : pnpm run bug-report
 *   3. Hasilnya ada di folder    : reports/
 *
 * Opsional: isi nama tester, contoh  TESTER=Lavy pnpm run bug-report
 *
 * Alurnya:
 *   reports/results.json (hasil test) -> ambil test yang gagal -> kelompokkan per bug
 *   (pakai src/data/bugCatalog.data.ts) -> tulis ke template Excel (sheet "Staging")
 */
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { SITE } from "../src/config";
import { BUG_CATALOG, BugInfo, Severity, findBugByTc } from "../src/data/bugCatalog.data";

const RESULTS_FILE = "reports/results.json";
const TEMPLATE_FILE = "src/data/Template Bug Report.xlsx";
const OUTPUT_FOLDER = "reports";
const SHEET_NAME = "Staging";
const FIRST_BUG_ROW = 3; // baris 1 = header, baris 2 = tanggal, bug mulai baris 3
const TESTER = process.env.TESTER ?? "";

// Urutan severity, dari paling parah
const SEVERITY_ORDER: Severity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "TRIVIAL"];

// ---------------------------------------------------------------------
// 1. Ambil semua test yang gagal dari results.json
// ---------------------------------------------------------------------

interface FailedTest {
  tc: string; // nomor TC, contoh "TCC-20"
  title: string; // judul lengkap test
  error: string; // pesan error (tanpa kode warna)
  screenshot?: string; // path screenshot saat gagal
}

// Hapus kode warna terminal dari pesan error
function cleanText(text: string) {
  return text.replace(/\u001b\[[0-9;]*m/g, "").trim();
}

// Cari nomor TC (contoh "TCC-20") dari judul test, mulai dari judul paling dalam
function findTcId(titles: string[], annotations: { type: string; description?: string }[]) {
  const annotationTc = annotations.find((item) => item.type === "TC ID");
  if (annotationTc?.description) return annotationTc.description;

  for (let i = titles.length - 1; i >= 0; i--) {
    const match = titles[i].match(/TC[A-Z]*-\d+/);
    if (match) return match[0];
  }
  return "TANPA-TC";
}

function collectFailedTests(): FailedTest[] {
  const results = JSON.parse(fs.readFileSync(RESULTS_FILE, "utf-8"));
  const failedTests: FailedTest[] = [];

  // results.json berbentuk pohon: suite -> suite di dalamnya -> specs -> tests
  function readSuite(suite: any, parentTitles: string[]) {
    const titles = suite.title ? [...parentTitles, suite.title] : parentTitles;

    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests) {
        const lastResult = test.results[test.results.length - 1];
        const gagal = lastResult && (lastResult.status === "failed" || lastResult.status === "timedOut");
        if (!gagal) continue;

        const allTitles = [...titles, spec.title];
        const screenshot = lastResult.attachments?.find((item: any) => item.name === "screenshot")?.path;

        failedTests.push({
          tc: findTcId(allTitles, test.annotations ?? []),
          title: allTitles.slice(1).join(" > "), // buang nama file di depan
          error: cleanText(lastResult.error?.message ?? "Test timeout"),
          screenshot: screenshot,
        });
      }
    }

    for (const child of suite.suites ?? []) {
      readSuite(child, titles);
    }
  }

  for (const suite of results.suites) {
    readSuite(suite, []);
  }

  return failedTests;
}

// ---------------------------------------------------------------------
// 2. Kelompokkan test gagal per bug
// ---------------------------------------------------------------------

interface BugRow {
  info: BugInfo;
  tcs: string[]; // TC yang benar-benar gagal di run ini
  failedTests: FailedTest[];
}

// Bug yang belum ada di katalog: dibuat otomatis dari pesan error
function autoBugInfo(test: FailedTest): BugInfo {
  const errorLines = test.error.split("\n").filter((line) => line.trim() !== "");
  return {
    tcs: [test.tc],
    section: test.title.split(" > ")[0],
    issue: errorLines.slice(0, 4).join("\n"),
    steps: [`Lihat langkah pada test case ${test.tc}`, `Test otomatis: ${test.title}`],
    expected: `Sesuai expected result pada test case ${test.tc}`,
    suggest: "",
    severity: "MEDIUM",
  };
}

function groupFailedTests(failedTests: FailedTest[]): BugRow[] {
  const groups = new Map<BugInfo, BugRow>();

  for (const test of failedTests) {
    // Cari bug di katalog. Jika tidak ada, buat bug baru per TC.
    let info = findBugByTc(test.tc);
    if (!info) {
      const sameTc = [...groups.values()].find((row) => !BUG_CATALOG.includes(row.info) && row.tcs.includes(test.tc));
      info = sameTc ? sameTc.info : autoBugInfo(test);
    }

    if (!groups.has(info)) {
      groups.set(info, { info: info, tcs: [], failedTests: [] });
    }
    const row = groups.get(info)!;
    row.failedTests.push(test);
    if (!row.tcs.includes(test.tc)) row.tcs.push(test.tc);
  }

  // Urutkan dari severity paling parah
  return [...groups.values()].sort(
    (a, b) => SEVERITY_ORDER.indexOf(a.info.severity) - SEVERITY_ORDER.indexOf(b.info.severity),
  );
}

// ---------------------------------------------------------------------
// 3. Tulis ke template Excel
// ---------------------------------------------------------------------

// Ubah daftar langkah menjadi teks bernomor: "1. ...\n2. ..."
function numbered(lines: string[]) {
  return lines.map((line, index) => `${index + 1}. ${line}`).join("\n");
}

// Isi kolom Note: TC terkait dan daftar test yang gagal (maksimal 10 supaya tidak terlalu panjang)
function buildNote(row: BugRow) {
  const testList = row.failedTests.slice(0, 10).map((test) => `- ${test.title}`);
  if (row.failedTests.length > 10) testList.push(`- ... dan ${row.failedTests.length - 10} test lainnya`);
  return [`TC: ${row.tcs.join(", ")}`, `Test gagal (${row.failedTests.length}):`, ...testList].join("\n");
}

// Salin screenshot ke folder reports/attachments supaya ikut terbawa bersama file Excel
function copyScreenshot(row: BugRow, bugNumber: number) {
  const testWithScreenshot = row.failedTests.find((test) => test.screenshot && fs.existsSync(test.screenshot));
  if (!testWithScreenshot) return undefined;

  const fileName = `BUG-${String(bugNumber).padStart(2, "0")}.png`;
  fs.mkdirSync(path.join(OUTPUT_FOLDER, "attachments"), { recursive: true });
  fs.copyFileSync(testWithScreenshot.screenshot!, path.join(OUTPUT_FOLDER, "attachments", fileName));
  return `attachments/${fileName}`;
}

async function writeExcel(rows: BugRow[], testDate: Date) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(TEMPLATE_FILE);
  const sheet = workbook.getWorksheet(SHEET_NAME)!;

  // Simpan style & dropdown dari baris contoh di template (baris 3), dipakai untuk semua baris bug
  const templateRow = sheet.getRow(FIRST_BUG_ROW);
  const columnStyles: Partial<ExcelJS.Style>[] = [];
  const columnValidations: (ExcelJS.DataValidation | undefined)[] = [];
  for (let col = 1; col <= 12; col++) {
    columnStyles[col] = JSON.parse(JSON.stringify(templateRow.getCell(col).style));
    columnValidations[col] = templateRow.getCell(col).dataValidation;
  }

  // Bersihkan contoh tanggal tambahan di template (baris 6 dan 11) supaya bisa diisi bug
  for (const range of ["A6:L6", "A11:L11"]) {
    sheet.unMergeCells(range);
  }

  // Baris 2: tanggal test
  sheet.getCell("A2").value = testDate;

  // Baris 3 dan seterusnya: data bug
  rows.forEach((row, index) => {
    const bugNumber = index + 1;
    const attachment = copyScreenshot(row, bugNumber);
    const excelRow = sheet.getRow(FIRST_BUG_ROW + index);

    const values = [
      row.info.section, // A Section
      numbered(row.info.steps), // B Steps
      row.info.issue, // C Issue
      row.info.expected, // D Expected Result
      row.info.suggest, // E Suggest
      attachment ? { text: `BUG-${String(bugNumber).padStart(2, "0")}.png`, hyperlink: attachment } : "", // F Attachment
      row.info.severity, // G Severity
      "", // H Status Dev (diisi developer)
      "", // I Developer (diisi developer)
      "New", // J Status Test
      TESTER, // K Tester
      buildNote(row), // L Note
    ];

    values.forEach((value, i) => {
      const col = i + 1;
      const cell = excelRow.getCell(col);
      cell.style = JSON.parse(JSON.stringify(columnStyles[col]));
      cell.alignment = { ...cell.alignment, wrapText: true, vertical: "top" };
      cell.value = value as ExcelJS.CellValue;
      if (columnValidations[col]) cell.dataValidation = columnValidations[col]!;
    });
  });

  // Hapus isi sisa baris contoh dari template di bawah data bug
  for (let r = FIRST_BUG_ROW + rows.length; r <= 44; r++) {
    for (let col = 1; col <= 12; col++) {
      const cell = sheet.getRow(r).getCell(col);
      cell.value = null;
      cell.style = JSON.parse(JSON.stringify(columnStyles[col]));
      if (columnValidations[col]) cell.dataValidation = columnValidations[col]!;
    }
  }

  const dateText = testDate.toISOString().slice(0, 10);
  const outputFile = path.join(OUTPUT_FOLDER, `Bug Report - ${SITE.name} - ${dateText}.xlsx`);
  await workbook.xlsx.writeFile(outputFile);
  return outputFile;
}

// ---------------------------------------------------------------------
// Jalankan
// ---------------------------------------------------------------------

async function main() {
  if (!fs.existsSync(RESULTS_FILE)) {
    console.log(`File ${RESULTS_FILE} belum ada. Jalankan test dulu: pnpm run test:ui`);
    process.exit(1);
  }

  const results = JSON.parse(fs.readFileSync(RESULTS_FILE, "utf-8"));
  const start = new Date(results.stats.startTime);
  const testDate = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()));

  const failedTests = collectFailedTests();
  const rows = groupFailedTests(failedTests);
  const outputFile = await writeExcel(rows, testDate);

  const autoRows = rows.filter((row) => !BUG_CATALOG.includes(row.info));
  console.log(`Test gagal : ${failedTests.length}`);
  console.log(`Bug        : ${rows.length}`);
  if (autoRows.length > 0) {
    console.log(`Perlu dicek: ${autoRows.length} bug belum ada di katalog (${autoRows.map((row) => row.tcs.join("/")).join(", ")})`);
    console.log("             Deskripsinya dibuat otomatis, lengkapi di src/data/bugCatalog.data.ts");
  }
  console.log(`File       : ${outputFile}`);
}

main();
