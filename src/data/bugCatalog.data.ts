/**
 * Katalog bug: menerjemahkan test yang gagal menjadi baris bug report.
 *
 * - Satu bug bisa mencakup beberapa TC (contoh: semua TC "layar 320px" gagal karena 1 masalah yang sama),
 *   jadi di bug report cukup ditulis 1 baris, bukan 6.
 * - Jika ada TC gagal yang belum terdaftar di sini, bug report tetap dibuat
 *   dengan deskripsi otomatis dari pesan error test. Tinggal lengkapi katalog ini nanti.
 *
 * Severity mengikuti sheet "READ!!!" di template bug report:
 *   TRIVIAL  - sangat kecil, tidak berdampak ke fungsi
 *   LOW      - kecil, dampaknya sedikit
 *   MEDIUM   - sebagian fitur terganggu, tapi masih bisa dipakai
 *   HIGH     - fitur utama tidak berjalan
 *   CRITICAL - sistem gagal / data hilang / masalah keamanan serius
 */

export type Severity = "TRIVIAL" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface BugInfo {
  tcs: string[]; // nomor TC yang termasuk bug ini
  section: string; // kolom "Section" di bug report
  issue: string; // apa yang terjadi (actual result)
  steps: string[]; // langkah reproduksi
  expected: string; // expected result
  suggest: string; // saran perbaikan untuk developer
  severity: Severity;
}

export const BUG_CATALOG: BugInfo[] = [
  {
    tcs: ["TCN-16", "TCN-17", "TCN-18", "TCCB-22", "TCCB-27"],
    section: "Navigation Bar",
    issue: "Di lebar layar 900px ke bawah (tablet & HP), menu navbar disembunyikan tapi tidak ada tombol hamburger. User tidak bisa membuka menu sama sekali.",
    steps: [
      "Buka website",
      "DevTools > Device Toolbar, atur lebar 820px (atau buka di HP)",
      "Perhatikan navbar",
    ],
    expected: "Menu berubah menjadi ikon hamburger yang bisa dibuka/ditutup, dan semua menu tetap bisa diakses.",
    suggest: "Tambahkan tombol hamburger untuk breakpoint max-width: 900px, lengkap dengan aria-label dan aria-expanded.",
    severity: "HIGH",
  },
  {
    tcs: ["TCC-11", "TCC-20", "TCC-21", "TCC-22", "TCC-23", "TCC-24", "TCC-30"],
    section: "Contact - Field Your Name",
    issue: "Field Name menerima input yang tidak valid: hanya spasi, angka saja, simbol saja, campuran huruf + angka/simbol, emoji, 1 karakter, dan teks SQL injection. Form tetap terkirim.",
    steps: [
      "Buka section Contact",
      'Isi field Name dengan salah satu data uji (contoh: "12345", "@#$%^&*", "Budi123", "A", "   ")',
      "Isi field lainnya dengan benar",
      "Klik Send Enquiry",
    ],
    expected: "Form tidak terkirim dan muncul pesan error pada field Name (nama hanya huruf, minimal 2 karakter, tidak boleh kosong/spasi saja).",
    suggest: "Tambahkan validasi Name di frontend dan backend: trim, minimal 2 karakter, hanya huruf/spasi/apostrof/titik (dukung huruf non-latin seperti 陳大文 dan José).",
    severity: "MEDIUM",
  },
  {
    tcs: ["TCC-45", "TCC-49", "TCC-50"],
    section: "Contact - Field Message",
    issue: "Field Message menerima input yang tidak valid: kurang dari 10 karakter, hanya Enter/Tab/spasi, dan hanya simbol. Form tetap terkirim.",
    steps: [
      "Buka section Contact",
      'Isi field Message dengan salah satu data uji (contoh: "Halo test", 5x Enter, "!!!!!!!!!!!!")',
      "Isi field lainnya dengan benar",
      "Klik Send Enquiry",
    ],
    expected: "Form tidak terkirim dan muncul pesan error pada field Message (minimal 10 karakter, tidak boleh hanya spasi/simbol).",
    suggest: "Tambahkan validasi Message: trim sebelum cek, minimal 10 karakter, wajib mengandung huruf/angka.",
    severity: "MEDIUM",
  },
  {
    tcs: ["TCC-37", "TCC-38", "TCC-39", "TCC-41"],
    section: "Contact - Field Email",
    issue: 'Format email yang tidak valid tetap diterima, contoh: ".budi@test.com", "budi..santoso@test.com", "budi@test" (tanpa TLD), "budi@test.c", "budi#@test.com", dan local part lebih dari 64 karakter.',
    steps: [
      "Buka section Contact",
      'Isi field Email dengan salah satu data uji (contoh: "budi@test", ".budi@test.com")',
      "Isi field lainnya dengan benar",
      "Klik Send Enquiry",
    ],
    expected: "Muncul pesan error format email dan form tidak terkirim.",
    suggest: "Validasi type=\"email\" bawaan browser terlalu longgar. Tambahkan regex email yang mewajibkan TLD minimal 2 huruf, tanpa titik di awal/akhir/ganda, plus batas panjang (local part 64, total 254). Validasi juga di server.",
    severity: "MEDIUM",
  },
  {
    tcs: ["TCC-32"],
    section: "Contact - Field Company",
    issue: 'Field Company menerima input yang hanya berisi simbol (contoh: "@#$%", "&&&"). Form tetap terkirim.',
    steps: ["Buka section Contact", 'Isi field Company dengan "@#$%"', "Isi field lainnya dengan benar", "Klik Send Enquiry"],
    expected: "Muncul pesan error pada field Company (harus mengandung huruf atau angka).",
    suggest: "Jika Company diisi, wajib mengandung minimal 1 huruf atau angka.",
    severity: "LOW",
  },
  {
    tcs: ["TCC-27", "TCC-33", "TCC-48"],
    section: "Contact - Form Enquiry",
    issue: "Tidak ada batas maksimal karakter. Name bisa lebih dari 50 karakter, Company lebih dari 100, dan Message lebih dari 1.000.",
    steps: [
      "Buka section Contact",
      "Paste 51 karakter ke Name / 101 karakter ke Company / 1.001 karakter ke Message",
      "Perhatikan isi field",
    ],
    expected: "Input berhenti di batas maksimal (Name 50, Company 100, Message 1.000) atau muncul pesan error.",
    suggest: 'Tambahkan atribut maxlength (name="50", company="100", message="1000"), counter karakter di Message, dan validasi panjang yang sama di server.',
    severity: "MEDIUM",
  },
  {
    tcs: ["TCC-28", "TCC-31"],
    section: "Contact - Form Enquiry",
    issue: 'Spasi di awal/akhir tidak dipangkas. Name "  Budi Santoso  " terkirim apa adanya, dan Company yang hanya berisi spasi terkirim sebagai "   ".',
    steps: [
      "Buka section Contact",
      'Isi Name dengan "  Budi Santoso  " (atau Company dengan 3 spasi)',
      "Isi field lainnya dengan benar, klik Send Enquiry",
      "Periksa payload di DevTools > Network",
    ],
    expected: 'Data dikirim sudah di-trim: name "Budi Santoso", company "" (kosong).',
    suggest: "Lakukan trim() pada semua field teks sebelum validasi dan sebelum dikirim, di frontend dan backend.",
    severity: "LOW",
  },
  {
    tcs: ["TCC-59"],
    section: "Contact - Form Enquiry",
    issue: "Saat JavaScript nonaktif, form dikirim dengan method GET sehingga seluruh data (nama, email, pesan) muncul di URL. Enquiry juga tidak terkirim ke server.",
    steps: [
      "DevTools > Ctrl+Shift+P > Disable JavaScript, reload halaman",
      "Isi semua field form Contact dengan benar",
      "Klik Send Enquiry",
      "Perhatikan URL di address bar",
    ],
    expected: "Data tidak muncul di URL. Form tetap terkirim, atau tampil pesan bahwa JavaScript diperlukan.",
    suggest: 'Tambahkan method="post" dan action="/api/contact" pada <form> sebagai fallback, atau tampilkan pesan <noscript>.',
    severity: "MEDIUM",
  },
  {
    tcs: ["TCGN-08"],
    section: "General - JavaScript Nonaktif",
    issue: "Saat JavaScript nonaktif, konten section (About, Products, Why Us, Global Trade, Contact) tidak terlihat karena class .reveal membuat opacity 0 dan tidak pernah berubah.",
    steps: ["DevTools > Ctrl+Shift+P > Disable JavaScript", "Reload halaman", "Scroll dari Hero hingga Footer"],
    expected: "Seluruh konten tetap tampil, atau tampil pesan noscript.",
    suggest: "Sembunyikan .reveal hanya jika JavaScript aktif (contoh: class \"js\" di <html> lalu CSS .js .reveal { opacity: 0 }), atau tambahkan <noscript><style>.reveal{opacity:1}</style></noscript>.",
    severity: "MEDIUM",
  },
  {
    tcs: ["TCA-05", "TCP-09", "TCW-04", "TCG-08", "TCF-04", "TCGN-09"],
    section: "General - Responsive",
    issue: "Di lebar layar 320px muncul scroll horizontal sekitar 32px. Halaman bisa digeser ke samping di semua section.",
    steps: ["Buka website", "DevTools > Device Toolbar, atur lebar 320px", "Scroll seluruh halaman dan geser ke kanan"],
    expected: "Tidak ada scroll horizontal, semua konten pas di lebar layar (WCAG 1.4.10).",
    suggest: "Cari elemen yang lebih lebar dari layar (padding/min-width/teks panjang tanpa wrap). Tambahkan overflow-wrap: anywhere pada teks panjang, dan kurangi padding section di layar kecil.",
    severity: "LOW",
  },
  {
    tcs: ["TCH-07"],
    section: "Hero",
    issue: "Di layar pendek (landscape HP 667x375 dan 568x320), headline Hero tertutup navbar.",
    steps: ["DevTools > Device Toolbar", "Atur ukuran 667x375 lalu 568x320", "Perhatikan section Hero"],
    expected: "Headline, tagline, dan tombol CTA terlihat utuh dan tidak bertumpuk dengan navbar.",
    suggest: "Beri padding-top pada hero minimal setinggi navbar, dan gunakan min-height alih-alih height: 100vh di layar pendek.",
    severity: "LOW",
  },
  {
    tcs: ["TCH-09"],
    section: "Hero",
    issue: "Saat pengaturan Reduce Motion aktif, animasi indikator Scroll tetap berjalan.",
    steps: ['DevTools > Ctrl+Shift+P > "Emulate CSS prefers-reduced-motion: reduce"', "Reload halaman", "Perhatikan indikator Scroll di Hero"],
    expected: "Animasi dinonaktifkan atau diminimalkan sesuai preferensi user.",
    suggest: "Tambahkan @media (prefers-reduced-motion: reduce) { * { animation: none; transition: none; } }.",
    severity: "LOW",
  },
  {
    tcs: ["TCC-18"],
    section: "Contact - Form Enquiry",
    issue: "Label form tidak terhubung ke input. Klik teks label (Your Name, Company, dll.) tidak memfokuskan field.",
    steps: ["Buka section Contact", "Klik teks label setiap field"],
    expected: "Fokus berpindah ke input yang sesuai.",
    suggest: 'Tambahkan atribut for pada <label> dan id yang sama pada input (contoh: <label for="name"> + <input id="name">).',
    severity: "LOW",
  },
  {
    tcs: ["TCC-62"],
    section: "Contact - Form Enquiry",
    issue: 'Field yang tidak valid tidak ditandai aria-invalid="true", sehingga pengguna screen reader tidak tahu field mana yang error.',
    steps: ["Buka section Contact", "Klik Send Enquiry dengan semua field kosong", "Inspect field Name"],
    expected: 'Field invalid ditandai aria-invalid="true", pesan error dibacakan, dan fokus pindah ke field error pertama.',
    suggest: 'Set aria-invalid="true" dan aria-describedby yang mengarah ke elemen pesan error pada field yang gagal validasi.',
    severity: "LOW",
  },
  {
    tcs: ["TCW-03"],
    section: "Why Us",
    issue: "Emoji dekoratif pada kartu keunggulan tidak diberi aria-hidden, sehingga dibacakan screen reader (contoh: \"classical building\").",
    steps: ["Buka section Why Us", "Inspect ikon emoji pada kartu"],
    expected: 'Emoji dekoratif diberi aria-hidden="true".',
    suggest: 'Tambahkan aria-hidden="true" pada elemen .pillar-icon (dan .value-icon / .info-icon).',
    severity: "TRIVIAL",
  },
];

// Cari bug di katalog berdasarkan nomor TC, contoh: findBugByTc("TCC-20")
export function findBugByTc(tc: string) {
  return BUG_CATALOG.find((bug) => bug.tcs.includes(tc));
}
