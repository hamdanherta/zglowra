# PROMPT ANTIGRAVITY IDE: ZGlowra

> Salin seluruh isi file ini ke Antigravity IDE (mode Agent / Planning). Kerjakan **bertahap sesuai Fase di Bagian 15**. Setiap fase selesai, jalankan, uji di browser, dan perbaiki sebelum lanjut.

---

## 1. KONTEKS PROYEK

**Judul skripsi:** Rancang Bangun Sistem Informasi E-Commerce Produk Body Care Berbasis Web pada Toko Online Zfree Glow

**Nama aplikasi:** **ZGlowra**

**Deskripsi:** Website e-commerce satu toko (bukan marketplace multi-seller). Hanya menjual produk body care milik **Zfree Glow**. Sistem mencakup penjualan ke pelanggan, pengelolaan stok, pembelian stok dari supplier, verifikasi pembayaran, dan laporan.

**Aktor (sesuai Use Case Diagram):**
1. **Pelanggan**: melihat katalog, mengelola keranjang, memesan, mengunggah bukti pembayaran, melihat status pesanan, melihat riwayat transaksi, mengelola profil.
2. **Admin**: mengelola data produk, pelanggan, supplier, pesanan, verifikasi pembayaran, pembelian stok, laporan penjualan, laporan pembelian.
3. **Supplier**: melihat pesanan pembelian, mengonfirmasi pesanan, mengelola pengiriman, mengelola ketersediaan stok, mengelola profil.

Semua aktor punya **Login** dan **Logout**.

> Catatan: pada diagram, "Melihat Katalog Produk" meng-include Login. Pada implementasi ini katalog, detail produk, dan profil perusahaan **dibuat publik** (tanpa login) demi pengalaman e-commerce yang wajar. Login baru diwajibkan saat menambah ke keranjang/checkout dan untuk semua fitur akun.

---

## 2. TECH STACK

Gunakan stack berikut (jangan ganti tanpa alasan kuat):

- **Backend:** Laravel 11 (PHP 8.2+), Laravel Breeze/Fortify untuk autentikasi, Policy + Middleware role
- **Frontend:** Inertia.js + React 18 + TypeScript
- **Styling:** Tailwind CSS 3/4 dengan design token di `tailwind.config`
- **Database:** MySQL 8
- **Ikon:** `lucide-react` (BOLEH ikon, tapi lihat larangan di Bagian 4)
- **Gambar:** `intervention/image` v3 (driver GD/Imagick) untuk konversi WebP
- **Grafik dashboard:** Recharts
- **Export laporan:** `barryvdh/laravel-dompdf` (PDF) dan `maatwebsite/excel` (Excel)
- **Notifikasi UI:** toast (sonner / react-hot-toast)
- **Form:** React Hook Form + Zod (validasi client), FormRequest Laravel (validasi server)

Semua teks antarmuka, pesan error, dan label dalam **Bahasa Indonesia**. Format mata uang `Rp 150.000`, tanggal `18 Nov 2026`, zona waktu `Asia/Jakarta`.

---

## 3. IDENTITAS VISUAL

### 3.1 Palet warna (wajib dibuat sebagai design token)

| Token | Hex | Penggunaan |
|---|---|---|
| `brand-bg` | `#FFFFFF` | Warna dominan seluruh halaman dan card |
| `brand-soft` | `#FFF8F7` | Latar section selang-seling (sangat tipis, tetap terasa putih) |
| `brand-text` | `#FF9F97` | **Warna teks utama**: judul, heading, nama produk, harga, link, label |
| `brand-text-body` | `#6B4A47` | Khusus paragraf panjang, teks kecil (<14px), isi input, dan tabel agar terbaca (lihat catatan kontras) |
| `brand-gold` | `#D4AF37` | Sentuhan emas: garis dekoratif, badge, bintang rating, hover aksen |
| `brand-gold-soft` | `#F6E7B4` | Latar badge emas lembut |
| `brand-coral-soft` | `#FFE9E6` | Latar chip, input, hover lembut |
| `success` | `#4CAF8F` | Status sukses |
| `warning` | `#E8B84A` | Status menunggu |
| `danger` | `#E5736B` | Status batal / hapus |

**Catatan kontras (penting):** `#FF9F97` di atas putih kontrasnya rendah. Karena itu:
- `#FF9F97` dipakai untuk **heading, judul, harga, link, dan teks berukuran besar/tebal (>= 16px semibold)**.
- Paragraf panjang, teks kecil, isi input, dan data tabel memakai `brand-text-body` (`#6B4A47`).
- Tombol utama: latar `#FF9F97`, teks **putih**, ukuran min 16px, font-weight 600.

### 3.2 Tipografi
- Judul/logo: **Playfair Display** (kesan elegan beauty brand)
- Isi/UI: **Plus Jakarta Sans**
- Skala: h1 40/48px (mobile 30/36), h2 32px (mobile 24), h3 22px, body 16px, small 14px
- Logo teks **"ZGlowra"** berwarna `#FF9F97` dengan huruf **Z** atau garis bawah tipis berwarna emas `#D4AF37`. Tanpa ikon sparkles.

### 3.3 Sentuhan gold
Gunakan seperlunya: garis pemisah tipis di bawah judul section (lebar 48px, tebal 3px), bintang rating, badge "Terlaris"/"Baru", angka highlight di dashboard, dan indikator step aktif. **Jangan** jadikan gold warna dominan.

---

## 4. ATURAN DESAIN KETAT (WAJIB DIPATUHI DI SELURUH APLIKASI)

### 4.1 Tanpa border sama sekali
- **DILARANG** memakai `border`, `outline` visual, `ring` berwarna, `divide-*`, atau `<hr>` bergaris di mana pun: card, button, input, select, textarea, tabel, modal, dropdown, badge, tab, pagination.
- Pemisah dibuat dengan **jarak (spacing), perbedaan warna latar tipis, atau shadow**, bukan garis.
- Input/select/textarea: latar `brand-coral-soft` (atau `#FFF8F7`) + radius, fokus ditandai dengan **shadow lembut berwarna coral** (`box-shadow: 0 0 0 4px rgba(255,159,151,.25)`), bukan border. Reset `outline: none` lalu ganti dengan shadow fokus agar aksesibilitas tetap ada.
- Tabel: pemisah baris memakai selang-seling latar (`#FFF8F7` / putih) dan jarak antar baris, tanpa garis.

### 4.2 Radius seragam
- **Semua card:** `border-radius: 32px` (boleh 30-40px, tetapi **satu nilai yang sama dipakai di seluruh web**, definisikan token `--radius-card: 32px`).
- Card kecil/nested (mis. thumbnail dalam card): 24px.
- Tombol: `rounded-full` (pill) atau 9999px. Pilih satu gaya dan konsisten.
- Input: 20px. Badge/chip: pill. Modal: 36px. Gambar produk di dalam card: 28px.

### 4.3 Shadow di belakang setiap card
Karena latar putih dan card putih, **setiap card wajib punya shadow lembut** agar terlihat terangkat. Token:
```css
--shadow-card: 0 10px 30px rgba(255, 159, 151, 0.18), 0 2px 8px rgba(0, 0, 0, 0.05);
--shadow-card-hover: 0 16px 40px rgba(255, 159, 151, 0.28), 0 4px 12px rgba(0, 0, 0, 0.06);
--shadow-button: 0 6px 16px rgba(255, 159, 151, 0.35);
```
- Berlaku untuk: card produk, card dashboard, card form, card ringkasan checkout, modal, dropdown, navbar (saat scroll), sidebar admin, tabel pembungkus.
- Hover pada card yang bisa diklik: `translateY(-4px)` + `--shadow-card-hover`, transisi 200ms.

### 4.4 Padding dan jarak (tidak boleh mepet)
- Padding dalam card: **minimal 24px** (mobile) dan **32px** (desktop). Card produk: 20px mobile, 24px desktop.
- Padding tombol: `px-8 py-3.5` (kecil `px-6 py-2.5`). Tinggi tombol min **48px**, tinggi input min **52px**, area sentuh min 44px.
- Padding horizontal halaman (container): 16px mobile, 24px tablet, 32px desktop. Max width container **1280px**, tengah.
- Jarak antar section: 64px mobile, 96px desktop. Jarak antar elemen dalam card: kelipatan 8px (8/12/16/24).
- Gap grid: 16px mobile, 24px tablet, 32px desktop.
- Teks tidak boleh menempel ke tepi card/tombol/badge. Ikon di dalam tombol diberi gap 8px.

### 4.5 Larangan ikon dan emoji
- **DILARANG** ikon **Sparkles** (`Sparkles`, `Sparkle`, `WandSparkles`, bintang berkilau, atau varian apa pun).
- **DILARANG** emoji di seluruh UI, seed data, toast, placeholder, maupun komentar teks yang tampil ke pengguna.
- Boleh ikon `lucide-react` lain: ShoppingBag, Search, Heart, User, Truck, ShieldCheck, Leaf, Package, CreditCard, Star (untuk rating), Menu, X, ChevronDown, dll. Ukuran konsisten (20px/24px), `strokeWidth={1.75}`.
- Lakukan pencarian di akhir: `grep -ri "sparkle" src resources` dan cek emoji (regex unicode) harus **0 hasil**.

### 4.6 Anti-overflow (desktop dan mobile)
Konten **tidak boleh keluar dari card** pada lebar 360px sampai 1920px. Wajib:
- Semua card: `overflow-hidden` (kecuali bila shadow terpotong, pakai wrapper), anak flex/grid diberi `min-w-0`.
- Teks panjang: `break-words`, nama produk `line-clamp-2`, deskripsi singkat `line-clamp-3`. Email/URL/nomor panjang: `break-all` atau `truncate`.
- Gambar: selalu dalam wrapper `aspect-square` / `aspect-[4/5]` dengan `object-cover`, `w-full h-full`.
- Tabel lebar: dibungkus `overflow-x-auto` di dalam card dengan padding, dan di mobile **ubah menjadi tampilan kartu bertumpuk** (bukan scroll horizontal) untuk daftar pesanan dan produk admin.
- Tidak boleh ada horizontal scroll pada `body` di breakpoint mana pun.
- Gunakan `flex-wrap`, `grid-cols-*` responsif, dan `clamp()` untuk ukuran font.
- Uji wajib di lebar: **360, 390, 768, 1024, 1280, 1536 px**.

### 4.7 Konsistensi komponen
Buat komponen reusable di `resources/js/Components/ui/`: `Card`, `Button`, `Input`, `Select`, `Textarea`, `Badge`, `Modal`, `Table`, `Pagination`, `EmptyState`, `Skeleton`, `Toast`, `ConfirmDialog`, `SectionTitle`, `StatCard`, `ImageUploader`, `StatusBadge`. **Dilarang** menulis gaya card/tombol ad-hoc di halaman; semua halaman memakai komponen ini agar desain seragam.

---

## 5. ATURAN UPLOAD GAMBAR (WAJIB KOMPRESI KE WEBP)

Setiap gambar yang diunggah (foto produk, banner, logo, bukti pembayaran, foto profil) **harus dikonversi ke WebP resolusi tinggi di server** sebelum disimpan.

Spesifikasi:
- Format input diterima: JPG, JPEG, PNG, WebP (maks **10 MB**/file). Validasi MIME asli (bukan hanya ekstensi).
- Output: **WebP**, kualitas **85-90**, sisi terpanjang maksimal **2000px** (jangan upscale gambar kecil). Pertahankan rasio, perbaiki orientasi EXIF, hapus metadata.
- Buat varian otomatis: `original` (maks 2000px), `medium` (800px), `thumb` (320px), semuanya WebP.
- Nama file: `uuid.webp`, disimpan di `storage/app/public/{kategori}/` + `php artisan storage:link`.
- Simpan path varian di database.
- Buat **service class** `App\Services\ImageService` dengan method `store(UploadedFile $file, string $folder): array` dan `delete(string $path): void`. Semua controller yang menerima gambar **wajib** lewat service ini.
- Saat gambar diganti/dihapus, file lama ikut dihapus.
- Frontend: komponen `ImageUploader` dengan preview, drag-and-drop, progress, validasi ukuran/format, pesan error jelas. Multi gambar untuk produk (maks 6, bisa atur urutan, tandai gambar utama).
- Tampilkan gambar dengan `loading="lazy"`, atribut `width`/`height`, dan placeholder skeleton agar tidak ada layout shift.

---

## 6. DAFTAR HALAMAN

### 6.1 Publik / Pelanggan
1. **Beranda** `/`: hero (banner, headline, tombol "Belanja Sekarang"), kategori unggulan, produk terlaris, produk terbaru, keunggulan toko (bahan aman, pengiriman, pembayaran, layanan; pakai ikon biasa), testimoni, CTA akhir.
2. **Tentang Kami / Company Profile Singkat** `/tentang`: profil Zfree Glow, visi misi, nilai brand, keunggulan, kontak, lokasi (peta embed opsional), tautan sosial media. Konten dikelola dari admin.
3. **Daftar Produk** `/produk`: grid produk, **pencarian** (debounce 400ms), **filter kategori** (chip), **urutkan** (terbaru, terlaris, harga termurah, harga termahal, nama A-Z), filter rentang harga, pagination (12/halaman), URL query-string sinkron, state kosong, skeleton loading.
4. **Detail Produk** `/produk/{slug}`: galeri gambar (thumbnail + zoom), nama, kategori, harga, harga coret/diskon, rating, stok, deskripsi, komposisi, cara pakai, selector jumlah, tombol "Tambah ke Keranjang" dan "Beli Sekarang", wishlist, ulasan pelanggan, produk terkait.
5. **Keranjang** `/keranjang`: daftar item, ubah qty, hapus, centang item, ringkasan (subtotal, diskon voucher), input kode voucher, tombol checkout. Validasi stok realtime.
6. **Checkout** `/checkout`: pilih/tambah alamat, pilih kurir (JNE/J&T/SiCepat/Pos atau sesuai pengaturan), ongkir, metode pembayaran (transfer bank manual dan opsional COD), catatan, ringkasan, tombol "Buat Pesanan".
7. **Pembayaran / Unggah Bukti** `/pesanan/{kode}/pembayaran`: instruksi rekening, batas waktu bayar (24 jam), unggah bukti transfer (konversi WebP).
8. **Pesanan Saya / Status Pesanan** `/akun/pesanan` dan `/akun/pesanan/{kode}`: timeline status, detail item, resi, tombol batalkan (jika belum dibayar), tombol "Pesanan Diterima", ulasan setelah selesai, unduh invoice PDF.
9. **Riwayat Transaksi** `/akun/riwayat`: daftar semua transaksi selesai/batal, filter tanggal dan status.
10. **Profil Pelanggan** `/akun/profil`: ubah data diri, foto, ganti password, kelola buku alamat.
11. **Wishlist** `/akun/wishlist`.
12. **Login, Register, Lupa Password, Reset Password**: layout dua kolom di desktop (gambar brand + form), satu kolom di mobile.
13. **Kontak** `/kontak`: form pesan + info toko + tombol WhatsApp.
14. **FAQ**, **Syarat & Ketentuan**, **Kebijakan Privasi** (halaman statis, isi dari admin atau seed).
15. **404 / 500 / 403** bergaya brand.

### 6.2 Admin (`/admin`, login terpisah di `/admin/login`)
1. **Login Admin**
2. **Dashboard**: kartu statistik (penjualan hari ini/bulan ini, jumlah pesanan baru, pesanan menunggu verifikasi, stok menipis, total pelanggan), grafik penjualan 30 hari, produk terlaris, pesanan terbaru.
3. **Kelola Produk**: tabel + pencarian + filter kategori/status, **Tambah, Edit, Hapus** (soft delete + konfirmasi), aktif/nonaktif, multi gambar WebP, stok, harga, diskon, SKU, berat, komposisi, cara pakai.
4. **Kelola Kategori**: CRUD.
5. **Kelola Pelanggan**: lihat, cari, nonaktifkan/aktifkan, lihat riwayat pesanan.
6. **Kelola Supplier**: CRUD supplier + akun login supplier.
7. **Kelola Pesanan**: daftar, filter status/tanggal, detail, ubah status, input resi, cetak invoice/label.
8. **Verifikasi Pembayaran**: antrean bukti bayar, lihat gambar, tombol Setujui / Tolak (+ alasan). Setujui otomatis ubah status pesanan menjadi Diproses dan mengurangi stok (jika belum).
9. **Kelola Pembelian Stok**: buat pesanan pembelian ke supplier (pilih supplier, produk, qty, harga beli), pantau status, tandai **Diterima** untuk menambah stok otomatis.
10. **Laporan Penjualan**: filter periode, ringkasan, tabel, grafik, **export PDF dan Excel**.
11. **Laporan Pembelian**: sama, untuk pembelian stok.
12. **Pengelolaan Konten**: banner beranda, profil perusahaan, FAQ, testimoni.
13. **Voucher/Promo**: CRUD kode voucher.
14. **Ulasan**: moderasi (tampilkan/sembunyikan).
15. **Pengaturan Toko**: nama, logo (WebP), alamat, kontak, rekening bank, daftar kurir dan tarif, batas waktu bayar.
16. **Profil Admin** + ganti password.

### 6.3 Supplier (`/supplier`)
1. **Dashboard Supplier**: ringkasan pesanan pembelian per status.
2. **Melihat Pesanan Pembelian**: daftar + detail.
3. **Konfirmasi Pesanan**: terima/tolak dengan catatan.
4. **Kelola Pengiriman**: input kurir, resi, tanggal kirim, status pengiriman.
5. **Kelola Ketersediaan Stok**: update ketersediaan stok produk yang dipasok.
6. **Profil Supplier**.

### 6.4 Pemetaan Use Case ke Fitur
| UC | Fitur | Aktor |
|---|---|---|
| 01 | Login | Semua |
| 02 | Katalog produk | Pelanggan |
| 03 | Keranjang | Pelanggan |
| 04 | Pemesanan (checkout) | Pelanggan |
| 05 | Unggah bukti pembayaran | Pelanggan |
| 06 | Status pesanan | Pelanggan |
| 07 | Riwayat transaksi | Pelanggan |
| 08 | Profil pelanggan | Pelanggan |
| 09 | Data produk | Admin |
| 10 | Data pelanggan | Admin |
| 11 | Data supplier | Admin |
| 12 | Pesanan | Admin |
| 13 | Verifikasi pembayaran | Admin |
| 14 | Pembelian stok | Admin |
| 15 | Laporan penjualan | Admin |
| 16 | Laporan pembelian | Admin |
| 17 | Lihat pesanan pembelian | Supplier |
| 18 | Konfirmasi pesanan | Supplier |
| 19 | Kelola pengiriman | Supplier |
| 20 | Kelola ketersediaan stok | Supplier |
| 21 | Profil supplier | Supplier |
| 22 | Logout | Semua |

---

## 7. FITUR TAMBAHAN (SUDAH DISETUJUI UNTUK DITAMBAHKAN)

- Wishlist, ulasan + rating (hanya pembeli dengan pesanan selesai), voucher/diskon
- Peringatan stok menipis di dashboard admin (ambang bisa diatur)
- Invoice PDF otomatis
- Tombol WhatsApp melayang (kontak toko)
- Notifikasi in-app untuk perubahan status pesanan (dan email opsional via log mailer saat development)
- Log aktivitas admin (siapa mengubah apa)
- SEO dasar: `<title>`, meta description, Open Graph, slug produk, sitemap
- Soft delete untuk produk, pelanggan, supplier
- Rate limiting login dan formulir, proteksi CSRF, sanitasi input
- Kode pesanan unik format `ZG-YYYYMMDD-XXXX`

---

## 8. ALUR BISNIS

### 8.1 Status pesanan
`Menunggu Pembayaran` → `Menunggu Verifikasi` → `Diproses` → `Dikirim` → `Selesai`
Cabang: `Dibatalkan` (manual/otomatis lewat batas waktu), `Pembayaran Ditolak` (pelanggan bisa unggah ulang).

- Stok **dikunci** saat pesanan dibuat dan **dikembalikan** bila dibatalkan/kedaluwarsa. Gunakan transaksi database dan `lockForUpdate` untuk mencegah stok minus.
- Scheduler Laravel (`schedule:run`) membatalkan pesanan yang melewati batas bayar.
- Setiap perubahan status dicatat di tabel `order_status_logs`.

### 8.2 Status pembelian stok
`Dibuat` → `Dikonfirmasi Supplier` (atau `Ditolak`) → `Dikirim` → `Diterima`
Saat admin menandai **Diterima**, stok produk bertambah sesuai qty dan tercatat di `stock_movements`.

### 8.3 Pencatatan stok
Semua perubahan stok masuk `stock_movements` (tipe: penjualan, pembatalan, pembelian, penyesuaian, jumlah, saldo, referensi).

---

## 9. SKEMA DATABASE (MINIMAL)

`users` (id, name, email, phone, password, role[`customer`,`admin`,`supplier`], avatar, is_active, timestamps, soft_deletes)
`addresses` (user_id, label, penerima, telepon, provinsi, kota, kecamatan, kode_pos, alamat_lengkap, is_default)
`categories` (name, slug, description, image)
`products` (category_id, name, slug, sku, description, ingredients, how_to_use, price, discount_price, stock, weight_gram, is_active, is_featured, sold_count, soft_deletes)
`product_images` (product_id, path_original, path_medium, path_thumb, is_primary, sort_order)
`carts` / `cart_items` (user_id, product_id, qty)
`wishlists` (user_id, product_id)
`vouchers` (code, type[`percent`,`fixed`], value, min_purchase, quota, starts_at, ends_at, is_active)
`orders` (code, user_id, address_snapshot JSON, courier, shipping_cost, subtotal, discount, total, voucher_id, status, payment_method, note, tracking_number, expired_at, paid_at, completed_at)
`order_items` (order_id, product_id, name_snapshot, price_snapshot, qty, subtotal)
`payments` (order_id, bank, amount, proof_path, status[`pending`,`approved`,`rejected`], rejected_reason, verified_by, verified_at)
`order_status_logs` (order_id, status, note, user_id)
`reviews` (user_id, product_id, order_id, rating, comment, is_visible)
`suppliers` (user_id, company_name, contact_person, phone, address)
`supplier_products` (supplier_id, product_id, cost_price, available_stock, is_available)
`purchases` (code, supplier_id, admin_id, status, total, note, courier, tracking_number, shipped_at, received_at)
`purchase_items` (purchase_id, product_id, qty, cost_price, subtotal)
`stock_movements` (product_id, type, qty, balance, reference_type, reference_id, note)
`banners`, `pages` (about, faq, terms, privacy), `testimonials`, `settings` (key-value), `notifications`, `activity_logs`

Tambahkan index pada kolom pencarian dan foreign key. Gunakan seeder: 1 admin, 2 supplier, 1 pelanggan demo, 6 kategori body care (Body Lotion, Body Scrub, Body Wash, Body Butter, Body Mist, Perawatan Tangan & Kaki), 24 produk contoh dengan gambar WebP placeholder, voucher contoh, banner, halaman statis. Akun demo ditulis di README. **Tanpa emoji di seed.**

---

## 10. STRUKTUR TEKNIS

- Pola: Controller tipis, logika di `app/Services/*` (`OrderService`, `StockService`, `ImageService`, `PaymentService`, `ReportService`), validasi di `FormRequest`, otorisasi lewat Policy dan middleware `role:admin|supplier|customer`.
- Gunakan Eloquent Resource / DTO untuk data ke Inertia, eager loading untuk hindari N+1.
- Pagination server-side di semua daftar.
- Route dikelompokkan: publik, `auth` (customer), `admin` prefix, `supplier` prefix.
- Cache ringan untuk kategori dan pengaturan toko.
- File `.env.example` lengkap. README berisi cara instal, migrate, seed, `storage:link`, `npm run dev`, akun demo.

---

## 11. LAYOUT & NAVIGASI

**Navbar publik:** logo ZGlowra, menu (Beranda, Produk, Tentang, Kontak), kolom pencarian, ikon wishlist, keranjang (badge jumlah), akun. Mobile: hamburger dengan drawer. Navbar putih dengan shadow saat scroll, **tanpa garis bawah**.

**Footer:** profil singkat, tautan, kontak, sosial media, metode pembayaran. Latar `brand-soft`, tanpa border atas (gunakan perbedaan latar).

**Admin/Supplier:** sidebar putih bershadow (desktop) dan drawer (mobile), header dengan nama pengguna + tombol Logout, breadcrumb sederhana.

**Pola tabel admin di mobile:** ubah menjadi daftar card dengan label-nilai bertumpuk, aksi di bagian bawah card.

---

## 12. UX WAJIB

- Skeleton loading, empty state ilustratif (tanpa emoji), toast sukses/gagal, dialog konfirmasi sebelum hapus/batal.
- Validasi form inline dengan pesan Bahasa Indonesia yang jelas.
- State tombol: hover, active, disabled, loading (spinner).
- Fokus keyboard terlihat (lewat shadow, bukan border). Atribut `alt` pada semua gambar, label pada semua input, kontras terjaga sesuai Bagian 3.1.
- Animasi halus (150-250ms), hormati `prefers-reduced-motion`.
- Performa: lazy load gambar, code-splitting halaman, target Lighthouse Performance >= 85 di mobile.

---

## 13. KEAMANAN

Hash password (bcrypt), regenerasi sesi saat login, rate limit login (5/menit), validasi MIME unggahan, penyimpanan bukti bayar hanya dapat diakses pemilik dan admin (route terproteksi, bukan URL publik untuk bukti bayar), mass-assignment guard, escape output, policy akses per peran (pelanggan tidak bisa membuka data pelanggan lain).

---

## 14. KRITERIA PENERIMAAN (CEK SEBELUM SELESAI)

Desain:
- [ ] Latar dominan putih, teks heading/judul `#FF9F97`, aksen gold terlihat tapi tidak dominan
- [ ] **Tidak ada border** di mana pun (cek DevTools: tidak ada `border-width` > 0, tidak ada `divide-*`, tidak ada `ring` berwarna)
- [ ] Semua card radius sama (32px), semua card punya shadow (termasuk card putih di latar putih)
- [ ] Padding card/tombol/input nyaman, tidak ada konten mepet tepi
- [ ] **Nol** ikon Sparkles dan **nol** emoji (hasil grep kosong)
- [ ] Tidak ada konten keluar dari card dan tidak ada horizontal scroll di 360/390/768/1024/1280/1536 px
- [ ] Komponen UI seragam di semua halaman (tanpa gaya card/tombol ad-hoc)

Fungsional:
- [ ] Semua UC 01-22 berfungsi sesuai peran
- [ ] Upload gambar apa pun tersimpan sebagai **WebP** (cek ekstensi dan MIME file di storage), ada varian original/medium/thumb, file lama terhapus saat diganti
- [ ] Pencarian, filter kategori, dan sort produk berjalan dan tersinkron dengan URL
- [ ] Checkout membuat pesanan, mengunci stok, unggah bukti, admin menyetujui, status berjalan sampai Selesai
- [ ] Pembelian stok: admin buat, supplier konfirmasi dan kirim, admin tandai Diterima, stok bertambah
- [ ] Laporan penjualan dan pembelian bisa difilter dan diexport PDF/Excel
- [ ] Stok tidak bisa minus saat dua pembeli checkout bersamaan
- [ ] `php artisan test` untuk alur utama (checkout, verifikasi bayar, pembelian stok, ImageService) lulus
- [ ] Tidak ada error di console browser dan log Laravel

---

## 15. URUTAN PENGERJAAN (FASE)

Buat **Implementation Plan** dulu, lalu kerjakan berurutan. Di akhir tiap fase: jalankan aplikasi, uji di browser (desktop dan mobile), perbaiki, baru lanjut.

1. **Fondasi:** instal Laravel + Inertia React TS + Tailwind, design token (warna, radius, shadow, spacing), font, komponen UI dasar (`Card`, `Button`, `Input`, dll.), layout publik/admin/supplier. Tampilkan halaman uji komponen untuk memastikan aturan Bagian 4 terpenuhi.
2. **Database & auth:** migration, model, relasi, seeder, autentikasi 3 peran, middleware.
3. **ImageService WebP** + `ImageUploader` + tes.
4. **Admin: kategori & produk** (CRUD lengkap, multi gambar).
5. **Publik:** beranda, tentang, daftar produk (search/sort/filter), detail produk.
6. **Pelanggan:** keranjang, checkout, alamat, pesanan, unggah bukti, riwayat, profil, wishlist, ulasan.
7. **Admin: pesanan, verifikasi pembayaran, pelanggan, voucher, pengaturan, konten.**
8. **Supplier & pembelian stok** (admin dan supplier), stock movements.
9. **Dashboard & laporan** (grafik, PDF, Excel).
10. **Polishing:** responsive audit di semua breakpoint, anti-overflow, skeleton/empty state, SEO, keamanan, performa.
11. **Verifikasi akhir:** jalankan seluruh Kriteria Penerimaan (Bagian 14), grep Sparkles/emoji, audit border, rapikan semua yang tersisa, tulis README.

**Aturan kerja agent:** jangan lompat fase, jangan membuat gaya card/tombol di luar komponen UI, setiap menemukan konten yang meluber atau terlalu mepet langsung diperbaiki. Jika ada keputusan yang tidak tercakup dokumen ini, pilih opsi yang paling umum pada e-commerce dan catat di README.
