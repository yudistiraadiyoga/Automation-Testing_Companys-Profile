import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { SITE } from "../config";
import { waitForScrollEnd } from "./base.helper";

// Semua selector navbar diambil dari config website
const selector = SITE.selectors;

export function navbar(page: Page) {
  return page.locator(selector.navbar);
}

// Ambil link menu navbar berdasarkan namanya, contoh: navMenu(page, "About")
export function navMenu(page: Page, name: string) {
  return page.locator(selector.navLinks).getByRole("link", { name, exact: true });
}

export async function clickNavMenu(page: Page, name: string) {
  await navMenu(page, name).click();
  await waitForScrollEnd(page);
}

export async function clickLogo(page: Page) {
  await page.locator(selector.navLogo).click();
  await waitForScrollEnd(page);
}

// Klik tombol CTA di navbar (contoh: "Get in Touch")
export async function clickNavCta(page: Page) {
  await page.locator(selector.navCta).click();
  await waitForScrollEnd(page);
}

// Tombol menu mobile (hamburger)
export function hamburgerButton(page: Page) {
  return page.locator(selector.hamburger).first();
}

// Daftar menu navbar (wadah semua link menu)
export function navMenuList(page: Page) {
  return page.locator(selector.navLinks);
}

// Pastikan navbar menempel di atas layar
export async function expectNavbarSticky(page: Page) {
  await expect(navbar(page)).toBeInViewport();
  const box = await navbar(page).boundingBox();
  expect(box!.y, "Navbar tidak menempel di atas layar").toBeLessThanOrEqual(1);
}

// Pastikan URL berakhir dengan hash tertentu, contoh: expectHash(page, "about") -> ".../#about"
export async function expectHash(page: Page, id: string) {
  await expect(page).toHaveURL(new RegExp(`#${id}$`));
}
