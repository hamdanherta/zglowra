import dotenv from 'dotenv';
dotenv.config();

/**
 * Service untuk memverifikasi status lisensi / penguncian aplikasi
 * secara real-time via Google Spreadsheet atau Google Apps Script Web App.
 */
class LicenseService {
  constructor() {
    this.lastCheck = 0;
    this.cachedStatus = {
      isLocked: false,
      status: 'AKTIF',
      title: 'Aplikasi Aktif',
      message: 'Aplikasi berjalan dengan normal.',
      contact: '',
      lastCheckedAt: new Date().toISOString(),
    };
  }

  get sheetUrl() {
    if (this._overrideSheetUrl !== undefined) return this._overrideSheetUrl;
    return process.env.LICENSE_SHEET_URL || '';
  }

  set sheetUrl(val) {
    this._overrideSheetUrl = val;
  }

  get enabled() {
    if (this._overrideEnabled !== undefined) return this._overrideEnabled;
    return process.env.LICENSE_CHECK_ENABLED === 'true';
  }

  set enabled(val) {
    this._overrideEnabled = val;
  }

  get cacheSeconds() {
    return parseInt(process.env.LICENSE_CACHE_SECONDS || '15', 10);
  }

  get failMode() {
    return process.env.LICENSE_FAIL_MODE || 'open';
  }

  /**
   * Helper parsing CSV dengan dukungan field bertanda kutip
   */
  parseCsvLine(line) {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  }

  /**
   * Memeriksa status lisensi dari Google Sheets / Apps Script
   * @param {boolean} force - Lewati cache jika true
   */
  async checkStatus(force = false) {
    if (force) {
      dotenv.config();
    }
    // Jika fitur dinonaktifkan di .env, aplikasi selalu terbuka/aktif
    if (!this.enabled || !this.sheetUrl) {
      return {
        isLocked: false,
        status: 'DISABLED',
        title: 'Fitur Lisensi Nonaktif',
        message: 'Penguncian jarak jauh belum diaktifkan pada konfigurasi server.',
        contact: '',
        lastCheckedAt: new Date().toISOString(),
      };
    }

    const now = Date.now();
    // Gunakan cache jika masih dalam rentang waktu cacheSeconds
    if (!force && now - this.lastCheck < this.cacheSeconds * 1000) {
      return this.cachedStatus;
    }

    try {
      // Tambahkan parameter anti-cache agar Google tidak mengembalikan response basi
      const separator = this.sheetUrl.includes('?') ? '&' : '?';
      const fetchUrl = `${this.sheetUrl}${separator}_t=${now}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 detik batas timeout

      const response = await fetch(fetchUrl, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Google Sheets merespon status ${response.status}`);
      }

      const text = await response.text();
      let isLocked = false;
      let rawStatus = 'AKTIF';
      let title = 'Akses Aplikasi Dinonaktifkan';
      let message = 'Aplikasi ini telah dinonaktifkan sementara oleh pengembang. Silakan hubungi pihak developer untuk aktivasi lisensi.';
      let contact = '';

      const trimmed = text.trim();

      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        // Mode 1: Format JSON (dari Google Apps Script Web App)
        const data = JSON.parse(trimmed);
        const item = Array.isArray(data) ? data[0] : data;
        rawStatus = String(item.status || item.STATUS || 'AKTIF').toUpperCase().trim();
        message = item.message || item.PESAN || message;
        contact = item.contact || item.kontak || item.KONTAK_WA || '';
        title = item.title || item.JUDUL || title;
      } else {
        // Mode 2: Format CSV (dari File > Publish to web > CSV atau link gviz/tq?tqx=out:csv)
        const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
        let targetLine = '';

        if (lines.length >= 2) {
          // Baris 1 adalah Header ("STATUS,PESAN,..."), Baris 2 adalah Nilai pertama
          targetLine = lines[1];
        } else if (lines.length === 1) {
          targetLine = lines[0];
        }

        if (targetLine) {
          const cols = this.parseCsvLine(targetLine);
          rawStatus = (cols[0] || 'AKTIF').toUpperCase().replace(/\"/g, '').trim();
          if (cols[1]) message = cols[1].replace(/\"/g, '').trim();
          if (cols[2]) contact = cols[2].replace(/\"/g, '').trim();
          if (cols[3]) title = cols[3].replace(/\"/g, '').trim();
        }
      }

      // Kata kunci yang menandakan aplikasi harus DIKUNCI
      const lockKeywords = [
        'KUNCI',
        'LOCKED',
        'LOCK',
        'NONAKTIF',
        'NON-AKTIF',
        'BLOCK',
        'BLOCKED',
        'FALSE',
        'OFF',
        '0',
        'MATI',
        'SUSPEND',
        'EXPIRED',
      ];

      if (lockKeywords.includes(rawStatus)) {
        isLocked = true;
      } else {
        isLocked = false;
      }

      this.lastCheck = now;
      this.cachedStatus = {
        isLocked,
        status: rawStatus,
        title,
        message,
        contact,
        lastCheckedAt: new Date().toISOString(),
      };

      return this.cachedStatus;
    } catch (err) {
      console.warn('[LicenseService] Peringatan koneksi Google Sheets:', err.message);

      // Jika internet client mati / Google down
      if (this.failMode === 'locked') {
        return {
          isLocked: true,
          status: 'OFFLINE_LOCKED',
          title: 'Memerlukan Koneksi Internet',
          message: 'Aplikasi memerlukan akses internet aktif untuk memvalidasi lisensi operasional.',
          contact: '',
          lastCheckedAt: new Date().toISOString(),
        };
      }

      // Default 'open': gunakan status cache terakhir
      return {
        ...this.cachedStatus,
        offlineFallback: true,
      };
    }
  }
}

export default new LicenseService();
