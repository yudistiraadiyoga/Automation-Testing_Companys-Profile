import type { SiteConfig } from "./site.types";
import { yovela } from "./sites/yovela.config";
import { nexus } from "./sites/nexus.config";

/**
 * Daftar semua website yang bisa dites.
 * Tambahkan website baru di sini, contoh: import { acme } from "./sites/acme.config";
 */
const SITES: Record<string, SiteConfig> = {
  yovela: yovela,
  nexus: nexus,
};

/**
 * Website yang sedang dites, dipilih lewat environment variable SITE.
 * Contoh: SITE=nexus pnpm test   (default: nexus)
 */
export const SITE_NAME = process.env.SITE ?? "nexus";

if (!SITES[SITE_NAME]) {
  throw new Error(`Config website "${SITE_NAME}" belum ada. Pilihan: ${Object.keys(SITES).join(", ")}`);
}

export const SITE: SiteConfig = SITES[SITE_NAME];
