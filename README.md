# ZGlowra - Sistem Informasi E-Commerce Body Care (Zfree Glow)

Aplikasi web e-commerce resmi untuk produk kecantikan dan perawatan tubuh **Zfree Glow**. Dibangun menggunakan arsitektur modern berstandar enterprise dengan **Node.js (Express)**, **React 18 (TypeScript + Vite)**, dan **MySQL 8** (didukung penuh di lingkungan Laragon).

---

## 1. Menjalankan Aplikasi (1 Perintah)

Karena Laragon sudah aktif di sistem Anda (MySQL Port 3306), Anda dapat langsung menjalankan seluruh aplikasi (Backend & Frontend) dengan **satu perintah**:

### Cara 1: Menggunakan Perintah `zglowra`
Buka terminal (PowerShell, Command Prompt, atau Laragon Terminal), lalu ketik:
```bash
zglowra
```
> Script `zglowra.cmd` / `zglowra.bat` telah didaftarkan di root folder dan juga di direktori bin Laragon (`C:\laragon\bin`), sehingga dapat dipanggil langsung dari mana saja.

### Cara 2: Menggunakan NPM
Jika berada di direktori project `D:\HAMDANI\PROJECT_DONE\APLIKASI\WEB\zahra\zglowra`:
```bash
npm run dev
```

Aplikasi akan otomatis berjalan pada:
- **Frontend (Client):** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000/api](http://localhost:5000/api)
- **API Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 2. Akun Demo untuk Pengujian

Semua akun berikut telah di-seed ke dalam database `zglowra_db`:

| Peran (Role) | Email | Password | Akses Halaman |
|---|---|---|---|
| **Admin** | `admin@zglowra.com` | `password123` | `/admin` atau Login Admin |
| **Supplier 1** | `supplier1@zglowra.com` | `password123` | `/supplier` (PT Pesona Alami Nusantara) |
| **Supplier 2** | `supplier2@zglowra.com` | `password123` | `/supplier` (CV Herbal Organik Raya) |
| **Pelanggan** | `pelanggan@zglowra.com` | `password123` | `/login`, `/keranjang`, `/checkout`, `/akun/*` |

---

## 3. Fitur Utama & Kepatuhan Use Case (UC 01 - UC 22)

### A. Pelanggan (Customer)
- **Katalog & Detail Produk:** Pencarian instan (debounce), filter kategori chip, pengurutan (terbaru, harga, terlaris), multi-gambar WebP dengan zoom/pilihan thumbnail, komposisi bahan, dan cara penggunaan.
- **Keranjang Belanja:** Perhitungan realtime, kontrol kuantitas, input voucher diskon otomatis.
- **Checkout & Transaksi Aman:** Pilihan alamat pengiriman, kurir resmi (JNE, J&T, SiCepat, Pos), catatan pesanan, dan penguncian stok transaksional (`FOR UPDATE`) untuk mencegah stok minus saat transaksi bersamaan.
- **Instruksi Pembayaran & Upload Bukti:** Batas waktu pembayaran 24 jam, nomor rekening resmi, upload bukti transfer dengan auto-kompresi ke WebP 85-90%.
- **Status & Riwayat Pesanan:** Pelacakan pesanan step-by-step (`Menunggu Pembayaran` -> `Menunggu Verifikasi` -> `Diproses` -> `Dikirim` -> `Selesai`), unduh invoice PDF, konfirmasi penerimaan barang, dan review produk.
- **Wishlist & Profil:** Manajemen data diri, buku alamat pengiriman, dan daftar produk favorit.

### B. Admin
- **Dashboard Statistik:** Metrik omzet, total pesanan baru, antrean verifikasi bukti transfer, peringatan stok menipis, grafik penjualan bulanan, dan tabel aktivitas terbaru.
- **Kelola Produk & Kategori:** CRUD lengkap dengan multi-gambar WebP (original, medium, thumb), pengelolaan harga, diskon, stok, SKU, dan deskripsi.
- **Verifikasi Pembayaran:** Antrean bukti bayar, inspeksi visual bukti transfer, tombol persetujuan (otomatis mengubah status ke `Diproses`) atau tolak dengan alasan.
- **Kelola Pesanan:** Filter status/tanggal, detail lengkap, input nomor resi kurir, pembaruan status log.
- **Pembelian Stok (PO ke Supplier):** Pembuatan pesanan pembelian ke supplier (`PO-YYYYMMDD-XXXX`), pelacakan pengiriman dari supplier, dan penerimaan stok otomatis yang mencatat histori di `stock_movements`.
- **Laporan Penjualan & Pembelian:** Filter tanggal, ringkasan metrik, grafik visual, serta export ke file **PDF** dan **Excel (.xlsx)**.
- **Kelola Master Data:** Manajemen supplier, data pelanggan, kode promo/voucher, moderasi ulasan, dan pengaturan toko.

### C. Supplier
- **Dashboard Supplier:** Ringkasan status pesanan pembelian dari admin.
- **Konfirmasi PO:** Terima atau tolak pesanan pembelian dengan catatan.
- **Kelola Pengiriman PO:** Input kurir ekspedisi, nomor resi pengiriman, dan tanggal kirim.
- **Kelola Stok Pasokan:** Pembaruan stok produk yang disuplai dan harga modal.

---

## 4. Standar Desain Visual & Anti-Slop UI

1. **Tanpa Border Visual (`border: none`):**
   - Seluruh card, tombol, input, select, tabel, badge, dan modal tidak menggunakan border, garis pembatas, maupun `divide-*`.
   - Pemisahan visual diwujudkan melalui elevasi shadow lembut bertingkat (`--shadow-card`, `--shadow-card-hover`) dan latar warna selang-seling (`#FFF8F7` / `#FFFFFF`).
2. **Radius Seragam:**
   - Semua card menggunakan radius konsisten **32px** (`--radius-card: 32px`).
   - Tombol berbentuk pill (`rounded-full`), input 20px, modal 36px.
3. **Palet Warna Identitas:**
   - Dominan putih bersih (`#FFFFFF`) dan latar lembut (`#FFF8F7`).
   - Warna teks utama & judul: `#FF9F97` (Playfair Display elegan).
   - Teks paragraf/tabel: `#6B4A47` untuk kontras keterbacaan optimal.
   - Sentuhan aksen emas: `#D4AF37` pada rating, badge, dan separator kecil.
4. **Nol Sparkles & Nol Emoji:**
   - Bebas dari ikon sparkle dan emoji di seluruh tampilan antarmuka, data seeder, toast, dan komponen.
5. **Logo & Favicon Proporsional:**
   - Logo dari `logo/zfreelogo.png` diproses secara proporsional ke format WebP dan PNG tanpa distorsi/cemet.
   - Favicon tersedia dalam berbagai ukuran standar browser: `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, dan Android icons.

---

## 5. Pengujian & Verifikasi Logika

Untuk menjalankan automated test suite logika backend (ImageService WebP, Stock Locking `FOR UPDATE`, Verifikasi Pembayaran, dan Alur PO Supplier):
```bash
npm test
```
Hasil:
```
==================================================
       ZGlowra Core Logic & Security Test        
==================================================
[Test 1] Testing ImageService WebP conversion... -> PASSED
[Test 2] Testing transactional order checkout and stock locking... -> PASSED
[Test 3] Testing payment submission and approval... -> PASSED
[Test 4] Testing supplier purchase order and stock receipt... -> PASSED
==================================================
      ALL 4 CORE LOGIC TESTS PASSED CLEANLY!      
==================================================
```

Untuk menguji build frontend TypeScript:
```bash
npm run build
```
Hasil: **0 Error** (Vite production bundle generated successfully).

---

## 6. Perintah Tambahan

- **Re-Seed Database:** `npm run seed`
- **Build Client:** `npm run build`
- **Jalankan Production Preview:** `npm start`

---

## 7. Fitur Pengendali Jarak Jauh / Kunci Aplikasi via Google Spreadsheet

Fitur ini dirancang khusus untuk mengendalikan akses aplikasi di laptop client secara real-time dari jarak jauh. Ketika status di Google Spreadsheet Anda ubah menjadi **KUNCI**, aplikasi di laptop client otomatis terkunci dan menampilkan layar blokir khusus.

### Cara Kerja:
1. Backend aplikasi secara periodik dan saat request API memeriksa data dari Google Spreadsheet atau Google Apps Script Web App Anda.
2. Jika terdeteksi status `KUNCI`, seluruh endpoint API diblokir dengan HTTP status `423 Locked`.
3. Frontend secara instan menampilkan layar **License Lock Screen** (penuh, tidak bisa ditutup) berisi pesan khusus dan tombol WhatsApp langsung ke nomor Anda.
4. Ketika Anda ubah kembali nilainya menjadi `AKTIF`, client tinggal klik tombol **"Cek Status Aktivasi Ulang"** dan aplikasi langsung terbuka kembali tanpa perlu restart.

### Struktur Tabel Google Spreadsheet:
Buat Google Sheet baru dengan 4 kolom pada baris pertama:
| Kolom | Nama Header | Contoh Nilai Baris 2 | Keterangan |
|---|---|---|---|
| **A** | `STATUS` | `AKTIF` atau `KUNCI` | Ketik `KUNCI` untuk mengunci, `AKTIF` untuk membuka |
| **B** | `PESAN` | `Akses aplikasi telah ditangguhkan sementara. Silakan hubungi developer untuk aktivasi.` | Pesan yang muncul di layar laptop client |
| **C** | `KONTAK_WA` | `6281234567890` | Nomor WhatsApp Anda (diawali 62) untuk tombol chat langsung |
| **D** | `JUDUL` | `Akses Aplikasi Dinonaktifkan` | Judul modal penguncian |

### Cara Menghubungkan ke Aplikasi (Pilih Salah Satu):

#### Opsi 1: Google Sheet Langsung (Paling Praktis Tanpa Script)
1. Di Google Spreadsheet Anda, klik **File** > **Bagikan (Share)** > **Publikasikan ke web (Publish to the web)**.
2. Pada bagian *Tautan (Link)*, pilih **Seluruh Dokumen** dan format **Nilai yang dipisahkan koma (.csv)**.
3. Klik **Publikasikan** dan salin URL yang diberikan (format: `https://docs.google.com/spreadsheets/d/e/.../pub?output=csv`).
4. Buka file `server/.env` dan tempel URL tersebut:
   ```env
   LICENSE_CHECK_ENABLED=true
   LICENSE_SHEET_URL=https://docs.google.com/spreadsheets/d/e/XXXX/pub?output=csv
   LICENSE_CACHE_SECONDS=15
   ```

#### Opsi 2: Google Apps Script Web App (JSON Mode)
1. Di Google Spreadsheet Anda, klik menu **Ekstensi (Extensions)** > **Apps Script**.
2. Salin seluruh kode yang ada di file `server/scripts/google-apps-script.js` lalu tempel di editor script.
3. Klik **Deploy** > **New deployment** > pilih jenis **Web app**.
4. Set *Who has access* menjadi **Anyone** (Siapa saja).
5. Klik **Deploy** dan salin URL Web App yang berakhiran `/exec`.
6. Masukkan ke `server/.env`:
   ```env
   LICENSE_CHECK_ENABLED=true
   LICENSE_SHEET_URL=https://script.google.com/macros/s/XXXX/exec
   LICENSE_CACHE_SECONDS=15
   ```


