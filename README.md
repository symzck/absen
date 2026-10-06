# PGT Mu'allimin - Sistem Absensi Terpadu

Aplikasi Sistem Absensi Terpadu Marching Band PGT (*Pradana Gita Taruna*) Madrasah Mu'allimin Muhammadiyah Yogyakarta.

## 🌐 Domain & Live URL
- **Domain GitHub Pages:** [https://symzck.github.io/absen/](https://symzck.github.io/absen/)
- **Repository GitHub:** [https://github.com/symzck/absen](https://github.com/symzck/absen)

---

## 🚀 Fitur Utama
1. **Presensi Real-Time Multi-Section**: Pencatatan kehadiran pemain Marching Band (Brass, Battery, Pit Instrument, Cologuard).
2. **Kalkulasi Disiplin Otomatis**: Rekapitulasi kehadiran, persentase kehadiran, dan Leaderboard kedisiplinan per-section.
3. **Portal Personalia Band**: Homepage khusus personalia, papan pengumuman korps, presentasi kehadiran interaktif (mode proyektor & cetak), serta rekap kehadiran detail dengan rincian alasan izin/sakit/alfa.
4. **Sistem Sesi Fleksibel**: Pengaturan sesi latihan resmi (wajib & sunnah/tambahan), penutupan dan penguncian sesi otomatis, serta filter ringkas untuk menampilkan sesi yang telah terlaksana.
5. **Integrasi Google Sheets & Drive**: Ekspor data otomatis dan sinkronisasi dua arah ke Google Sheets.
6. **Keamanan & Autentikasi Kredensial Terenkripsi**: Penyimpanan kata sandi dengan hashing satu arah (SHA-256), proteksi akses multi-peran (Super Administrator, Personalia Band, dan Petugas Lapangan).
7. **PWA & Mobile-First**: Tampilan responsif optimal untuk perangkat smartphone petugas di lapangan maupun komputer pengurus.

---

## 🔒 Hak Akses & Keamanan Sistem
Sistem menggunakan satu pintu masuk aman (*Unified Secure Portal*) dengan proteksi berbasis peran:
- **Super Administrator**: Akses master penuh untuk manajemen pemain, penjadwalan sesi, konfigurasi Google Sheets, dan akun petugas.
- **Personalia Band**: Akses evaluasi kedisiplinan, papan pengumuman, presentasi statistik visual korps, dan rekapan presensi beserta alasan.
- **Petugas Lapangan**: Pencatatan presensi pemain hari H dan peninjauan riwayat sesi yang telah selesai.

> *Catatan Keamanan: Kredensial akun dilindungi secara kriptografis menggunakan algoritma hashing SHA-256 dan tersinkronisasi aman melalui Cloud Firestore. Informasi kata sandi tidak dipublikasikan ke publik.*

---

## ⚙️ Konfigurasi Authorized Domain (Firebase & Google OAuth)
Bagi pengguna fitur Google Sheets Sync saat berjalan di domain GitHub Pages:
1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Masuk ke project `absen-7862e`
3. Pilih **Authentication** > Tab **Settings** > **Authorized domains**
4. Tambahkan domain:
   - `symzck.github.io`
   - `github.io`

---

## 📊 Aktivasi Google Sheets API & Drive API (Google Cloud)
Untuk mengizinkan pembuatan otomatis dan sinkronisasi spreadsheet di project Anda:
1. Buka link aktivasi **Google Sheets API**:
   [https://console.developers.google.com/apis/api/sheets.googleapis.com/overview?project=1001342587333](https://console.developers.google.com/apis/api/sheets.googleapis.com/overview?project=1001342587333)
   -> Klik tombol **ENABLE** (Aktifkan).
2. Buka link aktivasi **Google Drive API**:
   [https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=1001342587333](https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=1001342587333)
   -> Klik tombol **ENABLE** (Aktifkan).

---

## 🗄️ Konfigurasi Database Cloud (Cloud Firestore)
Aplikasi ini menyimpan seluruh data secara permanen dan real-time di Cloud Firestore:
1. Buka [Firebase Console - Firestore Database](https://console.firebase.google.com/project/absen-7862e/firestore)
2. Pastikan database Firestore telah dibuat (`default`)
3. Masuk ke tab **Rules** dan pastikan rules terkonfigurasi:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

---

## 🛠️ Deploy ke GitHub Pages
Repository ini telah dilengkapi dengan GitHub Actions Workflow (`.github/workflows/deploy.yml`).
Setiap push ke branch `main` atau `master` akan otomatis membuat build dan mendistribusikannya ke domain GitHub Pages:

```bash
# Menjalankan lokal
npm install
npm run dev

# Membangun produksi
npm run build
```
