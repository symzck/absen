import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, ClipboardList, BarChart3, LogOut, Download, 
  UserPlus, Trash2, CheckCircle2, AlertCircle, Menu, X, Save,
  Search, CheckSquare, Trophy, Shield, Sparkles, Filter, 
  Check, Clock, UserCheck, Lock, Eye, EyeOff, Edit2, Settings, Key,
  FileSpreadsheet, History, Send, Edit3, RotateCcw, HelpCircle,
  Globe, ExternalLink, Cloud, Database, UploadCloud, RefreshCw,
  Home, Megaphone, Plus, Pin, Calendar, Timer, ArrowLeft, ArrowRight, Undo2
} from 'lucide-react';
import officialLogo from './assets/logo.png';
import { EditMemberModal } from './components/EditMemberModal';
import { GoogleSheetsTab } from './components/GoogleSheetsTab';
import { AttendanceSessionsTab } from './components/AttendanceSessionsTab';
import { ConfirmModal } from './components/ConfirmModal';
import { HomeDashboardTab } from './components/HomeDashboardTab';
import { AnnouncementsTab } from './components/AnnouncementsTab';
import { PaperAttendanceSheetModal } from './components/PaperAttendanceSheetModal';
import { ScheduleSessionModal, BatchScheduleData } from './components/ScheduleSessionModal';
import { OfficerSubmissionGuide, calculateSessionCountdown, sortSessionsByClosest } from './components/OfficerSubmissionGuide';
import { appendSingleSessionToSheet } from './services/googleSheets';
import { getGoogleAccessToken } from './services/googleAuth';
import { 
  saveStudentToCloud, 
  saveMultipleStudentsToCloud,
  replaceAllStudentsInCloud,
  deleteStudentFromCloud, 
  saveAttendanceToCloud, 
  deleteAttendanceFromCloud, 
  saveUserToCloud, 
  deleteUserFromCloud, 
  subscribeStudents, 
  subscribeAttendances, 
  subscribeSystemUsers, 
  seedInitialDatabaseIfEmpty, 
  uploadAllLocalDataToCloud,
  onSyncStatusChange,
  SyncStatus,
  Announcement,
  subscribeAnnouncements,
  saveAnnouncementToCloud,
  deleteAnnouncementFromCloud,
  subscribeDeletedAnnouncements,
  subscribeDeletedAttendances,
  subscribeDeletedStudents,
  subscribeDeletedUsers
} from './services/db';
import firebaseConfig from '../firebase-applet-config.json';

// GitHub Icon Component
const GithubIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

// ==========================================
// LOGO RESMI PGT MU'ALLIMIN (DITETAPKAN SECARA PERMANEN)
// ==========================================
export const OFFICIAL_LOGO_URL = officialLogo;

// --- DATA STRUKTUR APLIKASI ---
export interface Student {
  id: number;
  name: string;
  kelas: string;
  asrama: string;
  section: string;
}

export interface AttendanceRecord {
  studentId: number;
  status: string;
  note: string;
}

export interface DailyAttendance {
  id?: string;
  date: string;
  sessionName?: string;
  scheduledTime?: string;
  location?: string;
  targetSection?: string;
  description?: string;
  isScheduled?: boolean;
  isClosed?: boolean;
  closedAt?: string | null;
  closedBy?: string | null;
  isSubmitted?: boolean;
  submittedAt?: string | null;
  submittedBy?: string | null;
  records: AttendanceRecord[];
}

export interface SystemUser {
  id: string;
  username: string;
  password: string;
  fullName: string;
  role: 'admin' | 'petugas';
  assignedSection: string; // 'All' | 'Brass' | 'Cologuard' | 'Battery' | 'Pit'
  createdAt: string;
}

// Akun Bawaan Sistem:
// Admin awal disiapkan secara aman. Admin dapat mengubah kata sandi sendiri kapan saja.
const INITIAL_USERS: SystemUser[] = [
  {
    id: 'admin-master',
    username: 'admin',
    password: 'admin#pgt', // Password awal admin, dapat diubah oleh pemilik di menu Admin
    fullName: 'Administrator Utama (Kepala Korps)',
    role: 'admin',
    assignedSection: 'All',
    createdAt: '2026-09-23'
  },
  {
    id: 'user-petugas-umum',
    username: 'petugas',
    password: 'pgt123',
    fullName: 'Petugas Lapangan Umum',
    role: 'petugas',
    assignedSection: 'All',
    createdAt: '2026-09-23'
  },
  {
    id: 'user-petugas-brass',
    username: 'petugas_brass',
    password: 'brass123',
    fullName: 'Petugas Section Brass',
    role: 'petugas',
    assignedSection: 'Brass',
    createdAt: '2026-09-23'
  },
  {
    id: 'user-petugas-battery',
    username: 'petugas_battery',
    password: 'battery123',
    fullName: 'Petugas Section Battery',
    role: 'petugas',
    assignedSection: 'Battery',
    createdAt: '2026-09-23'
  },
  {
    id: 'user-petugas-cg',
    username: 'petugas_cg',
    password: 'cg123',
    fullName: 'Petugas Section Cologuard',
    role: 'petugas',
    assignedSection: 'Cologuard',
    createdAt: '2026-09-23'
  },
  {
    id: 'user-petugas-pit',
    username: 'petugas_pit',
    password: 'pit123',
    fullName: 'Petugas Section Pit',
    role: 'petugas',
    assignedSection: 'Pit',
    createdAt: '2026-09-23'
  }
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-tutorial',
    title: '📖 PANDUAN PENGGUNAAN SISTEM ABSENSI TERPADU PGT MU\'ALLIMIN',
    content: `Berikut adalah panduan langkah demi langkah penggunaan Sistem Absensi Terpadu PGT Mu'allimin:

1. LOGIN AKUN PETUGAS & ADMIN
• Buka aplikasi dan pilih tombol Login. Masukkan Username & Password petugas section Anda (misal: petugas_brass, petugas_battery) atau akun Administrator.

2. PENCATATAN PRESENSI SESI LATIHAN
• Pilih Tanggal dan Section instrumen di bagian toolbar atas.
• Klik status kehadiran setiap anggota: Hadir (Hijau), Sakit (Kuning), Izin (Biru), atau Alfa (Merah).
• Gunakan tombol "Hadir Semua" untuk menandai seluruh anggota hadir sekaligus secara cepat.
• Tambahkan Catatan Izin/Keterangan jika anggota berhalangan.

3. PEMBARUAN & EDIT DATA PEMAIN DENGAN FLEKSIBEL
• Mode Edit Cepat Pemain: Klik tombol "Edit Cepat Pemain" di atas tabel untuk mengubah Nama, Kelas, Asrama, dan Section langsung di dalam baris tabel tanpa membuka modal.
• Mode Lembar Presensi Kertas: Klik "Mode Presensi Kertas" untuk mengunggah foto lembar presensi fisik (Split View) atau menempelkan daftar teks massal dari WhatsApp/Excel.
• Kosongkan Pemain Lama: Jika ingin mengganti roster pemain dari awal tanpa terpatok pemain lama, gunakan tombol "Kosongkan Pemain Lama".

4. FINALISASI & SUBMIT PRESENSI
• Setelah selesai mencatat kehadiran, klik tombol "Submit Presensi Sesi Ini".
• Tekan "Konfirmasi Submit Presensi". Data sesi akan difinalisasi dan langsung masuk ke Rekapitulasi Kehadiran, Peringkat Disiplin Section, dan Cloud Database.

5. PANTAU REKAPITULASI & PERINGKAT DISIPLIN
• Buka tab "Rekapitulasi Kehadiran" untuk melihat persentase kehadiran per section, leaderboard disiplin, serta mengunduh rekap dalam format CSV/Excel.`,
    category: 'info',
    targetAudience: 'All',
    author: 'Tim Sistem Informasi PGT Mu\'allimin',
    authorRole: 'Super Admin',
    createdAt: '2026-10-03',
    pinned: true,
  },
  {
    id: 'ann-1',
    title: 'Gladi Bersih Lapangan Persiapan Konser & Apel Akbar',
    content: 'Diberitahukan kepada seluruh anggota Korps Marching Band PGT Mu\'allimin bahwa jadwal latihan Sabtu sore akan dialokasikan penuh untuk Gladi Lapangan bersama instrumen lengkap. Harap hadir 15 menit sebelum waktu dimulai dengan membawa instrumen dan partitur masing-masing.',
    category: 'schedule',
    targetAudience: 'All',
    author: 'Administrator Utama (Kepala Korps)',
    authorRole: 'Super Admin',
    createdAt: '2026-09-27',
    pinned: true,
  },
  {
    id: 'ann-2',
    title: 'Pembersihan & Pengecekan Rutin Instrumen Brass & Pit',
    content: 'Petugas section Brass dan Pit mohon memeriksa kondisi valve oil, slide grease, dan kelayakan mallet setelah sesi latihan hari ini. Laporkan jika ada instrumen yang memerlukan servis ke ruang peralatan.',
    category: 'info',
    targetAudience: 'Brass',
    author: 'Administrator Utama',
    authorRole: 'Super Admin',
    createdAt: '2026-09-26',
    pinned: false,
  },
  {
    id: 'ann-3',
    title: 'Apresiasi Disiplin Kehadiran Section Battery!',
    content: 'Selamat kepada Section Battery yang mencatatkan persentase kehadiran tertinggi (96%) pada sesi latihan pekan ini. Pertahankan konsistensi dan kekompakan ketukan!',
    category: 'praise',
    targetAudience: 'Battery',
    author: 'Kepala Pelatih Korps',
    authorRole: 'Super Admin',
    createdAt: '2026-09-25',
    pinned: true,
  }
];

const INITIAL_STUDENTS: Student[] = [
  // Section Brass (Daftar Atas)
  { id: 1, name: 'Rajendra Arya Abiyyu', kelas: '2H', asrama: 'C', section: 'Brass' },
  { id: 2, name: 'Ahmad Arkan Sya\'bani', kelas: '3A', asrama: 'A', section: 'Brass' },
  { id: 3, name: 'Arkana El Sabily', kelas: '3B', asrama: 'B', section: 'Brass' },
  { id: 4, name: 'Jaladri Arif Wirasena', kelas: '3B', asrama: 'B', section: 'Brass' },
  { id: 5, name: 'Jangky Daulat', kelas: '3C', asrama: 'B', section: 'Brass' },
  { id: 6, name: 'Muhammad Zhafif Alkahfi', kelas: '3US', asrama: 'A', section: 'Brass' },
  { id: 7, name: 'Abimanyu Aryo Atmojo N.', kelas: '4D', asrama: 'C', section: 'Brass' },
  { id: 8, name: 'Ahmad Syamil Zakaria', kelas: '4B', asrama: 'B', section: 'Brass' },
  { id: 9, name: 'Kevin Zahlan Firdaus', kelas: '4B', asrama: 'B', section: 'Brass' },
  { id: 10, name: 'M. Nabil Zakwan Zak.', kelas: '4E', asrama: 'D', section: 'Brass' },
  { id: 11, name: 'Raditya Aris Nararya S.', kelas: '4E', asrama: 'D', section: 'Brass' },
  { id: 12, name: 'Panji Nugroho Adji', kelas: '2F', asrama: 'C', section: 'Brass' },
  { id: 13, name: 'M. Arique Al Faqih', kelas: '2LSA', asrama: 'A', section: 'Brass' },
  { id: 14, name: 'Emir Mandi Mandapiqi', kelas: '2LSA', asrama: 'A', section: 'Brass' },
  { id: 15, name: 'Fathan Naufal Budiman', kelas: '2F', asrama: 'C', section: 'Brass' },
  { id: 16, name: 'Hilmi Aji Al Faqih', kelas: '2F', asrama: 'C', section: 'Brass' },

  // Section Cologuard / CG
  { id: 17, name: 'Ahmad Mumtaz D. El Haq', kelas: '1C', asrama: 'D', section: 'Cologuard' },
  { id: 18, name: 'Arza Danish Fahrera', kelas: '1C', asrama: 'D', section: 'Cologuard' },
  { id: 19, name: 'Aruna Hapiz Pranaja', kelas: '2LSA', asrama: 'A', section: 'Cologuard' },
  { id: 20, name: 'Dannish Ali Azmi', kelas: '2H', asrama: 'C', section: 'Cologuard' },
  { id: 21, name: 'Haveef Dzakyan Ellard', kelas: '2LSA', asrama: 'A', section: 'Cologuard' },
  { id: 22, name: 'Rafa Rajendra Wikrama', kelas: '2F', asrama: 'C', section: 'Cologuard' },
  { id: 23, name: 'Muhammad Ahsani Taqvim', kelas: '3B', asrama: 'B', section: 'Cologuard' },
  { id: 24, name: 'Dimas Nur Sayyid', kelas: '4D', asrama: 'C', section: 'Cologuard' },
  { id: 25, name: 'Lukman Husain Assarim', kelas: '4B', asrama: 'B', section: 'Cologuard' },
  { id: 26, name: 'M. Syam Fatih Ibrahim', kelas: '2F', asrama: 'C', section: 'Cologuard' },

  // Section Battery
  { id: 27, name: 'Ahmad Zufaril', kelas: '1C', asrama: 'D', section: 'Battery' },
  { id: 28, name: 'Ahsan Abdullah', kelas: '1C', asrama: 'D', section: 'Battery' },
  { id: 29, name: 'Arsyad Farkhi Ismail', kelas: '1C', asrama: 'D', section: 'Battery' },
  { id: 30, name: 'Atillan Azfar Rasy', kelas: '1D', asrama: 'D', section: 'Battery' },
  { id: 31, name: 'Muhammad Irsyad Wijaya', kelas: '1C', asrama: 'D', section: 'Battery' },
  { id: 32, name: 'Danendra Irknam', kelas: '2B', asrama: 'C', section: 'Battery' },
  { id: 33, name: 'Dyandra F.', kelas: '3D', asrama: 'B', section: 'Battery' },
  { id: 34, name: 'Kemal Mubarak S.', kelas: '3B', asrama: 'B', section: 'Battery' },
  { id: 35, name: 'Muhammad Hafiz Firdaus', kelas: '4C', asrama: 'D', section: 'Battery' },
  { id: 36, name: 'Muhammad Faris Shidqi', kelas: '2F', asrama: 'C', section: 'Battery' },
  { id: 37, name: 'Kevin Wahyu Ilani', kelas: '2E', asrama: 'C', section: 'Battery' },

  // Section Pit
  { id: 38, name: 'Syamil Ramadhani', kelas: '1D', asrama: 'D', section: 'Pit' },
  { id: 39, name: 'Faaris Abiyyu Indrasetya', kelas: '2LSA', asrama: 'A', section: 'Pit' },
  { id: 40, name: 'Luth Adwa Aban Widagdo', kelas: '2A', asrama: 'C', section: 'Pit' },
  { id: 41, name: 'Nabil Farasy', kelas: '2C', asrama: 'C', section: 'Pit' },
  { id: 42, name: 'Surya Arga Bintara', kelas: '2LSA', asrama: 'A', section: 'Pit' },
  { id: 43, name: 'M. Farros Prasetyaning P.', kelas: '3D', asrama: 'B', section: 'Pit' },
];

export default function App() {
  // Authentication & Users State
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>(() => {
    const saved = localStorage.getItem('pgt_system_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<SystemUser | null>(() => {
    const saved = localStorage.getItem('pgt_active_session');
    return saved ? JSON.parse(saved) : null;
  });

  // Navigation Tab State
  type AppTab = 'home' | 'attendance' | 'admin_dashboard' | 'announcements' | 'sessions' | 'recap' | 'members' | 'edit_absensi' | 'google_sheets' | 'manage_users' | 'my_history';
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [isPaperSheetModalOpen, setIsPaperSheetModalOpen] = useState(false);
  const [isInlineEditMode, setIsInlineEditMode] = useState(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingScheduleSession, setEditingScheduleSession] = useState<DailyAttendance | null>(null);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'warning' | 'info' }>({ 
    show: false, 
    message: '', 
    type: 'success' 
  });
  const [loginError, setLoginError] = useState('');

  // Password visibility on login
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Helper for tracking explicitly deleted student IDs to guarantee they never reappear
  const getDeletedStudentIds = (): Set<number> => {
    try {
      const saved = localStorage.getItem('pgt_deleted_student_ids');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  };

  // Student Data with Safe Non-resurrection Persistence
  const [students, setStudents] = useState<Student[]>(() => {
    const deletedIds = getDeletedStudentIds();
    const saved = localStorage.getItem('pgt_students');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((s: Student) => s && s.id && !deletedIds.has(s.id));
        }
      } catch (e) {}
    }
    return INITIAL_STUDENTS.filter(s => !deletedIds.has(s.id));
  });

  // Helper for tracking explicitly deleted announcement IDs to guarantee they never reappear upon refresh
  const getDeletedAnnouncementIds = (): Set<string> => {
    try {
      const saved = localStorage.getItem('pgt_deleted_announcement_ids');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  };

  // Helper for tracking explicitly deleted attendance session IDs
  const getDeletedAttendanceIds = (): Set<string> => {
    try {
      const saved = localStorage.getItem('pgt_deleted_attendance_ids');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  };

  // Announcements State (Synced with localStorage and Cloud Firestore, respecting deletions)
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const deletedIds = getDeletedAnnouncementIds();
    const saved = localStorage.getItem('pgt_announcements');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((a: Announcement) => a && a.id && !deletedIds.has(a.id));
        }
      } catch (e) {}
    }
    return INITIAL_ANNOUNCEMENTS.filter(a => !deletedIds.has(a.id));
  });

  // Member & User delete modal state
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [userToDelete, setUserToDelete] = useState<SystemUser | null>(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);

  const [attendances, setAttendances] = useState<DailyAttendance[]>(() => {
    const saved = localStorage.getItem('pgt_attendances');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: any) => ({
            ...item,
            id: item.id || `sesi-${item.date}`,
            sessionName: item.sessionName || 'Latihan Rutin',
            isSubmitted: item.isSubmitted !== false,
            submittedAt: item.submittedAt || item.date,
            submittedBy: item.submittedBy || 'Petugas Lapangan'
          }));
        }
      } catch (e) {}
    }
    return [];
  });

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSection, setSelectedSection] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [recapFilter, setRecapFilter] = useState<'all' | 'warning' | 'safe'>('all');
  const [currentSessionName, setCurrentSessionName] = useState('Latihan Rutin');

  // Modal: Submit Confirmation
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);

  // Modal: Add New Member
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentKelas, setNewStudentKelas] = useState('');
  const [newStudentAsrama, setNewStudentAsrama] = useState('A');
  const [newStudentSection, setNewStudentSection] = useState('Brass');

  // Modal: Edit Member
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isEditMemberModalOpen, setIsEditMemberModalOpen] = useState(false);

  // Modal: Add / Edit System User (Admin Only)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userFormUsername, setUserFormUsername] = useState('');
  const [userFormPassword, setUserFormPassword] = useState('');
  const [userFormFullName, setUserFormFullName] = useState('');
  const [userFormRole, setUserFormRole] = useState<'admin' | 'petugas'>('petugas');
  const [userFormSection, setUserFormSection] = useState('All');
  const [showUserFormPass, setShowUserFormPass] = useState(false);

  // Modal: Change Master Admin Password
  const [isAdminPassModalOpen, setIsAdminPassModalOpen] = useState(false);
  const [newAdminPass, setNewAdminPass] = useState('');
  const [confirmAdminPass, setConfirmAdminPass] = useState('');

  // Cloud Sync & Firestore Real-time State
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('connecting');
  const [syncError, setSyncError] = useState<string | undefined>(undefined);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [showSyncInfoModal, setShowSyncInfoModal] = useState(false);

  // Tab Navigation with Browser History Integration (Back / Undo Page Support)
  const changeTab = (newTab: AppTab, date?: string, replace?: boolean) => {
    const role = currentUser?.role || 'guest';
    try {
      if (!replace) {
        window.history.pushState({ role, tab: newTab, selectedDate: date || selectedDate }, '', `#${role}/${newTab}`);
      } else {
        window.history.replaceState({ role, tab: newTab, selectedDate: date || selectedDate }, '', `#${role}/${newTab}`);
      }
    } catch (e) {}
    setActiveTab(newTab);
    if (date) setSelectedDate(date);
  };

  // Helper to close all modal overlays
  const closeAllModals = (): boolean => {
    let hadOpenModal = false;
    if (isScheduleModalOpen) { setIsScheduleModalOpen(false); hadOpenModal = true; }
    if (isPaperSheetModalOpen) { setIsPaperSheetModalOpen(false); hadOpenModal = true; }
    if (isInlineEditMode) { setIsInlineEditMode(false); hadOpenModal = true; }
    if (isClearAllModalOpen) { setIsClearAllModalOpen(false); hadOpenModal = true; }
    if (isEditMemberModalOpen) { setIsEditMemberModalOpen(false); hadOpenModal = true; }
    if (isAddMemberModalOpen) { setIsAddMemberModalOpen(false); hadOpenModal = true; }
    if (isSubmitConfirmOpen) { setIsSubmitConfirmOpen(false); hadOpenModal = true; }
    if (isRestoreModalOpen) { setIsRestoreModalOpen(false); hadOpenModal = true; }
    if (isUserModalOpen) { setIsUserModalOpen(false); hadOpenModal = true; }
    if (isAdminPassModalOpen) { setIsAdminPassModalOpen(false); hadOpenModal = true; }
    if (showSyncInfoModal) { setShowSyncInfoModal(false); hadOpenModal = true; }
    if (isMobileMenuOpen) { setIsMobileMenuOpen(false); hadOpenModal = true; }
    return hadOpenModal;
  };

  // Undo / Go Back Action
  const handleGoBack = () => {
    // 1. If any modal is open, close modal first
    if (closeAllModals()) return;

    // 2. If browser history state exists and we are not on home, go back in history
    if (window.history.state && window.history.state.tab && activeTab !== 'home') {
      window.history.back();
    } else {
      // 3. Fallback: return to Home
      changeTab('home');
    }
  };

  // Browser History popstate listener for back / undo button
  useEffect(() => {
    if (!window.history.state && currentUser) {
      const role = currentUser.role;
      const initialTab = activeTab;
      try {
        window.history.replaceState({ role, tab: initialTab, selectedDate }, '', `#${role}/${initialTab}`);
      } catch (e) {}
    }

    const handlePopState = (e: PopStateEvent) => {
      // Close open modals first
      if (
        isScheduleModalOpen || isPaperSheetModalOpen || isInlineEditMode ||
        isClearAllModalOpen || isEditMemberModalOpen || isAddMemberModalOpen ||
        isSubmitConfirmOpen || isRestoreModalOpen || isUserModalOpen ||
        isAdminPassModalOpen || showSyncInfoModal || isMobileMenuOpen
      ) {
        closeAllModals();
        return;
      }

      const state = e.state;
      if (state && state.tab) {
        const validTabs: AppTab[] = ['home', 'attendance', 'admin_dashboard', 'announcements', 'sessions', 'recap', 'members', 'edit_absensi', 'google_sheets', 'manage_users', 'my_history'];
        if (validTabs.includes(state.tab)) {
          setActiveTab(state.tab as AppTab);
        }
        if (state.selectedDate) {
          setSelectedDate(state.selectedDate);
        }
      } else {
        setActiveTab('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [
    currentUser, activeTab, selectedDate,
    isScheduleModalOpen, isPaperSheetModalOpen, isInlineEditMode,
    isClearAllModalOpen, isEditMemberModalOpen, isAddMemberModalOpen,
    isSubmitConfirmOpen, isRestoreModalOpen, isUserModalOpen,
    isAdminPassModalOpen, showSyncInfoModal, isMobileMenuOpen
  ]);

  // Real-time Cloud Synchronization with Firebase Firestore
  useEffect(() => {
    const unsubStatus = onSyncStatusChange((status, err) => {
      setSyncStatus(status);
      setSyncError(err);
    });

    // Check & auto-seed if cloud database is empty (including announcements)
    seedInitialDatabaseIfEmpty(INITIAL_STUDENTS, INITIAL_USERS, INITIAL_ANNOUNCEMENTS).catch((err) => {
      console.warn('[Firestore] Seed check notice:', err);
    });

    // Real-time listener for deleted announcements from Cloud Firestore
    const unsubDeletedAnnouncements = subscribeDeletedAnnouncements((cloudDeletedIds) => {
      if (Array.isArray(cloudDeletedIds) && cloudDeletedIds.length > 0) {
        const localSet = getDeletedAnnouncementIds();
        let changed = false;
        cloudDeletedIds.forEach(id => {
          if (!localSet.has(id)) {
            localSet.add(id);
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem('pgt_deleted_announcement_ids', JSON.stringify(Array.from(localSet)));
        }
        setAnnouncements(prev => {
          const filtered = prev.filter(a => !localSet.has(a.id));
          localStorage.setItem('pgt_announcements', JSON.stringify(filtered));
          return filtered;
        });
      }
    });

    // Real-time listener for deleted attendances/sessions from Cloud Firestore
    const unsubDeletedAttendances = subscribeDeletedAttendances((cloudDeletedIds) => {
      if (Array.isArray(cloudDeletedIds) && cloudDeletedIds.length > 0) {
        const localSet = getDeletedAttendanceIds();
        let changed = false;
        cloudDeletedIds.forEach(id => {
          if (!localSet.has(id)) {
            localSet.add(id);
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem('pgt_deleted_attendance_ids', JSON.stringify(Array.from(localSet)));
        }
        setAttendances(prev => {
          const filtered = prev.filter(s => !localSet.has(s.id || '') && !localSet.has(`sesi-${s.date}`) && !localSet.has(s.date));
          localStorage.setItem('pgt_attendances', JSON.stringify(filtered));
          return filtered;
        });
      }
    });

    // Real-time listener for deleted students from Cloud Firestore
    const unsubDeletedStudents = subscribeDeletedStudents((cloudDeletedIds) => {
      if (Array.isArray(cloudDeletedIds) && cloudDeletedIds.length > 0) {
        const localSet = getDeletedStudentIds();
        let changed = false;
        cloudDeletedIds.forEach(id => {
          if (!localSet.has(id)) {
            localSet.add(id);
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem('pgt_deleted_student_ids', JSON.stringify(Array.from(localSet)));
        }
        setStudents(prev => {
          const filtered = prev.filter(s => !localSet.has(s.id));
          localStorage.setItem('pgt_students', JSON.stringify(filtered));
          return filtered;
        });
      }
    });

    // Real-time listener for students (Authoritative Cloud Sync: respects deletions and local-only additions)
    const unsubStudents = subscribeStudents((remoteStudents) => {
      if (Array.isArray(remoteStudents)) {
        const deletedIds = getDeletedStudentIds();
        setStudents(prev => {
          const map = new Map<number, Student>();
          // 1. Authoritative active students from cloud Firestore
          remoteStudents.forEach(remoteS => {
            if (!deletedIds.has(remoteS.id)) {
              map.set(remoteS.id, remoteS);
            }
          });
          // 2. Preserve only brand new un-synced local additions created in current session
          if (prev && prev.length > 0 && remoteStudents.length > 0) {
            const nowTime = Date.now();
            prev.forEach(s => {
              if (s.id > 1000000000000 && (nowTime - s.id < 15000) && !deletedIds.has(s.id) && !map.has(s.id)) {
                map.set(s.id, s);
              }
            });
          }
          const merged = Array.from(map.values()).sort((a, b) => a.id - b.id);
          localStorage.setItem('pgt_students', JSON.stringify(merged));
          return merged;
        });
      }
    });

    // Real-time listener for attendances (Authoritative Cloud Sync)
    const unsubAttendances = subscribeAttendances((remoteAttendances) => {
      if (Array.isArray(remoteAttendances)) {
        const deletedIds = getDeletedAttendanceIds();
        setAttendances(prev => {
          const map = new Map<string, DailyAttendance>();

          // Remote attendances from Cloud Firestore (primary source of truth)
          remoteAttendances.forEach(ra => {
            const docId = ra.id || `sesi-${ra.date}`;
            if (!deletedIds.has(docId) && !deletedIds.has(ra.date)) {
              map.set(docId, ra);
            }
          });

          // Preserve only recent local additions waiting for cloud write
          if (prev && prev.length > 0) {
            prev.forEach(localSess => {
              const docId = localSess.id || `sesi-${localSess.date}`;
              if (!deletedIds.has(docId) && !deletedIds.has(localSess.date) && !map.has(docId)) {
                if (localSess.id && localSess.id.startsWith('sesi-custom-')) {
                  map.set(docId, localSess);
                }
              }
            });
          }

          const sorted = sortSessionsByClosest(Array.from(map.values()));
          localStorage.setItem('pgt_attendances', JSON.stringify(sorted));
          return sorted;
        });
      }
    });

    // Real-time listener for system users (Safe Merge: never discard default system users)
    const unsubUsers = subscribeSystemUsers((remoteUsers) => {
      if (remoteUsers && remoteUsers.length > 0) {
        setSystemUsers(prev => {
          const map = new Map<string, SystemUser>();
          INITIAL_USERS.forEach(u => map.set(u.id, u));
          if (prev && prev.length > 0) {
            prev.forEach(u => map.set(u.id, { ...map.get(u.id), ...u }));
          }
          remoteUsers.forEach(ru => {
            map.set(ru.id, { ...map.get(ru.id), ...ru });
          });
          const merged = Array.from(map.values());
          localStorage.setItem('pgt_system_users', JSON.stringify(merged));
          return merged;
        });
      }
    });

    // Real-time listener for announcements (Authoritative Cloud Sync: respects deletions across all devices)
    const unsubAnnouncements = subscribeAnnouncements((remoteAnn) => {
      if (Array.isArray(remoteAnn)) {
        const deletedIds = getDeletedAnnouncementIds();
        setAnnouncements(prev => {
          const map = new Map<string, Announcement>();

          // 1. Authoritative announcements from Cloud Firestore
          remoteAnn.forEach(ra => {
            if (!deletedIds.has(ra.id)) {
              map.set(ra.id, ra);
            }
          });

          // 2. Preserve only brand new un-synced local additions created in current session
          if (prev && prev.length > 0) {
            prev.forEach(a => {
              const isRecentTemp = a.id.startsWith('ann-') && a.id.length > 15;
              if (isRecentTemp && !deletedIds.has(a.id) && !map.has(a.id)) {
                map.set(a.id, a);
              }
            });
          }

          const merged = Array.from(map.values()).sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return b.createdAt.localeCompare(a.createdAt);
          });
          localStorage.setItem('pgt_announcements', JSON.stringify(merged));
          return merged;
        });
      }
    });

    return () => {
      unsubStatus();
      unsubStudents();
      unsubAttendances();
      unsubUsers();
      unsubAnnouncements();
      unsubDeletedAnnouncements();
      unsubDeletedAttendances();
      unsubDeletedStudents();
    };
  }, []);

  // Sync currentSessionName when selectedDate or attendances change
  useEffect(() => {
    const existing = attendances.find(a => a.date === selectedDate);
    if (existing?.sessionName) {
      setCurrentSessionName(existing.sessionName);
    }
  }, [selectedDate, attendances]);

  // Otomatisasi penutupan sesi yang sudah lewat tanggalnya (Expired Auto-Close)
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const expiredUnclosed = attendances.filter(a => a.date < todayStr && !a.isClosed);
    if (expiredUnclosed.length > 0) {
      const nowStr = new Date().toLocaleString('id-ID');
      setAttendances(prev => {
        const nextList = prev.map(a => {
          if (a.date < todayStr && !a.isClosed) {
            return {
              ...a,
              isClosed: true,
              closedAt: a.closedAt || nowStr,
              closedBy: a.closedBy || 'Sistem (Otomatis Expired)'
            };
          }
          return a;
        });
        localStorage.setItem('pgt_attendances', JSON.stringify(nextList));
        return nextList;
      });

      // Background cloud sync
      expiredUnclosed.forEach(s => {
        saveAttendanceToCloud({
          ...s,
          isClosed: true,
          closedAt: s.closedAt || nowStr,
          closedBy: s.closedBy || 'Sistem (Otomatis Expired)'
        }).catch(() => {});
      });
    }
  }, [attendances.length]);

  // Otomatisasi Pengumuman Hari-H (Auto Announcement for Practice Day)
  useEffect(() => {
    // Tunggu hingga terkoneksi ke cloud agar tidak terjadi duplikasi saat data masih loading
    if (syncStatus === 'connecting') return;

    const todayStr = new Date().toISOString().split('T')[0];
    const sessionsToday = attendances.filter(a => a.date === todayStr);
    
    if (sessionsToday.length > 0) {
      sessionsToday.forEach(session => {
        // Gunakan ID unik berdasarkan tanggal dan ID sesi agar tidak duplikat
        const autoId = `auto-practice-${session.date}-${session.id || 'default'}`;
        
        // Cek apakah pengumuman otomatis ini sudah ada di state saat ini
        const alreadyExists = announcements.some(ann => ann.id === autoId);
        
        if (!alreadyExists) {
          const newAnn: Announcement = {
            id: autoId,
            title: `📢 Agenda Hari Ini: ${session.sessionName || 'Latihan Rutin'}`,
            content: `Halo rekan-rekan! Hari ini kita memiliki jadwal latihan "${session.sessionName || 'Latihan Rutin'}"${session.scheduledTime ? ' pada pukul ' + session.scheduledTime : ''}${session.location ? ' bertempat di ' + session.location : ''}. Mohon kehadirannya tepat waktu dan persiapkan instrumen masing-masing. Semangat!`,
            category: 'schedule',
            targetAudience: (session.targetSection as any) || 'All',
            author: 'Sistem PGT',
            authorRole: 'Bot Notifikasi',
            createdAt: todayStr,
            pinned: true,
            isAuto: true
          };
          
          // Simpan ke state lokal untuk feedback instan (subscription akan memperbarui ini nanti juga)
          setAnnouncements(prev => {
            if (prev.some(a => a.id === autoId)) return prev;
            return [newAnn, ...prev];
          });
          
          // Simpan ke cloud database untuk persistensi
          saveAnnouncementToCloud(newAnn).catch(err => {
            console.error('[Automation] Gagal menyimpan pengumuman otomatis:', err);
          });
        }
      });
    }
  }, [attendances.length, announcements.length]);

  // Local Storage Synchronizations
  useEffect(() => {
    localStorage.setItem('pgt_system_users', JSON.stringify(systemUsers));
  }, [systemUsers]);

  useEffect(() => {
    localStorage.setItem('pgt_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('pgt_attendances', JSON.stringify(attendances));
  }, [attendances]);

  useEffect(() => {
    localStorage.setItem('pgt_announcements', JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('pgt_active_session', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('pgt_active_session');
    }
  }, [currentUser]);

  // If officer logs in with assigned section, preset the section filter
  useEffect(() => {
    if (currentUser && currentUser.role === 'petugas' && currentUser.assignedSection !== 'All') {
      setSelectedSection(currentUser.assignedSection);
    }
  }, [currentUser]);

  const triggerToast = (msg: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    const isError = type === 'error' || msg.toLowerCase().startsWith('error') || msg.toLowerCase().includes('gagal');
    setToast({ show: true, message: msg, type: isError ? 'error' : type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, isError ? 8000 : 4000);
  };

  // Secure Unified Login Handler
  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target = e.currentTarget;
    const username = (target.elements.namedItem('username') as HTMLInputElement).value.trim();
    const password = (target.elements.namedItem('password') as HTMLInputElement).value;

    const matchedUser = systemUsers.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );

    if (matchedUser) {
      setCurrentUser(matchedUser);
      setLoginError('');
      if (matchedUser.role === 'admin') {
        setActiveTab('home');
        triggerToast(`Selamat datang, Administrator (${matchedUser.fullName})!`);
      } else {
        setActiveTab('attendance');
        if (matchedUser.assignedSection !== 'All') {
          setSelectedSection(matchedUser.assignedSection);
        }
        triggerToast(`Selamat bertugas, ${matchedUser.fullName}!`);
      }
    } else {
      setLoginError('ID Pengguna atau Kata Sandi tidak sesuai. Hubungi Administrator jika lupa kata sandi.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSearchQuery('');
    setIsMobileMenuOpen(false);
  };

  // User Management Handlers (Admin Only)
  const handleOpenAddUserModal = () => {
    setEditingUserId(null);
    setUserFormUsername('');
    setUserFormPassword('');
    setUserFormFullName('');
    setUserFormRole('petugas');
    setUserFormSection('All');
    setIsUserModalOpen(true);
  };

  const handleOpenEditUserModal = (u: SystemUser) => {
    setEditingUserId(u.id);
    setUserFormUsername(u.username);
    setUserFormPassword(u.password);
    setUserFormFullName(u.fullName);
    setUserFormRole(u.role);
    setUserFormSection(u.assignedSection || 'All');
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = userFormUsername.trim().toLowerCase();
    const cleanFullName = userFormFullName.trim();
    const cleanPass = userFormPassword.trim();

    if (!cleanUsername || !cleanFullName || !cleanPass) {
      triggerToast('Mohon lengkapi seluruh kolom input.', 'warning');
      return;
    }

    // Check duplicate username if adding new or renaming
    const existing = systemUsers.find(
      u => u.username.toLowerCase() === cleanUsername && u.id !== editingUserId
    );
    if (existing) {
      triggerToast('Username tersebut sudah digunakan oleh pengguna lain. Harap gunakan username lain.', 'warning');
      return;
    }

    if (editingUserId) {
      // Update existing user
      const existingUser = systemUsers.find(u => u.id === editingUserId);
      const updatedUser: SystemUser = {
        id: editingUserId,
        username: cleanUsername,
        password: cleanPass,
        fullName: cleanFullName,
        role: userFormRole,
        assignedSection: userFormSection,
        createdAt: existingUser?.createdAt || new Date().toISOString().split('T')[0]
      };

      setSystemUsers(prev => prev.map(u => u.id === editingUserId ? updatedUser : u));

      // If updating current logged in user
      if (currentUser?.id === editingUserId) {
        setCurrentUser(updatedUser);
      }

      setIsUserModalOpen(false);
      triggerToast(`Akun "${cleanFullName}" berhasil diperbarui & disimpan ke Cloud!`);

      // Persist to Cloud Firestore
      try {
        await saveUserToCloud(updatedUser);
      } catch (err) {
        console.warn('Gagal simpan user ke cloud, data tersimpan di lokal:', err);
      }
    } else {
      // Create new user
      const newUser: SystemUser = {
        id: 'user-' + Date.now(),
        username: cleanUsername,
        password: cleanPass,
        fullName: cleanFullName,
        role: userFormRole,
        assignedSection: userFormSection,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setSystemUsers(prev => [...prev, newUser]);
      setIsUserModalOpen(false);
      triggerToast(`Petugas / User "${cleanFullName}" berhasil didaftarkan & disimpan ke Cloud!`);

      // Persist to Cloud Firestore
      try {
        await saveUserToCloud(newUser);
      } catch (err) {
        console.warn('Gagal simpan user baru ke cloud, data tersimpan di lokal:', err);
      }
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (userId === currentUser?.id) {
      triggerToast('Anda tidak dapat menghapus akun Anda sendiri saat sedang masuk.', 'warning');
      return;
    }
    const adminCount = systemUsers.filter(u => u.role === 'admin').length;
    const targetUser = systemUsers.find(u => u.id === userId);
    if (targetUser?.role === 'admin' && adminCount <= 1) {
      triggerToast('Tidak dapat menghapus akun admin terakhir. Minimal harus ada 1 akun Administrator.', 'warning');
      return;
    }

    if (targetUser) {
      setUserToDelete(targetUser);
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    const userId = userToDelete.id;
    const userName = userToDelete.fullName || userToDelete.username;
    setUserToDelete(null);

    setSystemUsers(prev => prev.filter(u => u.id !== userId));
    triggerToast(`Akun "${userName}" telah dihapus.`);

    // Persist deletion to Cloud Firestore
    try {
      await deleteUserFromCloud(userId);
    } catch (err) {
      console.warn('Gagal hapus user di cloud:', err);
    }
  };

  // Change Admin Password (Secret setting)
  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminPass.trim()) {
      triggerToast('Kata sandi baru tidak boleh kosong.', 'warning');
      return;
    }
    if (newAdminPass !== confirmAdminPass) {
      triggerToast('Konfirmasi kata sandi tidak cocok. Silakan ketik ulang.', 'warning');
      return;
    }

    if (currentUser) {
      const updatedAdmin: SystemUser = { ...currentUser, password: newAdminPass };
      setSystemUsers(prev => prev.map(u => u.id === currentUser.id ? updatedAdmin : u));
      setCurrentUser(updatedAdmin);
      setIsAdminPassModalOpen(false);
      setNewAdminPass('');
      setConfirmAdminPass('');
      triggerToast('Kata sandi rahasia Administrator Anda berhasil diubah & disimpan ke Cloud!');

      // Persist to Cloud Firestore
      try {
        await saveUserToCloud(updatedAdmin);
      } catch (err) {
        console.warn('Gagal simpan password ke cloud:', err);
      }
    }
  };

  // Attendance Handlers
  const handleSaveAttendance = (studentId: number, status: string, note: string) => {
    // Non-admin check: locked / expired closed session or upcoming countdown
    if (currentUser?.role !== 'admin') {
      const existingSession = attendances.find(a => a.date === selectedDate);
      if (existingSession?.isClosed) {
        triggerToast('Presensi terkunci. Sesi telah ditutup & hanya Administrator yang dapat mengubah data.', 'warning');
        return;
      }
      const countdown = calculateSessionCountdown(selectedDate, existingSession?.scheduledTime);
      if (countdown.isUpcoming) {
        triggerToast(`Presensi belum dibuka. Sesi dimulai dalam ${countdown.formatted}.`, 'warning');
        return;
      }
    }

    setAttendances(prev => {
      const dateIndex = prev.findIndex(a => a.date === selectedDate);
      let sessionObj: DailyAttendance;
      let nextList: DailyAttendance[];

      if (dateIndex === -1) {
        sessionObj = {
          id: `sesi-${selectedDate}`,
          date: selectedDate,
          sessionName: currentSessionName || 'Latihan Rutin',
          isSubmitted: false, // DRAFT by default until user submits
          submittedAt: null,
          submittedBy: null,
          records: status ? [{ studentId, status, note }] : []
        };
        nextList = [...prev, sessionObj];
      } else {
        const existingSession = prev[dateIndex];
        const existingRecords = existingSession.records || [];
        const recordIndex = existingRecords.findIndex(r => r.studentId === studentId);
        let nextRecords: AttendanceRecord[];

        if (recordIndex === -1) {
          nextRecords = status ? [...existingRecords, { studentId, status, note }] : existingRecords;
        } else {
          if (!status) {
            nextRecords = existingRecords.filter(r => r.studentId !== studentId);
          } else {
            nextRecords = existingRecords.map(r => r.studentId === studentId ? { studentId, status, note } : r);
          }
        }

        sessionObj = {
          ...existingSession,
          id: existingSession.id || `sesi-${selectedDate}`,
          sessionName: currentSessionName || existingSession.sessionName || 'Latihan Rutin',
          records: nextRecords
        };

        nextList = prev.map((s, idx) => idx === dateIndex ? sessionObj : s);
      }

      localStorage.setItem('pgt_attendances', JSON.stringify(nextList));
      return nextList;
    });
  };

  const handleMarkAllPresent = () => {
    // Non-admin check: locked / expired closed session or upcoming countdown
    if (currentUser?.role !== 'admin') {
      const existingSession = attendances.find(a => a.date === selectedDate);
      if (existingSession?.isClosed) {
        triggerToast('Presensi terkunci. Sesi telah ditutup & hanya Administrator yang dapat mengubah data.', 'warning');
        return;
      }
      const countdown = calculateSessionCountdown(selectedDate, existingSession?.scheduledTime);
      if (countdown.isUpcoming) {
        triggerToast(`Presensi belum dibuka. Sesi dimulai dalam ${countdown.formatted}.`, 'warning');
        return;
      }
    }

    setAttendances(prev => {
      const dateIndex = prev.findIndex(a => a.date === selectedDate);
      let sessionObj: DailyAttendance;
      let nextList: DailyAttendance[];

      if (dateIndex === -1) {
        const records = filteredStudents.map(student => ({
          studentId: student.id,
          status: 'Hadir',
          note: ''
        }));
        sessionObj = {
          id: `sesi-${selectedDate}`,
          date: selectedDate,
          sessionName: currentSessionName || 'Latihan Rutin',
          isSubmitted: false,
          submittedAt: null,
          submittedBy: null,
          records
        };
        nextList = [...prev, sessionObj];
      } else {
        const existingSession = prev[dateIndex];
        const existingRecords = existingSession.records || [];
        const recordsMap = new Map(existingRecords.map(r => [r.studentId, r]));

        filteredStudents.forEach(student => {
          const rec = recordsMap.get(student.id);
          recordsMap.set(student.id, {
            studentId: student.id,
            status: 'Hadir',
            note: rec?.note || ''
          });
        });

        sessionObj = {
          ...existingSession,
          id: existingSession.id || `sesi-${selectedDate}`,
          sessionName: currentSessionName || existingSession.sessionName || 'Latihan Rutin',
          records: Array.from(recordsMap.values())
        };
        nextList = prev.map((s, idx) => idx === dateIndex ? sessionObj : s);
      }

      localStorage.setItem('pgt_attendances', JSON.stringify(nextList));
      saveAttendanceToCloud(sessionObj).catch(() => {});
      return nextList;
    });
    triggerToast(`Semua anggota ${selectedSection === 'All' ? 'aktif' : selectedSection} ditandai Hadir!`);
  };

  const getCurrentRecord = (studentId: number) => {
    const dateData = attendances.find(a => a.date === selectedDate);
    return dateData?.records.find(r => r.studentId === studentId) || { status: '', note: '' };
  };

  const currentSession = useMemo(() => {
    return attendances.find(a => a.date === selectedDate);
  }, [attendances, selectedDate]);

  // Unified Save / Update Handler for Current Session
  const handleSaveCurrentSession = async (asSubmitted?: boolean) => {
    const existing = attendances.find(a => a.date === selectedDate);
    const records = existing?.records || [];

    if (records.length === 0 && asSubmitted) {
      triggerToast('Belum ada data presensi yang diisi untuk sesi ini.', 'warning');
      return;
    }

    const nowStr = new Date().toLocaleString('id-ID');
    const officerName = currentUser?.fullName || 'Petugas Lapangan';
    const isSub = asSubmitted !== undefined ? asSubmitted : (existing?.isSubmitted ?? false);

    const sessionToSave: DailyAttendance = {
      id: existing?.id || `sesi-${selectedDate}`,
      date: selectedDate,
      sessionName: currentSessionName || existing?.sessionName || 'Latihan Rutin',
      isSubmitted: isSub,
      submittedAt: isSub ? (existing?.submittedAt || nowStr) : null,
      submittedBy: isSub ? (existing?.submittedBy || officerName) : null,
      records: records
    };

    setAttendances(prev => {
      const idx = prev.findIndex(a => a.date === selectedDate);
      let nextList: DailyAttendance[];
      if (idx === -1) {
        nextList = [...prev, sessionToSave];
      } else {
        nextList = prev.map((s, i) => i === idx ? sessionToSave : s);
      }
      localStorage.setItem('pgt_attendances', JSON.stringify(nextList));
      return nextList;
    });

    if (isSub) {
      triggerToast(`Perubahan sesi presensi tanggal ${selectedDate} (${sessionToSave.sessionName}) berhasil disimpan!`);
    } else {
      triggerToast(`Draf presensi tanggal ${selectedDate} (${sessionToSave.sessionName}) berhasil disimpan!`);
    }

    // Persist session to Cloud Firestore
    try {
      await saveAttendanceToCloud(sessionToSave);
    } catch (e: any) {
      console.warn("Gagal simpan absensi ke cloud:", e);
      triggerToast('Data presensi tersimpan di perangkat lokal.', 'warning');
    }
  };

  // Submit / Finalize attendance session
  const handleFinalizeSubmit = async () => {
    const currentRecords = currentSession?.records || [];
    if (currentRecords.length === 0) {
      triggerToast('Belum ada data presensi yang diisi untuk sesi ini.', 'warning');
      return;
    }

    const nowStr = new Date().toLocaleString('id-ID');
    const officerName = currentUser?.fullName || 'Petugas Lapangan';

    const sessionToSave: DailyAttendance = {
      id: currentSession?.id || `sesi-${selectedDate}`,
      date: selectedDate,
      sessionName: currentSessionName || currentSession?.sessionName || 'Latihan Rutin',
      isSubmitted: true,
      submittedAt: nowStr,
      submittedBy: officerName,
      records: currentRecords
    };

    setAttendances(prev => {
      const idx = prev.findIndex(a => a.date === selectedDate);
      let nextList: DailyAttendance[];
      if (idx === -1) {
        nextList = [...prev, sessionToSave];
      } else {
        nextList = prev.map((s, i) => i === idx ? sessionToSave : s);
      }
      localStorage.setItem('pgt_attendances', JSON.stringify(nextList));
      return nextList;
    });

    setIsSubmitConfirmOpen(false);
    triggerToast(`Presensi tanggal ${selectedDate} resmi disubmit ke Rekapitulasi & Leaderboard!`);

    // Persist session to Cloud Firestore
    try {
      await saveAttendanceToCloud(sessionToSave);
    } catch (e: any) {
      console.warn("Gagal simpan absensi ke cloud:", e);
      triggerToast('Presensi tersimpan di lokal (Cloud belum tersinkron).', 'warning');
    }

    // Auto-sync to Google Sheets if configured
    try {
      const savedConfig = localStorage.getItem('pgt_sheet_config');
      if (savedConfig) {
        const cfg = JSON.parse(savedConfig);
        if (cfg.autoSync && cfg.spreadsheetId && getGoogleAccessToken()) {
          await appendSingleSessionToSheet(cfg.spreadsheetId, {
            ...sessionToSave,
            id: sessionToSave.id || `sesi-${selectedDate}`,
            submittedAt: sessionToSave.submittedAt || nowStr,
            submittedBy: sessionToSave.submittedBy || officerName
          }, students);
          triggerToast('Data presensi otomatis tersinkron ke Google Sheets!');
        }
      }
    } catch (err: any) {
      console.error('Auto sync error:', err);
    }
  };

  const handleRevertToDraft = (date: string) => {
    let revertedSession: DailyAttendance | null = null;
    setAttendances(prev => {
      const nextList = prev.map(a => {
        if (a.date === date) {
          revertedSession = { ...a, isSubmitted: false };
          return revertedSession;
        }
        return a;
      });
      localStorage.setItem('pgt_attendances', JSON.stringify(nextList));
      return nextList;
    });
    triggerToast(`Sesi tanggal ${date} dikembalikan ke Draf (dikeluarkan dari rekapitulasi).`);
    if (revertedSession) {
      saveAttendanceToCloud(revertedSession).catch(() => {});
    }
  };

  const handleSaveSchedule = async (scheduleData: {
    date: string;
    sessionName: string;
    scheduledTime: string;
    location: string;
    targetSection: string;
    description: string;
    autoPublishAnnouncement: boolean;
  }) => {
    let savedSession: DailyAttendance | null = null;
    setAttendances(prev => {
      const existingIndex = prev.findIndex(a => a.date === scheduleData.date);
      let updated: DailyAttendance[];
      if (existingIndex >= 0) {
        updated = [...prev];
        savedSession = {
          ...updated[existingIndex],
          sessionName: scheduleData.sessionName,
          scheduledTime: scheduleData.scheduledTime,
          location: scheduleData.location,
          targetSection: scheduleData.targetSection,
          description: scheduleData.description,
          isScheduled: true
        };
        updated[existingIndex] = savedSession;
      } else {
        savedSession = {
          id: `sesi-${scheduleData.date}`,
          date: scheduleData.date,
          sessionName: scheduleData.sessionName,
          scheduledTime: scheduleData.scheduledTime,
          location: scheduleData.location,
          targetSection: scheduleData.targetSection,
          description: scheduleData.description,
          isScheduled: true,
          isSubmitted: false,
          records: []
        };
        updated = [savedSession, ...prev];
      }
      updated.sort((a, b) => b.date.localeCompare(a.date));
      localStorage.setItem('pgt_attendances', JSON.stringify(updated));
      return updated;
    });

    if (savedSession) {
      saveAttendanceToCloud(savedSession).catch(err => console.warn('Cloud sync schedule error:', err));
    }

    if (scheduleData.autoPublishAnnouncement) {
      const newAnn: Announcement = {
        id: `ann-sched-${Date.now()}`,
        title: `📅 ${scheduleData.sessionName} (${scheduleData.date})`,
        content: `Jadwal Latihan Resmi diterbitkan:\n\n• Waktu: ${scheduleData.scheduledTime}\n• Lokasi: ${scheduleData.location}\n• Unit: ${scheduleData.targetSection === 'All' ? 'Seluruh Unit Korps' : scheduleData.targetSection}\n• Catatan: ${scheduleData.description || '-'}\n\nHarap seluruh anggota bersiap dan hadir tepat waktu.`,
        category: 'schedule',
        targetAudience: (['All', 'Brass', 'Cologuard', 'Battery', 'Pit'].includes(scheduleData.targetSection) ? scheduleData.targetSection : 'All') as any,
        author: currentUser?.fullName || 'Administrator Utama',
        authorRole: currentUser?.role === 'admin' ? 'Super Admin' : 'Petugas Lapangan',
        createdAt: new Date().toISOString().split('T')[0],
        pinned: true
      };
      setAnnouncements(prev => {
        const updated = [newAnn, ...prev];
        localStorage.setItem('pgt_announcements', JSON.stringify(updated));
        saveAnnouncementToCloud(newAnn).catch(() => {});
        return updated;
      });
    }

    setSelectedDate(scheduleData.date);
    if (scheduleData.sessionName) setCurrentSessionName(scheduleData.sessionName);
    triggerToast(`Jadwal latihan "${scheduleData.sessionName}" tanggal ${scheduleData.date} resmi diterbitkan!`, 'success');
  };

  const handleSaveBatchSchedule = async (batchData: BatchScheduleData) => {
    const newSessionsToSave: DailyAttendance[] = [];

    setAttendances(prev => {
      const copy = [...prev];
      for (const item of batchData.sessions) {
        const existingIdx = copy.findIndex(a => a.date === item.date);
        let sessionObj: DailyAttendance;
        if (existingIdx >= 0) {
          sessionObj = {
            ...copy[existingIdx],
            sessionName: item.sessionName,
            scheduledTime: item.scheduledTime,
            location: item.location,
            targetSection: item.targetSection,
            description: item.description,
            isScheduled: true
          };
          copy[existingIdx] = sessionObj;
        } else {
          sessionObj = {
            id: `sesi-${item.date}`,
            date: item.date,
            sessionName: item.sessionName,
            scheduledTime: item.scheduledTime,
            location: item.location,
            targetSection: item.targetSection,
            description: item.description,
            isScheduled: true,
            isSubmitted: false,
            records: []
          };
          copy.push(sessionObj);
        }
        newSessionsToSave.push(sessionObj);
      }
      copy.sort((a, b) => b.date.localeCompare(a.date));
      localStorage.setItem('pgt_attendances', JSON.stringify(copy));
      return copy;
    });

    // Sync all new sessions to Cloud
    newSessionsToSave.forEach(s => {
      saveAttendanceToCloud(s).catch(() => {});
    });

    if (batchData.autoPublishAnnouncement && batchData.sessions.length > 0) {
      const first = batchData.sessions[0];
      const last = batchData.sessions[batchData.sessions.length - 1];
      const dateListStr = batchData.sessions.slice(0, 8).map(s => `• ${s.date} (${s.sessionName}) - ${s.scheduledTime}`).join('\n');
      const moreCount = batchData.sessions.length > 8 ? `\n...dan ${batchData.sessions.length - 8} sesi lainnya` : '';
      
      const newAnn: Announcement = {
        id: `ann-batch-${Date.now()}`,
        title: `⚡ Jadwal Rutin Otomatis (${batchData.sessions.length} Sesi Terbit)`,
        content: `Administrator telah menerbitkan ${batchData.sessions.length} sesi latihan otomatis untuk periode ${first.date} s/d ${last.date}:\n\n${dateListStr}${moreCount}\n\n• Lokasi: ${first.location}\n• Unit: ${first.targetSection === 'All' ? 'Seluruh Korps' : first.targetSection}\n\nMohon seluruh anggota mencatat jadwal dan hadir tepat waktu.`,
        category: 'schedule',
        targetAudience: 'All',
        author: currentUser?.fullName || 'Administrator Utama',
        authorRole: 'Super Admin',
        createdAt: new Date().toISOString().split('T')[0],
        pinned: true
      };

      setAnnouncements(prev => {
        const updated = [newAnn, ...prev];
        localStorage.setItem('pgt_announcements', JSON.stringify(updated));
        saveAnnouncementToCloud(newAnn).catch(() => {});
        return updated;
      });
    }

    if (batchData.sessions.length > 0) {
      setSelectedDate(batchData.sessions[0].date);
      setCurrentSessionName(batchData.sessions[0].sessionName);
    }

    triggerToast(`⚡ Berhasil menjadwalkan ${batchData.sessions.length} sesi latihan otomatis!`, 'success');
  };

  const handleDeleteSchedule = async (sessionId: string) => {
    setAttendances(prev => {
      const updated = prev.filter(a => (a.id || `sesi-${a.date}`) !== sessionId);
      localStorage.setItem('pgt_attendances', JSON.stringify(updated));
      return updated;
    });
    deleteAttendanceFromCloud(sessionId).catch(() => {});
    triggerToast('Jadwal sesi latihan berhasil dihapus.');
  };

  // Member editing handler
  const handleSaveEditedStudent = async (updated: Student) => {
    setStudents(prev => {
      const next = prev.map(s => s.id === updated.id ? updated : s);
      localStorage.setItem('pgt_students', JSON.stringify(next));
      return next;
    });
    setIsEditMemberModalOpen(false);
    setEditingStudent(null);
    triggerToast(`Data pemain "${updated.name}" berhasil diperbarui & disimpan!`);

    // Persist to Cloud Firestore
    try {
      await saveStudentToCloud(updated);
    } catch (e: any) {
      console.warn("Gagal simpan edit member ke cloud:", e);
      triggerToast('Data pemain tersimpan di lokal (Cloud belum tersinkron).', 'warning');
    }
  };

  // Paper Attendance Sheet (Lembar Presensi Kertas) batch update handler
  const handleSaveAllPaperSheet = async (updatedStudents: Student[]) => {
    const cleanedStudents = updatedStudents.filter(s => s && s.name && s.name.trim() !== '');

    // Identify which old students were omitted/removed in paper sheet update
    const oldIds = new Set(students.map(s => s.id));
    const newIds = new Set(cleanedStudents.map(s => s.id));
    const removedIds: number[] = [];
    oldIds.forEach(id => {
      if (!newIds.has(id)) {
        removedIds.push(id);
      }
    });

    if (removedIds.length > 0) {
      const deletedSet = getDeletedStudentIds();
      removedIds.forEach(id => deletedSet.add(id));
      localStorage.setItem('pgt_deleted_student_ids', JSON.stringify(Array.from(deletedSet)));
    }

    setStudents(cleanedStudents);
    localStorage.setItem('pgt_students', JSON.stringify(cleanedStudents));
    setIsPaperSheetModalOpen(false);
    triggerToast(`Data ${cleanedStudents.length} anggota berhasil diperbarui sesuai presensi kertas! Rekap otomatis disinkronkan.`, 'success');

    try {
      await replaceAllStudentsInCloud(cleanedStudents, removedIds);
    } catch (e: any) {
      console.warn("Gagal simpan massal ke cloud:", e);
      triggerToast('Perubahan tersimpan di lokal (Cloud belum tersinkron).', 'warning');
    }
  };

  // Sessions management handlers
  const handleUpdateSession = async (updatedSession: DailyAttendance) => {
    const sId = updatedSession.id || `sesi-${updatedSession.date}`;
    const cleanSession: DailyAttendance = {
      ...updatedSession,
      id: sId,
      sessionName: updatedSession.sessionName || 'Latihan Rutin'
    };

    setAttendances(prev => {
      const idx = prev.findIndex(s => (s.id && s.id === cleanSession.id) || s.date === cleanSession.date);
      let nextList: DailyAttendance[];
      if (idx === -1) {
        nextList = [...prev, cleanSession];
      } else {
        nextList = prev.map((s, i) => i === idx ? cleanSession : s);
      }
      localStorage.setItem('pgt_attendances', JSON.stringify(nextList));
      return nextList;
    });

    triggerToast(`Perubahan sesi tanggal ${cleanSession.date} berhasil disimpan!`);

    // Persist to Cloud Firestore
    try {
      await saveAttendanceToCloud(cleanSession);
    } catch (e: any) {
      console.warn("Gagal simpan update sesi ke cloud:", e);
      triggerToast('Perubahan tersimpan di lokal (Cloud belum tersinkron).', 'warning');
    }
  };

  const handleToggleCloseCurrentSession = async () => {
    if (currentUser?.role !== 'admin') {
      triggerToast('Hanya Administrator yang berwenang membuka kunci atau menutup sesi latihan.', 'warning');
      return;
    }
    const currentSession = attendances.find(a => a.date === selectedDate);
    const isCurrentlyClosed = Boolean(currentSession?.isClosed);
    const nowStr = new Date().toLocaleString('id-ID');
    const updated: DailyAttendance = {
      ...(currentSession || {
        date: selectedDate,
        sessionName: currentSessionName || 'Latihan Rutin',
        records: []
      }),
      id: currentSession?.id || `sesi-${selectedDate}`,
      sessionName: currentSession?.sessionName || currentSessionName || 'Latihan Rutin',
      isClosed: !isCurrentlyClosed,
      closedAt: !isCurrentlyClosed ? nowStr : null,
      closedBy: !isCurrentlyClosed ? (currentUser?.fullName || 'Administrator') : null
    };
    await handleUpdateSession(updated);
  };

  const handleDeleteSession = async (sessionIdentifier: string) => {
    const deletedSet = getDeletedAttendanceIds();
    deletedSet.add(sessionIdentifier);
    localStorage.setItem('pgt_deleted_attendance_ids', JSON.stringify(Array.from(deletedSet)));

    setAttendances(prev => {
      const next = prev.filter(s => s.id !== sessionIdentifier && `sesi-${s.date}` !== sessionIdentifier);
      localStorage.setItem('pgt_attendances', JSON.stringify(next));
      return next;
    });
    triggerToast('Sesi absensi telah dihapus dari sistem & Cloud.');

    // Persist deletion to Cloud Firestore
    try {
      await deleteAttendanceFromCloud(sessionIdentifier);
    } catch (e) {
      console.warn("Gagal hapus sesi dari cloud:", e);
    }
  };

  // DELAYED RECAP & ACTIVE STUDENTS COMPUTATION
  const activeStudents = useMemo(() => {
    const deletedSet = getDeletedStudentIds();
    return students.filter(s => s && s.id && !deletedSet.has(s.id) && s.name.trim() !== '');
  }, [students]);

  const submittedSessions = useMemo(() => {
    return attendances.filter(a => a.isSubmitted !== false);
  }, [attendances]);

  const recapData = useMemo(() => {
    const totalDays = submittedSessions.length || 0;
    
    return activeStudents.map(student => {
      let presentCount = 0;
      let izinCount = 0;
      let sakitCount = 0;
      let alfaCount = 0;
      let notes: string[] = [];

      submittedSessions.forEach(day => {
        const record = day.records.find(r => r.studentId === student.id);
        if (record) {
          if (record.status === 'Hadir') presentCount++;
          else if (record.status === 'Izin') izinCount++;
          else if (record.status === 'Sakit') sakitCount++;
          else if (record.status === 'Alfa') alfaCount++;

          if (record.note && record.note.trim()) {
            notes.push(`(${day.date}: ${record.status} - ${record.note.trim()})`);
          }
        }
      });

      const percentage = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 100;
      return {
        ...student,
        studentId: student.id,
        presentCount,
        hadirCount: presentCount,
        izinCount,
        sakitCount,
        alfaCount,
        percentage,
        notes: notes.join(', ') || 'Tidak ada catatan'
      };
    });
  }, [students, submittedSessions]);

  const sectionLeaderboard = useMemo(() => {
    const stats: Record<string, { totalPercentage: number; count: number; presentTotal: number }> = {
      Brass: { totalPercentage: 0, count: 0, presentTotal: 0 },
      Cologuard: { totalPercentage: 0, count: 0, presentTotal: 0 },
      Battery: { totalPercentage: 0, count: 0, presentTotal: 0 },
      Pit: { totalPercentage: 0, count: 0, presentTotal: 0 }
    };
    recapData.forEach(student => {
      const sec = student.section || 'Brass';
      if (!stats[sec]) {
        stats[sec] = { totalPercentage: 0, count: 0, presentTotal: 0 };
      }
      stats[sec].totalPercentage += student.percentage;
      stats[sec].count += 1;
      stats[sec].presentTotal += student.presentCount;
    });

    return Object.keys(stats).map(section => ({
      section,
      average: stats[section].count > 0 ? Math.round(stats[section].totalPercentage / stats[section].count) : 0,
      members: stats[section].count,
      presentTotal: stats[section].presentTotal
    })).sort((a, b) => b.average - a.average);
  }, [recapData]);

  const exportToExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "No,Nama,Kelas,Asrama,Section,Persentase Kehadiran,Status,Catatan Halangan\n";
    
    recapData.forEach((row, index) => {
      const isWarning = row.percentage < 80 ? "Di Bawah 80%" : "Aman";
      const cleanNote = row.notes.replace(/,/g, ';'); 
      const rowData = `${index + 1},${row.name},${row.kelas},${row.asrama},${row.section},${row.percentage}%,${isWarning},${cleanNote}`;
      csvContent += rowData + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_Absensi_PGT_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Laporan absensi resmi berhasil diunduh (CSV/Excel)!');
  };

  // Member & Student Management Handlers
  const handleRestoreDefaultStudents = () => {
    setIsRestoreModalOpen(true);
  };

  const executeRestoreDefaultStudents = async () => {
    setIsRestoreModalOpen(false);
    // Clear tracked deleted IDs
    localStorage.removeItem('pgt_deleted_student_ids');

    const map = new Map<number, Student>();
    INITIAL_STUDENTS.forEach(s => map.set(s.id, s));
    students.forEach(s => {
      map.set(s.id, { ...map.get(s.id), ...s });
    });
    const restored = Array.from(map.values()).sort((a, b) => a.id - b.id);
    setStudents(restored);
    localStorage.setItem('pgt_students', JSON.stringify(restored));
    triggerToast(`Seluruh 43 pemain resmi PGT Mu'allimin berhasil dipulihkan!`);
    
    try {
      for (const s of INITIAL_STUDENTS) {
        saveStudentToCloud(s).catch(() => {});
      }
    } catch (e) {
      console.warn("Notice restoring database seed:", e);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newStudentName.trim();
    if (!cleanName) {
      triggerToast('Nama pemain tidak boleh kosong!', 'warning');
      return;
    }

    const newId = Date.now();
    const newStudent: Student = {
      id: newId,
      name: cleanName,
      kelas: newStudentKelas.trim() || '1A',
      asrama: newStudentAsrama || 'A',
      section: newStudentSection || 'Brass',
    };

    // Remove from deleted list if somehow matching ID
    const deletedSet = getDeletedStudentIds();
    if (deletedSet.has(newId)) {
      deletedSet.delete(newId);
      localStorage.setItem('pgt_deleted_student_ids', JSON.stringify(Array.from(deletedSet)));
    }

    setStudents(prev => {
      const next = [...prev, newStudent].sort((a, b) => a.id - b.id);
      localStorage.setItem('pgt_students', JSON.stringify(next));
      return next;
    });

    setNewStudentName('');
    setNewStudentKelas('');
    setIsAddMemberModalOpen(false);
    triggerToast(`Pemain "${newStudent.name}" (${newStudent.section}) berhasil ditambahkan ke database!`);

    // Persist to Cloud Firestore
    try {
      await saveStudentToCloud(newStudent);
    } catch (e) {
      console.warn("Gagal simpan anggota ke cloud, data tersimpan di lokal:", e);
    }
  };

  const handleDeleteStudent = (id: number, name: string) => {
    const target = students.find(s => s.id === id) || { 
      id, 
      name, 
      kelas: '', 
      asrama: 'A', 
      section: 'Brass' 
    };
    setStudentToDelete(target);
  };

  const handleConfirmClearAllStudents = async () => {
    const oldStudentIds = students.map(s => s.id);
    const deletedSet = getDeletedStudentIds();
    oldStudentIds.forEach(id => deletedSet.add(id));
    localStorage.setItem('pgt_deleted_student_ids', JSON.stringify(Array.from(deletedSet)));

    setStudents([]);
    localStorage.setItem('pgt_students', JSON.stringify([]));
    setIsClearAllModalOpen(false);
    triggerToast('Seluruh data pemain lama telah dikosongkan. Anda dapat mulai menginput daftar pemain baru.');

    try {
      await replaceAllStudentsInCloud([], oldStudentIds);
    } catch (e) {
      console.warn("Gagal hapus massal pemain di cloud:", e);
    }
  };

  const handleConfirmDeleteStudent = async () => {
    if (!studentToDelete) return;
    const { id, name } = studentToDelete;
    setStudentToDelete(null);

    // 1. Permanently record ID in deleted set so real-time sync never resurrects it
    const deletedSet = getDeletedStudentIds();
    deletedSet.add(id);
    localStorage.setItem('pgt_deleted_student_ids', JSON.stringify(Array.from(deletedSet)));

    // 2. Remove student from active state & local storage
    setStudents(prev => {
      const next = prev.filter(s => s.id !== id);
      localStorage.setItem('pgt_students', JSON.stringify(next));
      return next;
    });

    triggerToast(`Data anggota "${name}" berhasil dihapus.`);

    // 3. Persist deletion to Cloud Firestore
    try {
      await deleteStudentFromCloud(id);
    } catch (e) {
      console.warn("Gagal hapus anggota di cloud:", e);
    }
  };

  // Announcements Handlers
  const handleSaveAnnouncement = async (item: Announcement) => {
    // Unmark ID from deleted set if re-saving/creating
    const deletedSet = getDeletedAnnouncementIds();
    if (deletedSet.has(item.id)) {
      deletedSet.delete(item.id);
      localStorage.setItem('pgt_deleted_announcement_ids', JSON.stringify(Array.from(deletedSet)));
    }

    setAnnouncements(prev => {
      const next = prev.some(a => a.id === item.id)
        ? prev.map(a => a.id === item.id ? item : a)
        : [item, ...prev];
      next.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.createdAt.localeCompare(a.createdAt);
      });
      localStorage.setItem('pgt_announcements', JSON.stringify(next));
      return next;
    });

    try {
      await saveAnnouncementToCloud(item);
    } catch (e) {
      console.warn("Gagal simpan pengumuman ke cloud:", e);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    // 1. Permanently record ID in deleted set so refresh & real-time sync never resurrect it
    const deletedSet = getDeletedAnnouncementIds();
    deletedSet.add(id);
    localStorage.setItem('pgt_deleted_announcement_ids', JSON.stringify(Array.from(deletedSet)));

    // 2. Remove from local state & localStorage
    setAnnouncements(prev => {
      const next = prev.filter(a => a.id !== id);
      localStorage.setItem('pgt_announcements', JSON.stringify(next));
      return next;
    });

    // 3. Delete from Cloud Firestore
    try {
      await deleteAnnouncementFromCloud(id);
    } catch (e) {
      console.warn("Gagal hapus pengumuman di cloud:", e);
    }
  };

  const sections = useMemo(() => {
    const defaultSecs = ['All', 'Brass', 'Cologuard', 'Battery', 'Pit'];
    const customSecs = activeStudents.map(s => s.section).filter(Boolean);
    return Array.from(new Set([...defaultSecs, ...customSecs]));
  }, [activeStudents]);
  
  const filteredStudents = useMemo(() => {
    return activeStudents.filter(s => {
      const matchSection = selectedSection === 'All' || s.section === selectedSection;
      const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.kelas.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.asrama.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSection && matchSearch;
    });
  }, [activeStudents, selectedSection, searchQuery]);
  
  const todayRecords = attendances.find(a => a.date === selectedDate)?.records || [];
  const presentCount = filteredStudents.filter(s => todayRecords.find(r => r.studentId === s.id && r.status === 'Hadir')).length;
  const recordedCount = filteredStudents.filter(s => todayRecords.find(r => r.studentId === s.id && r.status !== '')).length;
  const sickCount = filteredStudents.filter(s => todayRecords.find(r => r.studentId === s.id && r.status === 'Sakit')).length;
  const permitCount = filteredStudents.filter(s => todayRecords.find(r => r.studentId === s.id && r.status === 'Izin')).length;
  const absentCount = filteredStudents.filter(s => todayRecords.find(r => r.studentId === s.id && r.status === 'Alfa')).length;
  const attendanceRateToday = recordedCount > 0 ? Math.round((presentCount / recordedCount) * 100) : 0;

  // Shared Modals rendered across both Petugas and Admin portals
  const renderSharedModals = () => (
    <>
      {/* MODAL: ADD STUDENT */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-3xl p-6 sm:p-7 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus size={20} className="text-purple-400" />
                Tambah Anggota Pemain Baru
              </h3>
              <button 
                type="button"
                onClick={() => setIsAddMemberModalOpen(false)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  Nama Lengkap Pemain
                </label>
                <input 
                  type="text" 
                  required 
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="Contoh: Muhammad Farhan" 
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                    Kelas
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={newStudentKelas}
                    onChange={(e) => setNewStudentKelas(e.target.value)}
                    placeholder="Contoh: 2F, 3B, 4D" 
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                    Asrama
                  </label>
                  <select 
                    value={newStudentAsrama}
                    onChange={(e) => setNewStudentAsrama(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="A">Asrama A</option>
                    <option value="B">Asrama B</option>
                    <option value="C">Asrama C</option>
                    <option value="D">Asrama D</option>
                    <option value="E">Asrama E</option>
                    <option value="F">Asrama F</option>
                    <option value="Luar">Luar Asrama</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  Section Instrumen
                </label>
                <select 
                  value={newStudentSection}
                  onChange={(e) => setNewStudentSection(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Brass">Brass (Terompet/Mellophone/Baritone/Tuba)</option>
                  <option value="Cologuard">Cologuard / CG (Bendera & Rifle)</option>
                  <option value="Battery">Battery (Snare/Tenor/Bass Drum)</option>
                  <option value="Pit">Pit Instrument (Marimba/Xylophone/Glock)</option>
                </select>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button 
                  type="button" 
                  onClick={() => setIsAddMemberModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Simpan Anggota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT MEMBER DATA */}
      <EditMemberModal
        isOpen={isEditMemberModalOpen}
        student={editingStudent}
        onClose={() => {
          setIsEditMemberModalOpen(false);
          setEditingStudent(null);
        }}
        onSave={handleSaveEditedStudent}
      />

      {/* MODAL: SCHEDULE PRACTICE SESSION */}
      <ScheduleSessionModal
        isOpen={isScheduleModalOpen}
        editingSession={editingScheduleSession}
        students={activeStudents}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setEditingScheduleSession(null);
        }}
        onSaveSchedule={handleSaveSchedule}
        onSaveBatchSchedule={handleSaveBatchSchedule}
        onDeleteSchedule={handleDeleteSchedule}
        triggerToast={triggerToast}
      />

      {/* MODAL: CONFIRM SUBMIT ATTENDANCE SESSION */}
      <ConfirmModal
        isOpen={isSubmitConfirmOpen}
        title="Konfirmasi Finalisasi & Submit Presensi Resmi"
        message={`Apakah Anda yakin ingin memfinalisasi data presensi untuk tanggal ${selectedDate} (${currentSessionName})?`}
        details={[
          `Tanggal Pelaksanaan: ${selectedDate}`,
          `Nama Sesi: ${currentSessionName}`,
          `Disubmit Oleh: ${currentUser?.fullName || 'Petugas Lapangan'} (${currentUser?.role === 'admin' ? 'Administrator' : 'Petugas Lapangan'})`,
          `Data Hadir: ${currentSession?.records.filter(r => r.status === 'Hadir').length || 0} pemain`,
          `Total Terabsen: ${currentSession?.records.length || 0} dari ${students.length} anggota marching band`,
          'Sesi ini akan langsung direkapitulasi ke laporan kehadiran & leaderboard persentase disiplin.',
          'Data yang telah disubmit tetap dapat dikoreksi atau ditarik kembali sewaktu-waktu oleh Petugas maupun Admin.'
        ]}
        confirmText="🚀 Ya, Submit & Finalisasi Presensi"
        cancelText="Batal (Tetap Simpan sebagai Draf)"
        onConfirm={handleFinalizeSubmit}
        onCancel={() => setIsSubmitConfirmOpen(false)}
      />

      {/* MODAL: CONFIRM DELETE MEMBER / STUDENT */}
      <ConfirmModal
        isOpen={Boolean(studentToDelete)}
        title="Konfirmasi Hapus Data Pemain"
        message={`Apakah Anda yakin ingin menghapus "${studentToDelete?.name}" dari daftar pemain marching band?`}
        details={[
          `Nama Pemain: ${studentToDelete?.name}`,
          `Section Instrumen: ${studentToDelete?.section}`,
          `Kelas: ${studentToDelete?.kelas} · Asrama: ${studentToDelete?.asrama}`,
          'Pemain ini akan dihapus dari daftar master dan sesi presensi berikutnya.',
          'Catatan: 43 pemain resmi bawaan dapat dipulihkan sewaktu-waktu melalui tombol "Pulihkan 43 Anggota".'
        ]}
        confirmText="Ya, Hapus Pemain"
        cancelText="Batal"
        isDanger={true}
        onConfirm={handleConfirmDeleteStudent}
        onCancel={() => setStudentToDelete(null)}
      />

      {/* MODAL: CONFIRM RESTORE 43 DEFAULT STUDENTS */}
      <ConfirmModal
        isOpen={isRestoreModalOpen}
        title="Pulihkan Seluruh 43 Anggota Bawaan"
        message="Apakah Anda yakin ingin memulihkan seluruh 43 anggota bawaan resmi PGT Mu'allimin?"
        details={[
          'Daftar lengkap 43 pemain resmi (Brass, Cologuard, Battery, Pit) akan dipulihkan utuh ke master data.',
          'Pemain baru yang Anda tambahkan sendiri tetap aman dan tidak akan terhapus.',
          'Riwayat sesi presensi dan catatan kehadiran yang telah tersimpan tetap rapi.'
        ]}
        confirmText="Ya, Pulihkan Sekarang"
        cancelText="Batal"
        onConfirm={executeRestoreDefaultStudents}
        onCancel={() => setIsRestoreModalOpen(false)}
      />

      {/* MODAL: CONFIRM CLEAR ALL STUDENTS */}
      <ConfirmModal
        isOpen={isClearAllModalOpen}
        title="Kosongkan Seluruh Data Pemain Lama"
        message="Apakah Anda yakin ingin mengosongkan seluruh daftar pemain lama saat ini?"
        details={[
          'Semua baris pemain lama akan dihapus dari daftar master agar Anda dapat menginput daftar pemain baru dari awal.',
          'Sistem tidak mematok pemain lama; Anda bebas mengunggah atau menginput ulang sesuai kebutuhan.',
          'Jika diperlukan di kemudian hari, 43 pemain resmi dapat dipulihkan kembali kapan saja.'
        ]}
        confirmText="Ya, Kosongkan Pemain Lama"
        cancelText="Batal"
        isDanger={true}
        onConfirm={handleConfirmClearAllStudents}
        onCancel={() => setIsClearAllModalOpen(false)}
      />

      {/* MODAL: CONFIRM DELETE SYSTEM USER */}
      <ConfirmModal
        isOpen={!!userToDelete}
        title="Hapus Akun Pengguna / Petugas"
        message={`Apakah Anda yakin ingin menghapus akun "${userToDelete?.fullName || userToDelete?.username}"?`}
        details={[
          `Username: ${userToDelete?.username}`,
          `Peran: ${userToDelete?.role === 'admin' ? 'Administrator' : 'Petugas Lapangan'}`,
          'Akun ini tidak akan bisa digunakan untuk login lagi setelah dihapus.'
        ]}
        confirmText="Ya, Hapus Akun"
        cancelText="Batal"
        isDanger={true}
        onConfirm={handleConfirmDeleteUser}
        onCancel={() => setUserToDelete(null)}
      />

      {/* MODAL: PAPER ATTENDANCE SHEET (INPUT MASSAL SESUAI KERTAS) */}
      <PaperAttendanceSheetModal
        isOpen={isPaperSheetModalOpen}
        students={activeStudents}
        onClose={() => setIsPaperSheetModalOpen(false)}
        onSaveAll={handleSaveAllPaperSheet}
        onRestoreDefaults={handleRestoreDefaultStudents}
        triggerToast={triggerToast}
      />

      {/* MODAL: CLOUD DATABASE SYNC STATUS & BACKUP */}
      {showSyncInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-emerald-950 border border-emerald-800/60 text-emerald-400">
                  <Database size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Status Cloud Database</h3>
                  <p className="text-xs text-slate-400">Penyimpanan Terpusat Firebase Firestore</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowSyncInfoModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Firebase Project:</span>
                  <code className="text-purple-300 font-bold font-mono">{firebaseConfig.projectId}</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Status Penyimpanan:</span>
                  <span className={`inline-flex items-center gap-1.5 font-semibold ${
                    syncStatus === 'connected' ? 'text-emerald-400' : 'text-sky-400'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${syncStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-sky-400'}`}></span>
                    {syncStatus === 'connected' ? 'Cloud Terhubung Real-Time' : 'Penyimpanan Lokal Aktif (0 Delay & Aman)'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Keamanan Data:</span>
                  <span className="text-emerald-400 font-medium">100% Tersimpan di Perangkat Ini</span>
                </div>
              </div>

              {syncStatus !== 'connected' && (
                <div className="p-3 bg-sky-950/40 border border-sky-800/50 rounded-2xl space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
                  <div className="font-bold text-sky-300 flex items-center gap-1.5">
                    <span>💡 Mengapa status Cloud belum aktif?</span>
                  </div>
                  <p>
                    Database Cloud Firestore di proyek Firebase <code className="text-amber-300 font-mono">absen-7862e</code> belum di-create di Firebase Console. 
                    Aplikasi saat ini berjalan <strong>sangat cepat & lancar secara lokal</strong> tanpa perlu menunggu cloud.
                  </p>
                  <p className="text-slate-400">
                    Untuk menyambungkan cloud agar sinkron otomatis antar HP/komputer:
                    <br />1. Buka <strong>console.firebase.google.com</strong> &rarr; pilih <strong>{firebaseConfig.projectId}</strong>
                    <br />2. Masuk ke <strong>Firestore Database</strong> &rarr; klik <strong>Create database</strong> (Pilih Start in test mode).
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <div className="text-lg font-black text-white">{students.length}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Pemain</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <div className="text-lg font-black text-white">{attendances.length}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Sesi Absensi</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <div className="text-lg font-black text-white">{systemUsers.length}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Akun Tim</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <div className="text-lg font-black text-white">{announcements.length}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Pengumuman</div>
                </div>
              </div>

              <p className="text-slate-400 text-[11px] leading-relaxed">
                Setiap data yang Anda simpan langsung tersimpan permanen di perangkat ini dan tidak akan hilang saat halaman ditutup atau di-refresh.
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                disabled={isManualSyncing}
                onClick={async () => {
                  setIsManualSyncing(true);
                  try {
                    const res = await uploadAllLocalDataToCloud(students, attendances, systemUsers, announcements);
                    triggerToast(res.message);
                    if (res.success) {
                      setShowSyncInfoModal(false);
                    }
                  } catch (e: any) {
                    triggerToast(e?.message || 'Gagal sinkronkan ke cloud.');
                  } finally {
                    setIsManualSyncing(false);
                  }
                }}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all cursor-pointer"
              >
                <UploadCloud size={16} className={isManualSyncing ? 'animate-bounce' : ''} />
                <span>{isManualSyncing ? 'Menyinkronkan ke Cloud...' : 'Simpan & Cadangkan Semua Data Sekarang'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSyncInfoModal(false)}
                className="w-full py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: ADD / EDIT USER (ADMIN ONLY) */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-3xl p-6 sm:p-7 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus size={20} className="text-amber-400" />
                {editingUserId ? 'Edit Akun Pengguna' : 'Daftarkan Akun User / Petugas Baru'}
              </h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  Nama Lengkap Petugas
                </label>
                <input 
                  type="text" 
                  required 
                  value={userFormFullName}
                  onChange={(e) => setUserFormFullName(e.target.value)}
                  placeholder="Contoh: Ust. Farhan (Pelatih Battery)" 
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                    Username
                  </label>
                  <input 
                    type="text" 
                    required 
                    value={userFormUsername}
                    onChange={(e) => setUserFormUsername(e.target.value)}
                    placeholder="misal: petugas_battery" 
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <input 
                      type={showUserFormPass ? "text" : "password"} 
                      required 
                      value={userFormPassword}
                      onChange={(e) => setUserFormPassword(e.target.value)}
                      placeholder="••••••••" 
                      className="w-full px-3.5 py-2.5 pr-8 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowUserFormPass(!showUserFormPass)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      {showUserFormPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  Hak Akses / Peran Akun
                </label>
                <select 
                  value={userFormRole}
                  onChange={(e) => setUserFormRole(e.target.value as 'admin' | 'petugas')}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="petugas">Petugas Lapangan (Hanya Buka Presensi)</option>
                  <option value="admin">Administrator (Akses Penuh Master)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  Penugasan Section
                </label>
                <select 
                  value={userFormSection}
                  onChange={(e) => setUserFormSection(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="All">Semua Section (Bebas Memilih)</option>
                  <option value="Brass">Khusus Section Brass</option>
                  <option value="Cologuard">Khusus Section Cologuard</option>
                  <option value="Battery">Khusus Section Battery</option>
                  <option value="Pit">Khusus Section Pit</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Petugas akan otomatis difokuskan ke section yang dipilih saat login.
                </p>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button 
                  type="button" 
                  onClick={() => setIsUserModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white text-xs font-bold transition-all shadow-md"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHANGE MASTER ADMIN PASSWORD (RAHASIA ADMIN) */}
      {isAdminPassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-3xl p-6 sm:p-7 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Key size={20} className="text-amber-400" />
                Ubah Password Rahasia Administrator
              </h3>
              <button onClick={() => setIsAdminPassModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Atur kata sandi rahasia yang hanya Anda yang tahu. Password ini akan disimpan aman dan menggantikan password sebelumnya.
            </p>

            <form onSubmit={handleChangeAdminPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  Kata Sandi Baru
                </label>
                <input 
                  type="password" 
                  required 
                  value={newAdminPass}
                  onChange={(e) => setNewAdminPass(e.target.value)}
                  placeholder="Masukkan kata sandi baru Anda" 
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  Ulangi Kata Sandi Baru
                </label>
                <input 
                  type="password" 
                  required 
                  value={confirmAdminPass}
                  onChange={(e) => setConfirmAdminPass(e.target.value)}
                  placeholder="Ketik ulang kata sandi baru" 
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
              </div>

              <div className="flex gap-2.5 pt-3">
                <button 
                  type="button" 
                  onClick={() => setIsAdminPassModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-bold transition-all shadow-md"
                >
                  Simpan Password Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );

  // --- UNIFIED PORTAL COMPONENTS ---
  const menuItems = useMemo(() => {
    return [
      { id: 'home', label: 'Beranda Utama', icon: Home },
      { id: 'attendance', label: 'Input Presensi', icon: ClipboardList },
      { id: 'sessions', label: 'Jadwal & Sesi Latihan', icon: Calendar, badge: attendances.length },
      { id: 'announcements', label: 'Papan Pengumuman', icon: Megaphone, badge: announcements.length },
      { id: 'recap', label: 'Rekap & Leaderboard', icon: BarChart3 },
      { id: 'members', label: 'Database Pemain', icon: Users, badge: students.length },
      { id: 'edit_absensi', label: 'Monitoring Riwayat Sesi', icon: Edit3 },
      { id: 'google_sheets', label: 'Google Sheets Sync', icon: FileSpreadsheet },
      { id: 'manage_users', label: 'Kelola & Kontak Petugas', icon: UserCheck, badge: systemUsers.length },
      { id: 'my_history', label: 'Ringkasan & Log Saya', icon: Clock },
    ];
  }, [announcements.length, students.length, attendances.length, systemUsers.length]);

  const SidebarItem = ({ item }: { item: any }) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    
    return (
      <button 
        onClick={() => { changeTab(item.id as AppTab); setIsMobileMenuOpen(false); }}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
          isActive 
            ? 'bg-gradient-to-r from-purple-800/90 to-purple-900 text-white font-bold border border-purple-600/40 shadow-md' 
            : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon size={18} className={isActive ? 'text-amber-400' : 'text-purple-400'} />
          <span>{item.label}</span>
        </div>
        {item.badge !== undefined && item.badge > 0 && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-slate-400'} tabular-nums`}>
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  const Sidebar = () => (
    <aside className="hidden md:flex flex-col w-72 bg-slate-900/95 border-r border-slate-800 text-slate-200 flex-shrink-0 z-20 sticky top-0 h-screen shadow-2xl">
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-purple-500/40 bg-black p-1 shadow-lg flex items-center justify-center shrink-0">
          <img src={OFFICIAL_LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-white leading-tight">PGT MU'ALLIMIN</h2>
          <div className="mt-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${currentUser?.role === 'admin' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-purple-500/20 text-purple-300 border-purple-500/30'}`}>
              {currentUser?.role === 'admin' ? 'SUPER ADMINISTRATOR' : 'PORTAL PETUGAS'}
            </span>
          </div>
        </div>
      </div>

      <div className="px-3 pt-3 space-y-2">
        <button
          type="button"
          onClick={() => setIsAdminPassModalOpen(true)}
          className="w-full py-2 px-3 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/50 text-xs text-amber-300 flex items-center justify-between font-semibold transition-all cursor-pointer"
        >
          <span className="flex items-center gap-2"><Key size={14} className="text-amber-400" /> Kata Sandi Akun</span>
          <span className="text-[10px] text-purple-300 font-mono">Ubah</span>
        </button>
        <button
          type="button"
          onClick={() => setShowSyncInfoModal(true)}
          className="w-full py-2 px-3 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 flex items-center justify-between font-semibold transition-all cursor-pointer"
        >
          <span className="flex items-center gap-2 truncate"><Cloud size={14} className={syncStatus === 'connected' ? 'text-emerald-400' : 'text-sky-400'} /> <span className="truncate">Data: {firebaseConfig.projectId}</span></span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${syncStatus === 'connected' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40' : 'bg-sky-950 text-sky-300 border border-sky-800/40'}`}>{syncStatus === 'connected' ? 'Cloud' : 'Lokal'}</span>
        </button>
      </div>

      <nav className="flex-1 mt-3 px-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Menu Navigasi</div>
        {menuItems.map(item => <SidebarItem key={item.id} item={item} />)}
      </nav>

      <div className="p-4 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center justify-between mb-3 px-1 text-[11px] text-slate-400">
          <span className="truncate">User: <strong className={currentUser?.role === 'admin' ? 'text-amber-300' : 'text-purple-300'}>{currentUser?.fullName}</strong></span>
          {currentUser?.assignedSection !== 'All' && <span className="text-amber-400 font-bold ml-1">{currentUser?.assignedSection}</span>}
        </div>
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs text-red-300 bg-red-950/30 hover:bg-red-900/50 rounded-xl border border-red-800/40 transition-colors font-semibold cursor-pointer"><LogOut size={15} /> Keluar Sistem</button>
      </div>
    </aside>
  );

  const MobileTopBar = () => {
    const currentTabItem = menuItems.find(m => m.id === activeTab);
    return (
      <div className="md:hidden bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white p-3.5 flex justify-between items-center shadow-xl sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-purple-500/40 bg-black flex items-center justify-center shrink-0 shadow-md">
            <img src={OFFICIAL_LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="font-extrabold text-sm text-white leading-tight uppercase">PGT MU'ALLIMIN</div>
            <div className="text-[11px] text-amber-400 font-semibold flex items-center gap-1.5">
              <span className="text-purple-300 capitalize">{currentTabItem?.label || activeTab}</span>
              <span className="text-slate-500">·</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase border bg-purple-950/80 text-purple-300 border-purple-700/50">
                {currentUser?.role === 'admin' ? 'Admin' : 'Petugas'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeTab !== 'home' && (
            <button type="button" onClick={handleGoBack} className="px-2.5 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/50 text-xs font-bold text-amber-300 flex items-center gap-1 transition-all shadow cursor-pointer">
              <ArrowLeft size={14} className="text-amber-400" /> <span>Kembali</span>
            </button>
          )}
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="px-3.5 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl shadow-lg border border-purple-400/40 flex items-center gap-1.5 font-bold text-xs active:scale-95 transition-all cursor-pointer">
            {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />} <span>Menu</span>
          </button>
        </div>
      </div>
    );
  };

  const MobileBottomBar = () => {
    const bottomNavItems = [
      { id: 'home', label: 'Beranda', icon: Home },
      { id: 'attendance', label: 'Presensi', icon: ClipboardList },
      { id: 'sessions', label: 'Jadwal', icon: Calendar },
      { id: 'announcements', label: 'Info', icon: Megaphone, badge: announcements.length },
    ];

    return (
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5 shadow-2xl flex items-center justify-around">
        {bottomNavItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { changeTab(item.id as AppTab); setIsMobileMenuOpen(false); }}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all relative cursor-pointer ${
                isActive ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon size={18} className={isActive ? 'text-amber-400 scale-110' : 'text-slate-400'} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 leading-none">{item.label}</span>
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1"></span>}
            </button>
          );
        })}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer text-slate-400 hover:text-slate-200 ${
            isMobileMenuOpen ? 'text-purple-300 font-bold' : ''
          }`}
        >
          <Menu size={18} className="text-purple-400" />
          <span className="text-[10px] mt-1 leading-none">Menu</span>
        </button>
      </div>
    );
  };

  const AttendanceView = () => {
    const isUserAdmin = currentUser?.role === 'admin';
    const currentAttendanceSession = attendances.find(a => a.date === selectedDate);
    const isSessionClosed = Boolean(currentAttendanceSession?.isClosed);
    const sessionCountdown = calculateSessionCountdown(selectedDate, currentAttendanceSession?.scheduledTime);
    const isAttendanceReadOnly = !isUserAdmin && (isSessionClosed || sessionCountdown.isUpcoming);

    const selectableSessions = sortSessionsByClosest(
      isUserAdmin 
        ? attendances 
        : attendances.filter(a => !a.isClosed && (a.date >= new Date().toISOString().split('T')[0] || a.isSubmitted === false))
    );

    return (
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white">Presensi Anggota Latihan</h2>
                {isSessionClosed ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold flex items-center gap-1">
                    <Lock size={10} className="text-amber-400" /> Terkunci
                  </span>
                ) : sessionCountdown.isUpcoming ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1">
                    <Timer size={10} /> Menunggu Mulai
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {isAttendanceReadOnly
                  ? isSessionClosed
                    ? 'Sesi ini telah ditutup & terkunci. Hanya Administrator yang dapat mengubah data.'
                    : `Sesi belum dimulai (Countdown: ${sessionCountdown.formatted}). Presensi dibuka saat sesi dimulai.`
                  : 'Tentukan status kehadiran pemain dan simpan perubahan secara otomatis ke cloud.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {selectableSessions.length > 0 && (
                <div className="flex items-center bg-slate-950 border border-purple-800/80 rounded-xl px-3 py-2 text-xs">
                  <Calendar size={14} className="text-amber-400 mr-2 shrink-0" />
                  <select 
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      const matched = attendances.find(a => a.date === e.target.value);
                      if (matched?.sessionName) setCurrentSessionName(matched.sessionName);
                    }}
                    className="bg-transparent text-amber-300 font-bold focus:outline-none cursor-pointer max-w-[150px] sm:max-w-[200px] truncate"
                  >
                    <option value={selectedDate} className="bg-slate-900 text-white">📅 {selectedDate} ({currentAttendanceSession?.sessionName || 'Latihan Rutin'})</option>
                    {selectableSessions.filter(a => a.date !== selectedDate).map(a => (
                      <option key={a.date} value={a.date} className="bg-slate-900 text-white">📅 {a.date} - {a.sessionName || 'Latihan Rutin'}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs">
                <span className="text-slate-400 mr-2 font-medium">Tanggal:</span>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer" />
              </div>

              <select 
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                disabled={currentUser?.assignedSection !== 'All'}
                className="bg-slate-950 text-white border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none cursor-pointer disabled:opacity-50"
              >
                {sections.map(sec => <option key={sec} value={sec}>{sec === 'All' ? 'Semua Section' : `Sec: ${sec}`}</option>)}
              </select>

              <button 
                type="button" disabled={isAttendanceReadOnly}
                onClick={() => !isAttendanceReadOnly && setIsPaperSheetModalOpen(true)}
                className={`px-3.5 py-2 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all ${isAttendanceReadOnly ? 'bg-slate-800 text-slate-500 opacity-60 border border-slate-700' : 'bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-700 hover:to-indigo-700 text-white active:scale-95 cursor-pointer'}`}
              >
                <ClipboardList size={14} className={isAttendanceReadOnly ? "text-slate-500" : "text-amber-400"} /> <span>Presensi Kertas</span>
              </button>

              <button 
                type="button" disabled={isAttendanceReadOnly}
                onClick={() => !isAttendanceReadOnly && handleMarkAllPresent()}
                className={`px-4 py-2 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all ${isAttendanceReadOnly ? 'bg-slate-800 text-slate-500 opacity-60 border border-slate-700' : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95 cursor-pointer'}`}
              >
                <CheckSquare size={15} /> <span>Hadir Semua</span>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800">
            <div className="relative max-w-md">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="text" placeholder="Cari nama pemain atau kelas..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500" />
            </div>
          </div>
        </div>

        <OfficerSubmissionGuide
          sessionName={currentSessionName || 'Latihan Rutin'}
          selectedDate={selectedDate}
          isSubmitted={Boolean(currentAttendanceSession?.isSubmitted)}
          isClosed={Boolean(currentAttendanceSession?.isClosed)}
          isExpired={selectedDate < new Date().toISOString().split('T')[0] && !currentAttendanceSession?.isClosed}
          isAdmin={isUserAdmin}
          scheduledTime={currentAttendanceSession?.scheduledTime}
          location={currentAttendanceSession?.location}
          targetSection={currentAttendanceSession?.targetSection}
          recordedCount={recordedCount}
          totalStudents={filteredStudents.length}
          presentCount={presentCount}
          officerName={currentUser?.fullName || ''}
          assignedSection={currentUser?.assignedSection || 'All'}
          onOpenSubmitModal={() => setIsSubmitConfirmOpen(true)}
          onToggleCloseSession={handleToggleCloseCurrentSession}
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Total Anggota</div>
            <div className="text-xl font-black text-white mt-0.5 tabular-nums">{filteredStudents.length}</div>
          </div>
          <div className="bg-emerald-950/30 border border-emerald-800/40 p-3.5 rounded-2xl">
            <div className="text-[11px] text-emerald-400 uppercase font-semibold">Hadir</div>
            <div className="text-xl font-black text-emerald-300 mt-0.5 tabular-nums">{presentCount}</div>
          </div>
          <div className="bg-amber-950/30 border border-amber-800/40 p-3.5 rounded-2xl">
            <div className="text-[11px] text-amber-400 uppercase font-semibold">Izin & Sakit</div>
            <div className="text-xl font-black text-amber-300 mt-0.5 tabular-nums">{sickCount + permitCount}</div>
          </div>
          <div className="bg-rose-950/30 border border-rose-800/40 p-3.5 rounded-2xl">
            <div className="text-[11px] text-rose-400 uppercase font-semibold">Alfa</div>
            <div className="text-xl font-black text-rose-300 mt-0.5 tabular-nums">{absentCount}</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-5 w-12 text-center">No</th>
                  <th className="py-3 px-5">Nama Anggota</th>
                  <th className="py-3 px-5 text-center">Status</th>
                  <th className="py-3 px-5 hidden sm:table-cell">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {filteredStudents.map((student, idx) => {
                  const record = getCurrentRecord(student.id);
                  return (
                    <tr key={student.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-5 text-center text-xs text-slate-500 tabular-nums">{idx + 1}</td>
                      <td className="py-3 px-5">
                        <div className="font-bold text-slate-100">{student.name}</div>
                        <div className="text-[10px] text-slate-400 uppercase">{student.section} · Kls {student.kelas}</div>
                      </td>
                      <td className="py-3 px-5 text-center">
                        <div className="inline-flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800 gap-1">
                          {['Hadir', 'Sakit', 'Izin', 'Alfa'].map(st => {
                            const active = record.status === st;
                            return (
                              <button
                                key={st} disabled={isAttendanceReadOnly}
                                onClick={() => !isAttendanceReadOnly && handleSaveAttendance(student.id, active ? '' : st, record.note)}
                                className={`px-2.5 py-1.5 text-[10px] font-bold rounded-lg transition-all ${active ? (st === 'Hadir' ? 'bg-emerald-600 text-white' : st === 'Alfa' ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white') : 'text-slate-500 hover:text-slate-300'} ${isAttendanceReadOnly ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                              >
                                {st[0]}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-5 hidden sm:table-cell">
                        <input type="text" placeholder="..." value={record.note} onChange={(e) => handleSaveAttendance(student.id, record.status, e.target.value)} disabled={isAttendanceReadOnly} className="w-full text-xs px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    if (!currentUser) return null;

    switch (activeTab) {
      case 'home':
        return (
          <HomeDashboardTab
            currentUser={currentUser}
            students={students}
            attendances={attendances}
            announcements={announcements}
            selectedDate={selectedDate}
            currentSessionName={currentSessionName}
            onNavigateTab={(tab) => changeTab(tab as AppTab)}
            onSelectAnnouncement={() => changeTab('announcements')}
            onOpenAddMember={() => setIsAddMemberModalOpen(true)}
            onOpenAddAnnouncement={() => changeTab('announcements')}
            onOpenScheduleModal={(session) => {
              setEditingScheduleSession(session || null);
              setIsScheduleModalOpen(true);
            }}
            onSelectDate={(date) => {
              setSelectedDate(date);
              changeTab('attendance', date);
            }}
            triggerToast={triggerToast}
          />
        );

      case 'attendance':
        return <AttendanceView />;

      case 'admin_dashboard':
        return currentUser.role === 'admin' ? <AttendanceView /> : <AttendanceView />; // Reusing AttendanceView but can be tailored

      case 'announcements':
        return (
          <AnnouncementsTab
            announcements={announcements}
            currentUser={currentUser}
            onSaveAnnouncement={handleSaveAnnouncement}
            onDeleteAnnouncement={handleDeleteAnnouncement}
            triggerToast={triggerToast}
          />
        );

      case 'sessions':
      case 'edit_absensi':
        return (
          <AttendanceSessionsTab
            sessions={attendances}
            students={activeStudents}
            currentUserName={currentUser.fullName}
            isAdmin={currentUser.role === 'admin'}
            onUpdateSession={handleUpdateSession}
            onDeleteSession={handleDeleteSession}
            onSubmitSession={(sessionId) => {
              const sess = attendances.find(s => s.id === sessionId || `sesi-${s.date}` === sessionId);
              if (sess) {
                setSelectedDate(sess.date);
                setCurrentSessionName(sess.sessionName || 'Latihan Rutin');
                setIsSubmitConfirmOpen(true);
              }
            }}
            onSelectSessionDate={(dateStr) => {
              setSelectedDate(dateStr);
              const matched = attendances.find(a => a.date === dateStr);
              if (matched?.sessionName) setCurrentSessionName(matched.sessionName);
              changeTab('attendance');
              triggerToast(`Sesi presensi tanggal ${dateStr} dibuka.`, 'info');
            }}
            triggerToast={triggerToast}
          />
        );

      case 'recap':
        return (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-bold mb-2">
                    <Trophy size={14} className="text-amber-400" /> Leaderboard Section
                  </div>
                  <h2 className="text-xl font-extrabold text-white">Peringkat & Rekapitulasi</h2>
                  <p className="text-xs text-slate-400 mt-1">Dihitung dari {submittedSessions.length} sesi resmi.</p>
                </div>
                <div className="flex items-center gap-2">
                   <button onClick={exportToExcel} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg cursor-pointer"><Download size={15} /> <span>Export CSV</span></button>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                {sectionLeaderboard.map((board, index) => (
                  <div key={board.section} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex justify-between items-center"><span className="text-[10px] text-slate-400 font-bold">#{index + 1} {board.section}</span></div>
                    <div className="text-xl font-black text-amber-300">{board.average}%</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Inline Table for Recap */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
               <div className="flex justify-between items-center">
                  <h3 className="text-base font-bold text-white">Rekap Individual</h3>
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {sections.map(sec => (
                      <button key={sec} onClick={() => setSelectedSection(sec)} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${selectedSection === sec ? 'bg-purple-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'}`}>{sec}</button>
                    ))}
                  </div>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold uppercase text-slate-400">
                        <th className="py-3 px-4">Nama</th>
                        <th className="py-3 px-3 text-center">H</th>
                        <th className="py-3 px-3 text-center">S</th>
                        <th className="py-3 px-3 text-center">I</th>
                        <th className="py-3 px-3 text-center">A</th>
                        <th className="py-3 px-4 text-center">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs">
                      {recapData.filter(s => selectedSection === 'All' || s.section === selectedSection).map((student) => (
                        <tr key={student.id} className="hover:bg-slate-800/40">
                          <td className="py-3 px-4 font-bold text-slate-100">{student.name}</td>
                          <td className="py-3 px-3 text-center text-emerald-400">{student.hadirCount}</td>
                          <td className="py-3 px-3 text-center text-amber-400">{student.sakitCount}</td>
                          <td className="py-3 px-3 text-center text-sky-400">{student.izinCount}</td>
                          <td className="py-3 px-3 text-center text-rose-400">{student.alfaCount}</td>
                          <td className="py-3 px-4 text-center font-black text-white">{student.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
          </div>
        );

      case 'members':
        return (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-extrabold text-white">Database Pemain ({students.length})</h2>
              {currentUser.role === 'admin' && (
                <button onClick={() => setIsAddMemberModalOpen(true)} className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"><UserPlus size={15} /> <span>Tambah</span></button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredStudents.map(s => (
                <div key={s.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex justify-between">
                    <div className="font-bold text-white text-sm">{s.name}</div>
                    <span className="text-[10px] font-bold text-purple-400">{s.section}</span>
                  </div>
                  <div className="text-xs text-slate-400">Kelas {s.kelas} · Asrama {s.asrama}</div>
                  {currentUser.role === 'admin' && (
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => { setEditingStudent(s); setIsEditMemberModalOpen(true); }} className="flex-1 py-1 bg-purple-900/30 text-purple-300 rounded-lg text-[10px] font-bold">Edit</button>
                      <button onClick={() => handleDeleteStudent(s.id, s.name)} className="px-2 py-1 bg-rose-950/30 text-rose-400 rounded-lg"><Trash2 size={12} /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'google_sheets':
        return (
          <GoogleSheetsTab 
            students={students} 
            attendances={attendances} 
            recapList={recapData} 
            triggerToast={triggerToast} 
          />
        );

      case 'manage_users':
        return (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-purple-900/40 text-purple-300 border border-purple-700/40 text-[11px] font-semibold mb-1">
                  <UserCheck size={12} className="text-amber-400" /> Tim & Pengurus Korps
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">Kelola & Kontak Petugas ({systemUsers.length})</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Daftar akun pengurus, pelatih, dan petugas absensi marching band PGT Mu'allimin.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {currentUser.role === 'admin' ? (
                  <button 
                    onClick={() => { 
                      setEditingUserId(null); 
                      setUserFormUsername(''); 
                      setUserFormPassword(''); 
                      setUserFormFullName(''); 
                      setUserFormRole('petugas'); 
                      setUserFormSection('All'); 
                      setIsUserModalOpen(true); 
                    }} 
                    className="px-4 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <UserPlus size={14} /> <span>+ Tambah Akun Petugas</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsAdminPassModalOpen(true)}
                    className="px-3.5 py-2 bg-purple-950/80 hover:bg-purple-900 border border-purple-700/60 text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <Key size={13} className="text-amber-400" /> <span>Ubah Password Akun</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {systemUsers.map(u => {
                const isCurrent = u.id === currentUser.id;
                return (
                  <div key={u.id} className={`p-4 bg-slate-950 border rounded-2xl flex justify-between items-center transition-all ${isCurrent ? 'border-purple-600/60 ring-1 ring-purple-600/30' : 'border-slate-800'}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-purple-900/40 border border-purple-700/40 flex items-center justify-center text-purple-300 font-bold shrink-0">
                        {u.fullName[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm truncate">{u.fullName}</span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800 shrink-0">Anda</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 truncate">
                          <span className="font-mono text-purple-300">@{u.username}</span>
                          <span>·</span>
                          <span className="capitalize">{u.role === 'admin' ? 'Super Admin' : 'Petugas Sesi'}</span>
                          {u.assignedSection && u.assignedSection !== 'All' && (
                            <>
                              <span>·</span>
                              <span className="text-amber-400 font-semibold">{u.assignedSection}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {currentUser.role === 'admin' ? (
                        <>
                          <button 
                            onClick={() => { 
                              setEditingUserId(u.id); 
                              setUserFormUsername(u.username); 
                              setUserFormPassword(u.password); 
                              setUserFormFullName(u.fullName); 
                              setUserFormRole(u.role); 
                              setUserFormSection(u.assignedSection); 
                              setIsUserModalOpen(true); 
                            }} 
                            className="p-2 text-purple-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                            title="Edit Akun"
                          >
                            <Edit3 size={15} />
                          </button>
                          {systemUsers.length > 1 && (
                            <button 
                              onClick={() => handleDeleteUser(u.id, u.fullName)} 
                              className="p-2 text-rose-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Akun"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </>
                      ) : isCurrent ? (
                        <button
                          onClick={() => setIsAdminPassModalOpen(true)}
                          className="px-2.5 py-1 text-[11px] bg-slate-900 hover:bg-purple-900/40 text-purple-300 border border-purple-800/40 rounded-lg font-semibold cursor-pointer"
                        >
                          Ubah Sandi
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'my_history':
        return (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-purple-950/80 border-2 border-purple-500/50 flex items-center justify-center text-xl font-black text-amber-300 shadow-lg shrink-0">
                    {currentUser.fullName[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-purple-900/40 text-purple-300 border border-purple-700/40 text-[11px] font-semibold mb-1">
                      <Clock size={12} className="text-amber-400" /> Ringkasan Aktivitas Saya
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white">{currentUser.fullName}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Username: <strong className="text-purple-300 font-mono">@{currentUser.username}</strong> · Hak Akses: <strong className="text-amber-400 uppercase">{currentUser.role === 'admin' ? 'Super Administrator' : 'Petugas Sesi'}</strong> {currentUser.assignedSection !== 'All' ? `· Section: ${currentUser.assignedSection}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => changeTab('attendance')}
                    className="px-4 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <ClipboardList size={14} /> <span>Input Presensi</span>
                  </button>
                  <button
                    onClick={() => setIsAdminPassModalOpen(true)}
                    className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Key size={14} className="text-amber-400" /> <span>Ganti Password</span>
                  </button>
                </div>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <div className="text-[11px] text-slate-400 font-medium">Tingkat Hadir Hari Ini</div>
                  <div className="text-2xl font-black text-emerald-400">{attendanceRateToday}%</div>
                  <div className="text-[10px] text-slate-500">Persentase sesi hari ini</div>
                </div>
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <div className="text-[11px] text-slate-400 font-medium">Total Sesi Terjadwal</div>
                  <div className="text-2xl font-black text-purple-400">{attendances.length}</div>
                  <div className="text-[10px] text-slate-500">Sesi terdaftar di sistem</div>
                </div>
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <div className="text-[11px] text-slate-400 font-medium">Sesi Disubmit / Final</div>
                  <div className="text-2xl font-black text-blue-400">{submittedSessions.length}</div>
                  <div className="text-[10px] text-slate-500">Tersinkron ke leaderboard</div>
                </div>
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                  <div className="text-[11px] text-slate-400 font-medium">Database Pemain</div>
                  <div className="text-2xl font-black text-amber-400">{students.length}</div>
                  <div className="text-[10px] text-slate-500">Seluruh anggota korps</div>
                </div>
              </div>
            </div>

            {/* Riwayat Sesi Terdekat */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar size={16} className="text-purple-400" />
                  Daftar Sesi Terdekat & Riwayat
                </h3>
                <button
                  onClick={() => changeTab('sessions')}
                  className="text-xs text-purple-300 hover:text-white font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>Lihat Semua Sesi</span> <ArrowRight size={13} />
                </button>
              </div>

              <div className="divide-y divide-slate-800/80">
                {attendances.slice(0, 5).map(session => (
                  <div key={session.id || session.date} className="py-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div>
                      <div className="font-bold text-white text-sm">
                        {session.sessionName || 'Latihan Rutin'} · <span className="font-mono text-amber-300">{session.date}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {session.scheduledTime || '08:00 WIB'} {session.location ? `· ${session.location}` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${session.isClosed ? 'bg-slate-950 text-slate-400 border-slate-800' : session.isSubmitted ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-amber-950 text-amber-300 border-amber-800'}`}>
                        {session.isClosed ? 'Terkunci' : session.isSubmitted ? 'Selesai' : 'Aktif / Draft'}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedDate(session.date);
                          if (session.sessionName) setCurrentSessionName(session.sessionName);
                          changeTab('attendance');
                        }}
                        className="px-3 py-1 bg-purple-950 hover:bg-purple-900 border border-purple-700/50 text-amber-300 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Buka Presensi
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const DesktopHeader = () => (
    <header className="hidden md:flex items-center justify-between px-8 py-4 bg-slate-900/60 border-b border-slate-800 sticky top-0 z-20 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {activeTab !== 'home' && (
          <button type="button" onClick={handleGoBack} className="px-3 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-500/50 text-xs font-bold text-amber-300 hover:text-white flex items-center gap-1.5 transition-all shadow cursor-pointer active:scale-95">
            <ArrowLeft size={14} className="text-amber-400" /> <span>Kembali</span>
          </button>
        )}
        <div className="text-xs text-slate-400 font-medium">
          <span className="text-purple-400 font-bold uppercase tracking-wide">{currentUser?.role === 'admin' ? 'Admin Portal' : 'Petugas Portal'}</span>
          <span className="mx-2">/</span>
          <span className="text-slate-200 font-semibold capitalize">{activeTab === 'home' ? 'Beranda' : activeTab.replace('_', ' ')}</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <a href="https://symzck.github.io/absen/" target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/70 border border-purple-800/50 text-purple-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors">
            <Globe size={13} className="text-purple-400" /> <span>Domain GitHub</span> <ExternalLink size={10} />
          </a>
          <a href="https://github.com/symzck/absen" target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors">
            <GithubIcon size={14} />
          </a>
        </div>
        <div className="h-4 w-[1px] bg-slate-800"></div>
        <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 font-mono">
          <Clock size={13} className="text-purple-400" /> <span>{selectedDate}</span>
        </div>
      </div>
    </header>
  );

  // =========================================================================
  // VIEW 1: UNIFIED SECURE LOGIN SCREEN (SATU JALUR MASUK)
  // Tidak ada bocoran password admin. Hanya pemilik akun yang tahu.
  // =========================================================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Atmosphere Glow */}
        <div className="absolute -top-36 left-1/2 -translate-x-1/2 w-[720px] h-[520px] bg-gradient-to-b from-purple-800/30 via-violet-900/10 to-transparent blur-3xl pointer-events-none rounded-full"></div>
        <div className="absolute top-1/2 -right-32 w-80 h-80 bg-amber-500/10 blur-3xl pointer-events-none rounded-full"></div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 relative">
          {/* Logo PGT Mu'allimin Resmi (Tetap & Presisi) */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-32 h-32 rounded-3xl bg-black p-2.5 shadow-2xl border-2 border-purple-500/40 ring-4 ring-purple-500/10 flex items-center justify-center overflow-hidden">
              <img 
                src={OFFICIAL_LOGO_URL} 
                alt="Logo PGT Mu'allimin Yogyakarta" 
                referrerPolicy="no-referrer" 
                className="w-full h-full object-contain"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/logo.png"; }}
              />
            </div>

            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-800/50 text-purple-300 text-[11px] font-semibold tracking-wider uppercase mb-1.5">
                <Shield size={12} className="text-amber-400" />
                Madrasah Mu'allimin Muhammadiyah Yogyakarta
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
                PGT MU'ALLIMIN
              </h1>
              <p className="text-slate-400 text-xs mt-1">
                Portal Presensi Terpadu · Jalur Masuk Petugas & Administrator
              </p>
            </div>
          </div>

          {/* Clean Secure Login Card */}
          <div className="bg-slate-900/95 backdrop-blur-xl py-7 px-6 sm:px-8 shadow-2xl rounded-3xl border border-slate-800">
            {loginError && (
              <div className="mb-5 bg-rose-950/60 border border-rose-800/60 text-rose-200 px-4 py-3 rounded-2xl text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle size={17} className="text-rose-400 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  ID Pengguna / Username
                </label>
                <div className="relative">
                  <input 
                    name="username" 
                    type="text" 
                    required 
                    autoComplete="username"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Ketik username Anda" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Kata Sandi
                </label>
                <div className="relative">
                  <input 
                    name="password" 
                    type={showLoginPassword ? "text" : "password"} 
                    required 
                    autoComplete="current-password"
                    className="w-full px-4 py-3 pr-11 rounded-xl bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="••••••••" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                    title={showLoginPassword ? "Sembunyikan" : "Tampilkan"}
                  >
                    {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 shadow-lg shadow-purple-950/40 transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <Lock size={15} />
                  <span>Masuk ke Sistem</span>
                </button>
              </div>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-800/80 text-center text-slate-500 text-[11px]">
              Sistem mengenali hak akses Anda secara otomatis (Petugas atau Administrator) berdasarkan akun yang Anda masukkan.
            </div>
          </div>

          {/* GitHub Domain & Repository Footer */}
          <div className="mt-6 flex flex-col items-center gap-2.5 text-center text-xs text-slate-400">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 shadow-lg text-[11px]">
              <Globe size={13} className="text-purple-400" />
              <span className="text-slate-400">Domain GitHub:</span>
              <a 
                href="https://symzck.github.io/absen/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-purple-300 hover:text-white font-mono font-semibold underline underline-offset-2 flex items-center gap-1"
                title="Buka Website di Domain GitHub Pages"
              >
                symzck.github.io/absen
                <ExternalLink size={10} />
              </a>
            </div>

            <a 
              href="https://github.com/symzck/absen" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-slate-500 hover:text-slate-300 text-[11px] flex items-center gap-1.5 transition-colors"
              title="Buka Repository di GitHub"
            >
              <GithubIcon size={13} />
              <span>Repository GitHub: <strong className="text-slate-400 font-mono">symzck/absen</strong></span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: UNIFIED PORTAL (AUTHENTICATED USERS)
  // Shared layout for both Petugas and Administrator with role-based features
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased selection:bg-purple-500 selection:text-white">
      
      {/* 1. Desktop Sidebar Navigation */}
      <Sidebar />

      {/* 2. Mobile Header & Persistent Menu Button */}
      <MobileTopBar />
      
      {/* Mobile Bottom Navigation Bar (Persistent on all devices for quick access) */}
      <MobileBottomBar />

      {/* 3. Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setIsMobileMenuOpen(false)}>
          <aside className="w-4/5 max-w-xs h-full bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-purple-500/40 bg-black flex items-center justify-center">
                  <img src={OFFICIAL_LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div className="font-bold text-sm text-white">PGT MENU</div>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {menuItems.map(item => (
                <button 
                  key={item.id}
                  onClick={() => { changeTab(item.id as AppTab); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === item.id ? 'bg-purple-800 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                  <item.icon size={18} className={activeTab === item.id ? 'text-amber-400' : 'text-purple-500'} />
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="p-4 border-t border-slate-800">
              <button onClick={handleLogout} className="w-full py-3 bg-red-950/40 text-red-300 font-bold rounded-xl text-xs border border-red-800/40 flex items-center justify-center gap-2">
                <LogOut size={14} /> Keluar Portal
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* 4. Main Viewport Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-y-auto">
        <DesktopHeader />
        
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {renderTabContent()}
          </div>
        </div>

        {/* Unified Footer */}
        <footer className="mt-auto py-8 px-8 border-t border-slate-900/50 bg-slate-950/50">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 opacity-60 hover:opacity-100 transition-opacity">
            <div className="text-center md:text-left">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Status Sistem Terpusat</div>
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-emerald-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> DB: Online
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-purple-400 font-mono">
                   Role: {currentUser.role.toUpperCase()}
                </div>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 font-medium text-center md:text-right max-w-xs">
              Madrasah Mu'allimin Muhammadiyah Yogyakarta &copy; 2024.
              Seluruh data tersinkronisasi otomatis antar Petugas dan Administrator secara real-time.
            </div>
          </div>
        </footer>
      </main>

      {/* 5. Shared Modals Layer */}
      {renderSharedModals()}

      {/* 6. System Toasts / Notifications */}
      {toast.show && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10">
          <div className={`px-6 py-3.5 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-xl ${toast.type === 'error' ? 'bg-rose-950/90 border-rose-500/50 text-rose-100' : 'bg-slate-900/90 border-purple-500/50 text-purple-100'}`}>
            {toast.type === 'error' ? <AlertCircle size={20} className="text-rose-400" /> : <Shield size={20} className="text-purple-400" />}
            <span className="text-sm font-bold">{toast.message}</span>
            <button onClick={() => setToast({ ...toast, show: false })} className="ml-2 p-1 hover:bg-white/10 rounded-lg"><X size={14} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
