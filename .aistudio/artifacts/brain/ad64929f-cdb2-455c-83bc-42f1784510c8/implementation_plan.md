# Rencana Pemaksimalan & Perbaikan Sistem Cloud Real-Time PGT Mu'allimin

Rencana ini berfokus pada penyelesaian kendala sinkronisasi data antar perangkat (handphone dan komputer) serta memaksimalkan fungsi Cloud Firestore agar seluruh data presensi harian, roster anggota, dan sesi latihan tersinkronisasi 100% otomatis secara real-time tanpa perlu simpan manual.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Berdasarkan konfirmasi pengguna:
> 1. **Cakupan Data**: Seluruh presensi harian, roster anggota (pemain), sesi latihan, dan pengumuman disinkronkan penuh ke cloud.
> 2. **Strategi Data Lokal vs Cloud**: Cloud Firestore dijadikan sumber utama (*single source of truth*). Data lokal yang belum ada di cloud akan otomatis diunggah (*auto-uploaded*) saat perangkat terhubung, tanpa ada risiko data lokal terhapus atau tertimpa data kosong.
> 3. **Prioritas Utama**: Sinkronisasi instan real-time (*zero-delay auto sync*) tanpa mengharuskan petugas menekan tombol simpan manual.

---

## 1. Overview & Core Concept

- **Tujuan Utama**: Memastikan setiap pencatatan kehadiran (Hadir, Sakit, Izin, Alfa), penambahan catatan izin, pembaruan pemain, dan penjadwalan sesi di satu handphone atau laptop langsung tampil seketika di semua handphone dan laptop petugas lain.
- **Penyebab Masalah Sebelumnya**:
  1. *Subscription Overwrite*: Ketika koleksi `attendances` di Cloud Firestore kosong atau baru dimulai, listener `subscribeAttendances` menganggap data lokal harus dibersihkan, sehingga sesi lokal terhapus sebelum sempat diunggah ke cloud.
  2. *Filter Prefix Sesi*: Pengecekan sesi lokal sebelumnya hanya mempertahankan ID dengan awalan `sesi-custom-`, mengabaikan format standar `sesi-YYYY-MM-DD`.
  3. *Debounce & Auto-Commit*: Perubahan presensi per siswa dan catatan keterangan membutuhkan auto-save langsung ke Cloud Firestore dengan debounce aman agar tidak tertinggal di memori lokal.

---

## 2. User Experience & Visual Design

- **Alur Kerja Petugas (Mobile & Desktop)**:
  1. Petugas membuka aplikasi di HP — indikator langsung menampilkan status `Cloud Aktif` dengan waktu sinkronisasi terakhir.
  2. Petugas mengetuk `Hadir`, `Sakit`, `Izin`, atau mengetik catatan — data otomatis terkirim ke Cloud Firestore dalam hitungan milidetik tanpa perlu tombol "Simpan".
  3. Petugas lain atau Admin di laptop melihat angka kehadiran dan status sesi terbarui seketika secara live.
  4. Ketika sesi disubmit atau ditutup, status finalisasi dan rekapitulasi langsung terkunci di cloud untuk seluruh tim.
- **Visual & Ergonomi Mobile**:
  - Top bar mobile bersih sesuai kaidah *Three-Zone Top Bar Contract* tanpa badge tumpuk.
  - Indikator koneksi cloud yang tenang (teks informatif `Auto Cloud · Real-time`, bukan badge pill berkedip liar).
  - Target sentuh tombol presensi minimal $44 \times 44\text{px}$ untuk kemudahan pengisian di lapangan.

---

## 3. Key Product Decisions & Trade-Offs

- **Keputusan 1: Cloud-First dengan Non-Destructive Local Cache**
  - *Pendekatan*: Saat perangkat terhubung, data diambil dari Cloud Firestore. Namun jika di cloud belum ada data untuk tanggal tertentu sementara di lokal sudah ada catatan, sistem secara proaktif mengunggah data lokal tersebut ke cloud (*auto-heal & seed*), bukan menghapusnya.
  - *Alasan*: Mencegah hilangnya data presensi petugas lapangan saat berpindah jaringan seluler.
- **Keputusan 2: Auto-Commit Real-Time pada Setiap Interaksi**
  - *Pendekatan*: Setiap klik status siswa (Hadir/Sakit/Izin/Alfa) langsung memicu `saveAttendanceToCloud()`. Untuk catatan teks izin, diterapkan *debounced commit* (400ms).
  - *Alasan*: Menghilangkan kebutuhan tombol "Simpan" manual yang rawan lupa ditekan oleh petugas lapangan.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                 PERANGKAT PETUGAS / ADMIN                   │
│   (Mobile Phone / Laptop / Tablet - Multi-Device Client)    │
└──────────────────────────────┬──────────────────────────────┘
                               │
               Real-time Bidirectional Data Stream
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   CLOUD FIRESTORE DATABASE                  │
│       (Project: crypto-banner-tthv3 | DB: ai-studio-absen)  │
│                                                             │
│   ├── /students/           -> Roster 43+ Pemain Marching    │
│   ├── /attendances/        -> Sesi & Catatan Presensi Live  │
│   ├── /system_users/       -> Akun Petugas & Hak Akses      │
│   └── /announcements/      -> Pengumuman & Bot Jadwal Hari-H│
└─────────────────────────────────────────────────────────────┘
```

### Langkah-Langkah Eksekusi Teknis:
1. **Perbaikan `src/services/db.ts`**:
   - Memperbaiki fungsi `subscribeAttendances`, `subscribeStudents`, dan `subscribeAnnouncements` agar memiliki mekanisme *safe merge* dan pelaporan status koneksi yang akurat.
   - Menyediakan fungsi `autoUploadUnsyncedSessions` yang memeriksa apakah ada sesi presensi lokal yang belum tersimpan di cloud, dan otomatis mengunggahnya saat booting.
   - Memastikan timeout dan retry network diatur dengan toleransi jaringan seluler (15 detik).
2. **Perbaikan `src/App.tsx`**:
   - Menghapus logika lama yang menghapus sesi lokal jika cloud kosong.
   - Mengubah alur pengisian presensi agar setiap mutasi data (status tombol, catatan izin, penambahan jadwal, submit final) langsung otomatis tersimpan ke cloud via Firestore real-time.
   - Mengintegrasikan debouncing aman untuk input teks catatan keterangan.
3. **Verifikasi Kompilasi & Pengujian Multi-Perangkat**:
   - Menjalankan `compile_applet` dan `lint_applet` untuk memastikan tidak ada kesalahan TypeScript.
   - Menguji konektivitas baca-tulis langsung ke koleksi `/attendances`, `/students`, dan `/system_users` di database Firestore aktif.
