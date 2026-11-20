/**
 * =========================================================================
 * GOOGLE APPS SCRIPT: REMOTE LICENSE LOCK CONTROLLER (ZGLOWRA)
 * =========================================================================
 * 
 * PANDUAN PEMASANGAN:
 * 1. Buka Google Spreadsheet baru (misal: "Kontrol Lisensi Client ZGlowra").
 * 2. Pada Baris 1, buat 4 kolom header:
 *    [A1]: STATUS
 *    [B1]: PESAN
 *    [C1]: KONTAK_WA
 *    [D1]: JUDUL
 * 
 * 3. Pada Baris 2, isi nilai awal:
 *    [A2]: AKTIF    (ketik 'KUNCI' kapan saja Anda ingin mengunci aplikasi di laptop client)
 *    [B2]: Akses aplikasi telah ditangguhkan sementara. Silakan hubungi pengembang untuk aktivasi.
 *    [C2]: 6281234567890 (ganti dengan nomor WhatsApp Anda diawali 62)
 *    [D2]: Akses Aplikasi Dinonaktifkan
 * 
 * 4. Klik menu: Ekstensi (Extensions) > Apps Script
 * 5. Hapus semua kode default, lalu Tempel (Paste) script ini.
 * 6. Klik tombol "Deploy" (Terapkan) berwarna biru di kanan atas > "New deployment" (Penerapan baru).
 * 7. Klik ikon gerigi di sebelah 'Select type' > pilih "Web app".
 * 8. Konfigurasi:
 *    - Description: Kontrol Lisensi ZGlowra
 *    - Execute as: Me (email Anda)
 *    - Who has access: Anyone (Siapa saja)  <-- SANGAT PENTING!
 * 9. Klik "Deploy", izinkan hak akses jika diminta Google.
 * 10. Salin "Web app URL" (berakhiran /exec).
 * 11. Masukkan ke file server/.env di aplikasi ZGlowra:
 *     LICENSE_CHECK_ENABLED=true
 *     LICENSE_SHEET_URL=https://script.google.com/macros/s/AKfycb.../exec
 * =========================================================================
 */

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    
    // Baca baris ke-2 (Baris pertama setelah header)
    var status = sheet.getRange("A2").getValue().toString().trim().toUpperCase();
    var pesan = sheet.getRange("B2").getValue().toString().trim();
    var kontak = sheet.getRange("C2").getValue().toString().trim();
    var judul = sheet.getRange("D2").getValue().toString().trim();
    
    if (!status) status = "AKTIF";
    if (!pesan) pesan = "Aplikasi ini telah dinonaktifkan sementara oleh pengembang. Silakan hubungi developer untuk aktivasi lisensi.";
    if (!judul) judul = "Akses Aplikasi Dinonaktifkan";

    var isLocked = (
      status === "KUNCI" ||
      status === "LOCKED" ||
      status === "LOCK" ||
      status === "NONAKTIF" ||
      status === "FALSE" ||
      status === "OFF" ||
      status === "0"
    );

    var responseData = {
      success: true,
      status: status,
      isLocked: isLocked,
      message: pesan,
      contact: kontak,
      title: judul,
      timestamp: new Date().toISOString()
    };

    return ContentService.createTextOutput(JSON.stringify(responseData))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      status: "ERROR",
      isLocked: false,
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
