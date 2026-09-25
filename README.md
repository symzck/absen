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
3. Setelah kedua API aktif, fitur *"Buat Spreadsheet Baru Otomatis"* dan sinkronisasi akan langsung bekerja dengan mulus.

---

## 🗄️ Konfigurasi Database Cloud (Cloud Firestore)
Aplikasi ini kini menyimpan seluruh data secara permanen dan real-time di Cloud Firestore:
1. Buka [Firebase Console - Firestore Database](https://console.firebase.google.com/project/absen-7862e/firestore)
2. Pastikan database Firestore telah dibuat (klik **Create database** jika belum)
3. Masuk ke tab **Rules** dan pastikan rules mengizinkan akses baca dan tulis:
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
4. Klik **Publish** untuk mengaktifkan aturan.
Setiap perubahan data yang dilakukan Admin (pemain, absensi, koreksi, akun, dan password) akan langsung tersimpan secara permanen dan tersinkronisasi di semua perangkat!

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
