# QA Automation – Company Profile Website

Framework automation test (Playwright + TypeScript) untuk **website company profile**.
Satu kerangka test dipakai untuk banyak website. Yang berbeda per website hanya **config** dan **test section khusus**.

Website yang sudah terdaftar: **Yovela Trade Limited** (`SITE=yovela`, default), berdasarkan dokumen *Yovela Website - Test Case - Role A*.

## Instalasi

```bash
pnpm install
pnpm exec playwright install
```

## Menjalankan test

| Perintah | Isi |
| --- | --- |
| `pnpm test` | Semua test |
| `pnpm run test:ui` | Semua test UI di Chromium |
| `pnpm run test:api` | Test API, **memanggil server sungguhan** (mengirim email ke admin) |
| `pnpm run test:cross` | Cross browsing: Chrome, Firefox, Safari, Edge, Chrome Android, Safari iOS |
| `pnpm run report` | Buka HTML report |

- Satu TC saja: `npx playwright test -g "TCC-04"`
- Website lain: `SITE=acme pnpm test` (PowerShell: `$env:SITE="acme"; pnpm test`)
- Ganti URL (misalnya production): `BASE_URL=https://www.yovela-trading.com/ pnpm test`
- Form kontak di test UI memakai **mock** API supaya server tidak dibanjiri email tes. Untuk mengirim ke server sungguhan: `REAL_API=true pnpm run test:ui`

## Arsitektur

```
src/
├── config/                         ← DATA WEBSITE (satu-satunya yang wajib diganti per website)
│   ├── site.types.ts               # bentuk config (wajib diisi lengkap)
│   ├── index.ts                    # memilih website aktif dari env SITE
│   └── sites/
│       ├── yovela.config.ts        # config Yovela
│       └── _template.config.ts     # template untuk website baru
│
├── data/                           ← DATA UJI GENERIK (berlaku untuk semua website)
│   ├── contactForm.data.ts         # input negatif form kontak, boundary dihitung dari config
│   ├── api.data.ts                 # body/method negatif untuk API kontak
│   ├── bugCatalog.data.ts          # pemetaan TC gagal -> bug (untuk bug report)
│   └── Template Bug Report.xlsx    # template Excel bug report
│
├── helpers/                        ← FUNGSI BANTU GENERIK (membaca config, tanpa hardcode)
│   ├── base.helper.ts              # buka halaman, scroll, cek layout, blokir resource, error console
│   ├── navbar.helper.ts            # menu, logo, CTA, hamburger
│   ├── getInTouch.helper.ts        # form kontak: isi data, submit, mock API, cek validasi
│   └── api.helper.ts               # request ke API kontak dan cek respons
│
└── tests/
    ├── common/                     ← TEST STANDAR SEMUA COMPANY PROFILE (tidak perlu diubah)
    │   ├── navigationBar.spec.ts   # TCN-01..19
    │   ├── hero.spec.ts            # TCH-01..09
    │   ├── contact.spec.ts         # TCC-02..63
    │   ├── footer.spec.ts          # TCF-01..04
    │   ├── general.spec.ts         # TCGN-01..14
    │   ├── api.spec.ts             # TCAPI-01..35
    │   └── crossBrowsing.spec.ts   # TCCB-01..30
    │
    └── sites/                      ← TEST SECTION KHUSUS PER WEBSITE
        └── yovela/
            ├── about.spec.ts       # TCA-01..07
            ├── product.spec.ts     # TCP-01..11
            ├── whyUs.spec.ts       # TCW-01..04
            ├── globalTrade.spec.ts # TCG-01..08
            └── contactInfo.spec.ts # TCC-01

scripts/
└── generateBugReport.ts            ← membuat bug report Excel dari reports/results.json
```

Alur datanya: **config → helper → test**. Test tidak menulis URL, selector, atau teks website secara langsung. Semuanya diambil dari config lewat helper.

## Menambah website company profile baru

1. **Buat config.** Salin `src/config/sites/_template.config.ts` menjadi `src/config/sites/acme.config.ts`, ubah nama variabelnya menjadi `acme`, lalu isi nilainya. Selector bisa dicari lewat klik kanan → Inspect di browser.
2. **Daftarkan** di `src/config/index.ts`:
   ```ts
   import { acme } from "./sites/acme.config";
   const SITES = { yovela: yovela, acme: acme };
   ```
3. **Jalankan test standar:** `SITE=acme pnpm run test:ui`. Semua test di `tests/common` langsung berjalan untuk website baru.
4. **(Opsional) Tambah test section khusus** di `src/tests/sites/acme/`, misalnya Portfolio atau Team. Contohnya bisa dilihat di `src/tests/sites/yovela/`. Folder ini hanya dijalankan saat `SITE=acme`.

Jika aturan form berbeda (misalnya nama maksimal 100 karakter), cukup ubah `contactForm.rules` di config. Data uji boundary di `src/data` ikut menyesuaikan.

## Bug report Excel

Hasil test bisa langsung dijadikan bug report memakai template `src/data/Template Bug Report.xlsx` (sheet **Staging**).

```bash
pnpm run test:ui        # 1. jalankan test (hasil tersimpan di reports/results.json)
pnpm run bug-report     # 2. buat bug report dari hasil tersebut
```

Hasilnya `reports/Bug Report - <Nama Website> - <tanggal>.xlsx`, dengan screenshot bukti di `reports/attachments/`.
Nama tester bisa diisi otomatis: `TESTER=Lavy pnpm run bug-report`.

- Test yang gagal dikelompokkan per bug lewat `src/data/bugCatalog.data.ts`. Contohnya, 6 TC "layar 320px" yang gagal karena masalah yang sama cukup jadi 1 baris.
- TC gagal yang belum ada di katalog tetap masuk report dengan deskripsi otomatis dari pesan error. Lengkapi katalognya setelah itu.
- `results.json` selalu berisi hasil run **terakhir**. Kalau barusan menjalankan satu test saja (`-g "TCC-04"`), jalankan ulang suite lengkap sebelum membuat bug report.
- Kolom Status Dev dan Developer dibiarkan kosong untuk diisi developer. Status Test otomatis diisi **New**.

## Pola penulisan test

Kasus negatif yang langkahnya sama dan hanya berbeda input ditulis dalam satu `describe` dengan tabel data uji:

```ts
test.describe("Contact - Negative Field Email", () => {
  for (const data of INVALID_EMAILS) {           // data dari src/data/contactForm.data.ts
    test(`${data.tc} ${data.kasus}: "${data.input}"`, async ({ page }) => {
      const sentRequests = await openContactForm(page);

      await submitContactForm(page, buildCustomerData({ "Email Address": data.input }));

      await expectNotSubmitted(page, sentRequests);
    });
  }
});
```

Setiap test mengikuti urutan: **siapkan → lakukan aksi → cek hasil**, dipisahkan baris kosong.

## Catatan

- TC yang hanya bisa dicek manual (screen reader, inbox email admin, autofill browser, Lighthouse, perangkat fisik) tetap terdaftar dan muncul di report sebagai **skipped** beserta alasannya.
- Test yang gagal berarti hasil di website tidak sesuai *Expected Result* pada TC, jadi bisa langsung dipakai sebagai temuan (bug).
- URL pihak ketiga yang sering diblokir jaringan (analitik, dll.) didaftarkan di `ignoredErrorUrls` pada config, supaya tidak terbaca sebagai error website.
