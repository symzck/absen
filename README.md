# PGT Mu'allimin - Sistem Absensi Terpadu

Aplikasi Sistem Absensi Terpadu Marching Band PGT (*Pradana Gita Taruna*) Madrasah Mu'allimin Muhammadiyah Yogyakarta.

## 🌐 Domain & Live URL
- **Domain GitHub Pages:** [https://symzck.github.io/absen/](https://symzck.github.io/absen/)
- **Repository GitHub:** [https://github.com/symzck/absen](https://github.com/symzck/absen)

---

## 🚀 Fitur Utama
1. **Presensi Real-Time Multi-Section**: Pencatatan kehadiran pemain Marching Band (Brass, Battery, Pit Instrument, Cologuard).
2. **Kalkulasi Disiplin Otomatis**: Rekap kehadiran, persentase kehadiran, dan Leaderboard kedisiplinan per-section.
3. **Integrasi Google Sheets & Drive**: Ekspor data otomatis dan sinkronisasi dua arah ke Google Sheets.
4. **Keamanan Bertingkat**: Akun khusus Petugas Lapangan dan Super Administrator.
5. **Dukungan PWA & Mobile-First**: Tampilan responsif baik di smartphone maupun desktop.

---

## ⚙️ Konfigurasi Authorized Domain (Firebase & Google OAuth)
Bagi pengguna fitur Google Sheets Sync saat berjalan di domain GitHub Pages:
1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Masuk ke project `crypto-banner-tthv3`
3. Pilih **Authentication** > Tab **Settings** > **Authorized domains**
4. Tambahkan domain:
   - `symzck.github.io`
   - `github.io`

---

## 🛠️ Deploy ke GitHub Pages
Repository ini telah dilengkapi dengan GitHub Actions Workflow (`.github/workflows/deploy.yml`).
Setiap push ke branch `main` atau `master` akan otomatis membuat build dan mendistribusikannya ke domain GitHub Pages `https://symzck.github.io/absen/`.

```bash
# Menjalankan lokal
npm install
npm run dev

# Membangun produksi
npm run build
```
