import type { SiteConfig } from "./site.types";
import { yovela } from "./sites/yovela.config";

/**
 * Daftar semua website yang bisa dites.
 * Tambahkan website baru di sini, contoh: import { acme } from "./sites/acme.config";
 */
const SITES: Record<string, SiteConfig> = {
  yovela: yovela,
};

/**
 * Website yang sedang dites, dipilih lewat environment variable SITE.
 * Contoh: SITE=yovela pnpm test   (default: yovela)
 */
export const SITE_NAME = process.env.SITE ?? "yovela";

if (!SITES[SITE_NAME]) {
  throw new Error(`Config website "${SITE_NAME}" belum ada. Pilihan: ${Object.keys(SITES).join(", ")}`);
}

export const SITE: SiteConfig = SITES[SITE_NAME];
