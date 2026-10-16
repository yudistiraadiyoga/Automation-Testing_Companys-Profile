import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";
import { SITE } from "../config";

// TC yang hanya bisa dicek manual (screen reader, inbox email, perangkat fisik, dll.)
// Tetap didaftarkan agar muncul di report sebagai "skipped" beserta alasannya.
export function manualTest(title: string, reason: string) {
  test(title, () => {
    test.skip(true, `Manual: ${reason}`);
  });
}

// Semua data website diambil dari config (src/config/sites/<nama>.config.ts)
export const BASE_URL = SITE.baseUrl;

// Semua section di halaman (dari config), contoh: { id: "about", title: "...", menu: "About" }
export const SECTIONS = SITE.sections;

// Section yang punya menu di navbar
export const MENU_SECTIONS = SITE.sections.filter((section) => section.menu !== undefined);

// id section pertama (hero) dan section kontak
export const HERO_ID = SITE.sections[0].id;
export const CONTACT_ID = SITE.contactSectionId;

// Ambil judul section berdasarkan id, contoh: sectionTitle("about")
export function sectionTitle(id: string) {
  const section = SITE.sections.find((item) => item.id === id);
  return section!.title;
}

// Buka halaman utama, bisa langsung ke anchor (contoh: openHome(page, "contact"))
export async function openHome(page: Page, hash = "") {
  const url = hash ? `${BASE_URL}#${hash}` : BASE_URL;
  await page.goto(url, { waitUntil: "load" });
  await waitForScrollEnd(page);
}

// Tunggu sampai smooth scroll selesai (posisi scroll tidak berubah lagi)
export async function waitForScrollEnd(page: Page) {
  let last = -1;
  for (let i = 0; i < 40; i++) {
    const current = await page.evaluate(() => window.scrollY);
    if (current === last) return;
    last = current;
    await page.waitForTimeout(150);
  }
}

// Tunggu semua animasi CSS yang punya akhir (fade-in, slide, dll.) selesai.
// Animasi yang berulang terus (infinite) diabaikan karena tidak pernah selesai.
export async function waitForAnimations(page: Page) {
  await page.evaluate(async () => {
    const animations = document.getAnimations();
    const finiteAnimations = animations.filter((animation) => {
      const endTime = animation.effect?.getComputedTiming().endTime;
      return endTime !== Infinity;
    });
    await Promise.all(finiteAnimations.map((animation) => animation.finished));
  });
}

// Scroll ke section tertentu tanpa lewat navbar
export async function scrollToSection(page: Page, id: string) {
  await page.locator(`#${id}`).scrollIntoViewIfNeeded();
  await waitForScrollEnd(page);
}

// Pastikan section sedang terlihat di layar (bagian atas section dekat posisi scroll)
export async function expectSectionInView(page: Page, id: string) {
  await expect(page.locator(`#${id}`)).toBeInViewport();
}

// Pastikan judul section tidak tertutup navbar
export async function expectTitleNotUnderNavbar(page: Page, id: string) {
  const title = page.locator(`#${id} ${SITE.selectors.sectionTitle}`);
  await expect(title).toBeInViewport();
  const navBox = await page.locator(SITE.selectors.navbar).boundingBox();
  const titleBox = await title.boundingBox();
  expect(titleBox!.y, `Judul #${id} tertutup navbar`).toBeGreaterThanOrEqual(navBox!.y + navBox!.height);
}

// Pastikan tidak ada scroll horizontal
export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, "Halaman memiliki scroll horizontal").toBeLessThanOrEqual(0);
}

// Pastikan semua elemen tidak keluar dari batas kiri/kanan layar (tidak terpotong)
export async function expectInsideViewportWidth(page: Page, selector: string) {
  const screenWidth = page.viewportSize()!.width;
  const elements = page.locator(selector);
  const total = await elements.count();

  for (let i = 0; i < total; i++) {
    const box = await elements.nth(i).boundingBox();
    if (box === null) continue; // elemen tidak tampil, lewati

    expect(box.x, `${selector} ke-${i + 1} terpotong di kiri`).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width, `${selector} ke-${i + 1} terpotong di kanan`).toBeLessThanOrEqual(screenWidth);
  }
}

// Ubah lebar layar (tinggi default 800)
export async function setWidth(page: Page, width: number, height = 800) {
  await page.setViewportSize({ width, height });
}

// Blokir file berdasarkan ekstensi, contoh: blockResources(page, ["woff2", "webp"])
export async function blockResources(page: Page, extensions: string[]) {
  await page.route("**/*", async (route) => {
    const url = route.request().url().split("?")[0];
    const ext = url.split(".").pop() ?? "";

    if (extensions.includes(ext)) {
      await route.abort(); // file diblokir
    } else {
      await route.continue(); // file lain dimuat normal
    }
  });
}

// URL pihak ketiga (analitik, dll.) yang sering diblokir jaringan/adblock -> bukan bug website
function isIgnored(url: string) {
  return SITE.ignoredErrorUrls.some((ignored) => url.includes(ignored));
}

// Kumpulkan error JavaScript, request gagal, dan response 4xx/5xx
export function trackPageErrors(page: Page) {
  const errors: string[] = [];

  page.on("pageerror", (error) => {
    errors.push(`JavaScript error: ${error.message}`);
  });

  page.on("requestfailed", (request) => {
    const reason = request.failure()?.errorText ?? "";
    // "ABORTED" = request dibatalkan browser saat pindah halaman/scroll (normal, bukan error)
    const dibatalkan = reason.includes("ABORTED");

    if (!dibatalkan && !isIgnored(request.url())) {
      errors.push(`Request gagal: ${request.url()} (${reason})`);
    }
  });

  page.on("response", (response) => {
    if (response.status() >= 400 && !isIgnored(response.url())) {
      errors.push(`Status ${response.status()}: ${response.url()}`);
    }
  });

  return errors;
}

// Catat semua dialog (alert) yang muncul, lalu tutup
export function trackDialogs(page: Page) {
  const dialogs: string[] = [];
  page.on("dialog", async (dialog) => {
    dialogs.push(dialog.message());
    await dialog.dismiss();
  });
  return dialogs;
}

// Hitung gambar <img> yang gagal dimuat (tampil sebagai ikon gambar rusak)
export async function countBrokenImages(page: Page) {
  const images = page.locator("img");
  const total = await images.count();
  let broken = 0;

  for (let i = 0; i < total; i++) {
    const width = await images.nth(i).evaluate((img: HTMLImageElement) => img.naturalWidth);
    if (width === 0) broken = broken + 1;
  }
  return broken;
}
