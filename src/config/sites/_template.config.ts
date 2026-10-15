import type { SiteConfig } from "../site.types";

/**
 * TEMPLATE config untuk website company profile baru.
 *
 * Cara pakai:
 * 1. Salin file ini menjadi src/config/sites/<nama>.config.ts (contoh: acme.config.ts)
 * 2. Ganti nama variabel "template" menjadi nama website (contoh: acme)
 * 3. Isi semua nilai sesuai website (buka website -> klik kanan -> Inspect untuk melihat selector)
 * 4. Daftarkan di src/config/index.ts
 * 5. Jalankan: SITE=<nama> pnpm test
 */
export const template: SiteConfig = {
  name: "Nama Perusahaan",
  baseUrl: process.env.BASE_URL ?? "https://staging.contoh-perusahaan.com/",
  pageTitle: "Nama Perusahaan - Tagline",
  ignoredErrorUrls: ["cloudflareinsights.com", "google-analytics.com", "googletagmanager.com"],

  // Urutkan dari atas ke bawah. Section pertama = hero. "menu" = nama menu di navbar.
  sections: [
    { id: "hero", title: "Judul besar di hero" },
    { id: "about", title: "Judul section About", menu: "About" },
    { id: "services", title: "Judul section Services", menu: "Services" },
    { id: "contact", title: "Judul section Contact", menu: "Contact" },
  ],
  contactSectionId: "contact",

  selectors: {
    navbar: "nav",
    navLogo: "nav .logo",
    navLinks: "nav ul",
    navCta: "nav .cta",
    hamburger: "nav button.hamburger",
    sectionTitle: "h2",
    footer: "footer",
  },

  hero: {
    texts: ["Judul besar di hero", "Sub judul hero"],
    buttons: [{ name: "Our Services", target: "services" }],
    scrollHint: undefined, // isi selector jika ada indikator scroll
  },

  contactForm: {
    selectors: {
      name: "input[name='name']",
      company: "input[name='company']",
      email: "input[name='email']",
      interest: "select[name='interest']",
      message: "textarea[name='message']",
      submit: "button[type='submit']",
    },
    labels: { name: "Name", company: "Company", email: "Email", interest: "Category", message: "Message" },
    placeholderOption: "Select a category...",
    interestOptions: ["Kategori 1", "Kategori 2"],
    successMessage: "Pesan sukses setelah form terkirim",
    errorMessage: "Pesan error saat form gagal terkirim",
    loadingText: "Sending...",
    rules: {
      name: { required: true, min: 2, max: 50 },
      company: { required: false, max: 100 },
      email: { required: true, max: 254 },
      message: { required: true, min: 10, max: 1000 },
    },
  },

  api: {
    contactEndpoint: "api/contact",
  },

  footer: {
    texts: ["Nama Perusahaan", "All Rights Reserved."],
    copyrightName: "Nama Perusahaan",
  },
};
