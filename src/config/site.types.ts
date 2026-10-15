/**
 * Bentuk (tipe) konfigurasi untuk SATU website company profile.
 * Setiap website baru wajib mengisi semua bagian ini di src/config/sites/<nama>.config.ts.
 * Jika ada yang terlewat, TypeScript akan memberi tanda error di editor.
 */

export interface SectionConfig {
  id: string; // id elemen section di HTML, contoh: "about" untuk <section id="about">
  title: string; // judul section yang tampil di halaman
  menu?: string; // nama menu di navbar (kosongkan jika section tidak ada di navbar)
}

export interface ButtonConfig {
  name: string; // teks tombol, contoh: "Explore Products"
  target: string; // id section tujuan, contoh: "products"
}

export interface FieldRule {
  required: boolean;
  min?: number; // panjang minimal karakter
  max?: number; // panjang maksimal karakter
}

export interface SiteConfig {
  // ---------- Umum ----------
  name: string; // nama website (untuk laporan)
  baseUrl: string; // alamat website, diakhiri "/"
  pageTitle: string; // title di tab browser
  ignoredErrorUrls: string[]; // URL pihak ketiga yang boleh error (analitik, dll.)

  // ---------- Struktur halaman ----------
  sections: SectionConfig[]; // urutkan dari atas ke bawah, section pertama = hero
  contactSectionId: string; // id section yang berisi form kontak

  selectors: {
    navbar: string;
    navLogo: string;
    navLinks: string; // wadah daftar menu navbar
    navCta: string; // tombol CTA di navbar, contoh: "Get in Touch"
    hamburger: string; // tombol menu mobile
    sectionTitle: string; // judul di dalam setiap section
    footer: string;
  };

  // ---------- Hero ----------
  hero: {
    texts: string[]; // teks yang wajib tampil di hero
    buttons: ButtonConfig[]; // tombol CTA di hero
    scrollHint?: string; // selector indikator scroll (jika ada)
  };

  // ---------- Form kontak ----------
  contactForm: {
    selectors: {
      name: string;
      company: string;
      email: string;
      interest: string; // dropdown kategori
      message: string;
      submit: string;
    };
    labels: { name: string; company: string; email: string; interest: string; message: string };
    placeholderOption: string; // opsi pertama dropdown, contoh: "Select a category..."
    interestOptions: string[];
    successMessage: string;
    errorMessage: string;
    loadingText: string; // teks tombol saat mengirim
    rules: { name: FieldRule; company: FieldRule; email: FieldRule; message: FieldRule };
  };

  // ---------- API ----------
  api: {
    contactEndpoint: string; // path endpoint, contoh: "api/contact"
  };

  // ---------- Footer ----------
  footer: {
    texts: string[]; // teks yang wajib tampil di footer
    copyrightName: string; // teks setelah "© <tahun> "
  };
}
