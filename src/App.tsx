import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, ClipboardList, BarChart3, LogOut, Download, 
  UserPlus, Trash2, CheckCircle2, AlertCircle, Menu, X, Save,
  Search, CheckSquare, Trophy, Shield, Sparkles, Filter, 
  Check, Clock, UserCheck, Lock, Eye, EyeOff, Edit2, Settings, Key,
  FileSpreadsheet, History, Send, Edit3, RotateCcw, HelpCircle,
  Globe, ExternalLink, Cloud, Database, UploadCloud, RefreshCw,
  Home, Megaphone, Plus, Pin
} from 'lucide-react';
import officialLogo from './assets/logo.png';
import { EditMemberModal } from './components/EditMemberModal';
import { GoogleSheetsTab } from './components/GoogleSheetsTab';
import { AttendanceSessionsTab } from './components/AttendanceSessionsTab';
import { ConfirmModal } from './components/ConfirmModal';
import { HomeDashboardTab } from './components/HomeDashboardTab';
import { AnnouncementsTab } from './components/AnnouncementsTab';
import { PaperAttendanceSheetModal } from './components/PaperAttendanceSheetModal';
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
  deleteAnnouncementFromCloud
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
  // Petugas: 'attendance' | 'announcements' | 'my_history'
  // Admin: 'home' | 'admin_dashboard' | 'announcements' | 'recap' | 'edit_absensi' | 'google_sheets' | 'members' | 'manage_users'
  type AdminTab = 'home' | 'admin_dashboard' | 'announcements' | 'recap' | 'edit_absensi' | 'google_sheets' | 'members' | 'manage_users';
  type PetugasTab = 'home' | 'attendance' | 'announcements' | 'sessions' | 'recap' | 'members' | 'my_history';
  const [adminTab, setAdminTab] = useState<AdminTab>('home');
  const [petugasTab, setPetugasTab] = useState<PetugasTab>('home');
  const [isPaperSheetModalOpen, setIsPaperSheetModalOpen] = useState(false);
  const [isInlineEditMode, setIsInlineEditMode] = useState(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSuccessMsg, setShowSuccessMsg] = useState(false);
  const [toastMessage, setToastMessage] = useState('Aksi berhasil disimpan.');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('success');
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

  // Announcements State (Synced with localStorage and Cloud Firestore)
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem('pgt_announcements');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {}
    }
    return INITIAL_ANNOUNCEMENTS;
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
        return parsed.map((item: any) => ({
          ...item,
          id: item.id || `sesi-${item.date}`,
          sessionName: item.sessionName || 'Latihan Rutin',
          isSubmitted: item.isSubmitted !== false,
          submittedAt: item.submittedAt || item.date,
          submittedBy: item.submittedBy || 'Petugas Lapangan'
        }));
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

  // Real-time Cloud Synchronization with Firebase Firestore
  useEffect(() => {
    const unsubStatus = onSyncStatusChange((status, err) => {
      setSyncStatus(status);
      setSyncError(err);
    });

    // Check & auto-seed if cloud database is empty
    seedInitialDatabaseIfEmpty(INITIAL_STUDENTS, INITIAL_USERS).catch((err) => {
      console.warn('[Firestore] Seed check notice:', err);
    });

    // Real-time listener for students (Authoritative Cloud Sync: respects deletions and local-only additions)
    const unsubStudents = subscribeStudents((remoteStudents) => {
      if (remoteStudents && remoteStudents.length > 0) {
        const deletedIds = getDeletedStudentIds();
        setStudents(prev => {
          const map = new Map<number, Student>();
          // 1. Authoritative active students from cloud Firestore
          remoteStudents.forEach(remoteS => {
            if (!deletedIds.has(remoteS.id)) {
              map.set(remoteS.id, remoteS);
            }
          });
          // 2. Preserve any local additions that haven't synced to cloud yet
          if (prev && prev.length > 0) {
            prev.forEach(s => {
              if (!deletedIds.has(s.id) && !map.has(s.id)) {
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

    // Real-time listener for attendances
    const unsubAttendances = subscribeAttendances((remoteAttendances) => {
      if (remoteAttendances && remoteAttendances.length > 0) {
        setAttendances(prev => {
          const merged = [...remoteAttendances];
          prev.forEach(localSess => {
            const exists = merged.some(r => r.id === localSess.id || r.date === localSess.date);
            if (!exists) {
              merged.push(localSess);
            }
          });
          merged.sort((a, b) => b.date.localeCompare(a.date));
          localStorage.setItem('pgt_attendances', JSON.stringify(merged));
          return merged;
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

    // Real-time listener for announcements
    const unsubAnnouncements = subscribeAnnouncements((remoteAnn) => {
      if (remoteAnn && remoteAnn.length > 0) {
        setAnnouncements(prev => {
          const map = new Map<string, Announcement>();
          INITIAL_ANNOUNCEMENTS.forEach(a => map.set(a.id, a));
          if (prev && prev.length > 0) {
            prev.forEach(a => map.set(a.id, { ...map.get(a.id), ...a }));
          }
          remoteAnn.forEach(ra => {
            map.set(ra.id, { ...map.get(ra.id), ...ra });
          });
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
    };
  }, []);

  // Sync currentSessionName when selectedDate or attendances change
  useEffect(() => {
    const existing = attendances.find(a => a.date === selectedDate);
    if (existing?.sessionName) {
      setCurrentSessionName(existing.sessionName);
    }
  }, [selectedDate]);

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
    setToastType(isError ? 'error' : type);
    setToastMessage(msg);
    setShowSuccessMsg(true);
    setTimeout(() => {
      setShowSuccessMsg(false);
    }, isError ? 8000 : 3000);
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
        setAdminTab('home');
        triggerToast(`Selamat datang, Administrator (${matchedUser.fullName})!`);
      } else {
        setPetugasTab('attendance');
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
    setStudents(updatedStudents);
    localStorage.setItem('pgt_students', JSON.stringify(updatedStudents));
    setIsPaperSheetModalOpen(false);
    triggerToast(`Data ${updatedStudents.length} anggota berhasil diperbarui sesuai presensi kertas! Rekap otomatis disinkronkan.`, 'success');

    try {
      await saveMultipleStudentsToCloud(updatedStudents);
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

  const handleDeleteSession = async (sessionIdentifier: string) => {
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

  // DELAYED RECAP: Only submitted sessions are included!
  const submittedSessions = useMemo(() => {
    return attendances.filter(a => a.isSubmitted !== false);
  }, [attendances]);

  const recapData = useMemo(() => {
    const totalDays = submittedSessions.length || 0;
    
    return students.map(student => {
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
    const deletedSet = getDeletedStudentIds();
    students.forEach(s => deletedSet.add(s.id));
    localStorage.setItem('pgt_deleted_student_ids', JSON.stringify(Array.from(deletedSet)));

    setStudents([]);
    localStorage.setItem('pgt_students', JSON.stringify([]));
    setIsClearAllModalOpen(false);
    triggerToast('Seluruh data pemain lama telah dikosongkan. Anda dapat mulai menginput daftar pemain baru.');

    for (const s of students) {
      deleteStudentFromCloud(s.id).catch(() => {});
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
    setAnnouncements(prev => {
      const next = prev.filter(a => a.id !== id);
      localStorage.setItem('pgt_announcements', JSON.stringify(next));
      return next;
    });

    try {
      await deleteAnnouncementFromCloud(id);
    } catch (e) {
      console.warn("Gagal hapus pengumuman di cloud:", e);
    }
  };

  const sections = useMemo(() => {
    const defaultSecs = ['All', 'Brass', 'Cologuard', 'Battery', 'Pit'];
    const customSecs = students.map(s => s.section).filter(Boolean);
    return Array.from(new Set([...defaultSecs, ...customSecs]));
  }, [students]);
  
  const filteredStudents = students.filter(s => {
    const matchSection = selectedSection === 'All' || s.section === selectedSection;
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        s.kelas.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        s.asrama.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSection && matchSearch;
  });
  
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
        students={students}
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

              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <div className="text-lg font-black text-white">{students.length}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Pemain / Anggota</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <div className="text-lg font-black text-white">{attendances.length}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Sesi Absensi</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <div className="text-lg font-black text-white">{systemUsers.length}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Akun Pengguna</div>
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
                    const res = await uploadAllLocalDataToCloud(students, attendances, systemUsers);
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
    </>
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
  // VIEW 2: HALAMAN KHUSUS PETUGAS (OFFICER PORTAL)
  // Didesain khusus untuk kecepatan pencatatan di lapangan latihan tanpa akses admin
  // =========================================================================
  if (currentUser.role === 'petugas') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-purple-500 selection:text-white">
        
        {/* Top Officer Header */}
        <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black border border-purple-500/40 p-1 flex items-center justify-center shrink-0">
              <img 
                src={OFFICIAL_LOGO_URL} 
                alt="Logo PGT" 
                className="w-full h-full object-contain"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/logo.png"; }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold text-white">Portal Petugas Presensi</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  PETUGAS LAPANGAN
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Bertugas: <strong className="text-slate-200">{currentUser.fullName}</strong> 
                {currentUser.assignedSection !== 'All' && (
                  <span className="ml-1 text-amber-400 font-semibold">(Section {currentUser.assignedSection})</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setShowSyncInfoModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-900 transition-colors cursor-pointer"
              title="Status Database Cloud"
            >
              <Cloud size={13} className={syncStatus === 'connected' ? 'text-emerald-400' : 'text-amber-400'} />
              <span>Cloud: {firebaseConfig.projectId}</span>
            </button>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
              <Clock size={13} className="text-purple-400" />
              <span>{selectedDate}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="px-3 py-2 bg-red-950/30 hover:bg-red-900/50 text-red-300 rounded-xl border border-red-800/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </header>

        {/* Toast Notification */}
        {showSuccessMsg && (
          <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in max-w-lg ${
            toastType === 'error'
              ? 'bg-rose-950 border border-rose-500/70 text-rose-200'
              : 'bg-emerald-950 border border-emerald-500/60 text-emerald-200'
          }`}>
            {toastType === 'error' ? (
              <AlertCircle size={20} className="text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
            )}
            <div className="text-xs font-semibold break-words flex-1">{toastMessage}</div>
            <button 
              type="button"
              onClick={() => setShowSuccessMsg(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Officer Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-6">
          
          {/* Officer Navigation Pills */}
          <div className="flex items-center justify-between bg-slate-900 p-2 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-1 overflow-x-auto">
              <button
                type="button"
                onClick={() => setPetugasTab('home')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${petugasTab === 'home' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                <Home size={14} />
                <span>Beranda</span>
              </button>
              <button
                type="button"
                onClick={() => setPetugasTab('attendance')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${petugasTab === 'attendance' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                <ClipboardList size={14} />
                <span>Input Presensi</span>
              </button>
              <button
                type="button"
                onClick={() => setPetugasTab('announcements')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${petugasTab === 'announcements' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                <Megaphone size={14} />
                <span>Pengumuman</span>
                {announcements.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-bold font-mono">
                    {announcements.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setPetugasTab('sessions')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${petugasTab === 'sessions' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                <Edit3 size={14} />
                <span>Kelola & Submit Sesi</span>
              </button>
              <button
                type="button"
                onClick={() => setPetugasTab('recap')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${petugasTab === 'recap' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                <BarChart3 size={14} />
                <span>Rekap & Leaderboard</span>
              </button>
              <button
                type="button"
                onClick={() => setPetugasTab('members')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${petugasTab === 'members' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                <Users size={14} />
                <span>Database Pemain</span>
              </button>
              <button
                type="button"
                onClick={() => setPetugasTab('my_history')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${petugasTab === 'my_history' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                <Clock size={14} />
                <span>Ringkasan Sesi</span>
              </button>
            </div>

            <div className="text-xs text-slate-400 pr-2 hidden sm:block">
              Total {filteredStudents.length} Anggota Ditugaskan
            </div>
          </div>

          {/* TAB HOME (BERANDA PETUGAS) */}
          {petugasTab === 'home' && currentUser && (
            <HomeDashboardTab
              currentUser={currentUser}
              students={students}
              attendances={attendances}
              announcements={announcements}
              selectedDate={selectedDate}
              currentSessionName={currentSessionName}
              onNavigateTab={(tab) => {
                if (tab === 'home' || tab === 'attendance' || tab === 'sessions' || tab === 'recap' || tab === 'members' || tab === 'announcements' || tab === 'my_history') {
                  setPetugasTab(tab as PetugasTab);
                } else if (tab === 'edit_absensi') {
                  setPetugasTab('sessions');
                } else if (tab === 'admin_dashboard') {
                  setPetugasTab('attendance');
                }
              }}
              onOpenAddMember={() => setIsAddMemberModalOpen(true)}
              onOpenAddAnnouncement={() => setPetugasTab('announcements')}
              triggerToast={triggerToast}
            />
          )}

          {petugasTab === 'attendance' && (
            <div className="space-y-5">
              
              {/* Officer Control Panel */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-white">Presensi Anggota Latihan</h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Pilih status kehadiran anggota. Catatan halangan bersifat opsional jika izin atau sakit.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Date Selector */}
                    <div className="flex items-center bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs">
                      <span className="text-slate-400 mr-2 font-medium">Tanggal:</span>
                      <input 
                        type="date" 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
                      />
                    </div>

                    {/* Section Selector (If officer has All permission) */}
                    {currentUser.assignedSection === 'All' ? (
                      <div className="flex items-center bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs">
                        <Filter size={14} className="text-slate-400 mr-2" />
                        <select 
                          value={selectedSection}
                          onChange={(e) => setSelectedSection(e.target.value)}
                          className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
                        >
                          {sections.map(sec => (
                            <option key={sec} value={sec} className="bg-slate-900 text-white">
                              {sec === 'All' ? 'Semua Section' : `Section: ${sec}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="px-3 py-2 bg-purple-950/70 border border-purple-700/50 rounded-xl text-xs font-bold text-purple-300">
                        Section: {currentUser.assignedSection}
                      </div>
                    )}

                    <button 
                      type="button"
                      onClick={() => setIsPaperSheetModalOpen(true)}
                      className="px-3.5 py-2 bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                      title="Input atau koreksi data anggota (nama, kelas, asrama, section) sesuai lembar presensi kertas"
                    >
                      <ClipboardList size={14} className="text-amber-400" />
                      <span>Mode Presensi Kertas</span>
                    </button>

                    <button 
                      type="button"
                      onClick={() => setIsInlineEditMode(!isInlineEditMode)}
                      className={`px-3 py-2 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
                        isInlineEditMode 
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-950' 
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                      }`}
                      title="Aktifkan mode edit cepat identitas pemain langsung di tabel tanpa membuka modal"
                    >
                      <Edit3 size={14} />
                      <span>{isInlineEditMode ? 'Tutup Edit Cepat' : 'Edit Cepat Pemain'}</span>
                    </button>

                    <button 
                      onClick={handleMarkAllPresent}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                    >
                      <CheckSquare size={15} />
                      <span>Hadir Semua</span>
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <div className="relative max-w-md">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Cari nama pemain atau kelas..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Summary Numbers */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">Total Anggota</div>
                  <div className="text-xl font-black text-white mt-0.5 tabular-nums">{filteredStudents.length}</div>
                </div>
                <div className="bg-emerald-950/30 border border-emerald-800/40 p-3.5 rounded-2xl">
                  <div className="text-[11px] text-emerald-400 uppercase font-semibold">Hadir Sesi Ini</div>
                  <div className="text-xl font-black text-emerald-300 mt-0.5 tabular-nums">{presentCount}</div>
                </div>
                <div className="bg-amber-950/30 border border-amber-800/40 p-3.5 rounded-2xl">
                  <div className="text-[11px] text-amber-400 uppercase font-semibold">Izin & Sakit</div>
                  <div className="text-xl font-black text-amber-300 mt-0.5 tabular-nums">{sickCount + permitCount}</div>
                </div>
                <div className="bg-rose-950/30 border border-rose-800/40 p-3.5 rounded-2xl">
                  <div className="text-[11px] text-rose-400 uppercase font-semibold">Alfa / Belum Diabsen</div>
                  <div className="text-xl font-black text-rose-300 mt-0.5 tabular-nums">{absentCount}</div>
                </div>
              </div>

              {/* Attendance Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="py-3 px-5 w-12 text-center">No</th>
                        <th className="py-3 px-5">Nama Anggota</th>
                        <th className="py-3 px-5 text-center">Status Kehadiran</th>
                        <th className="py-3 px-5">Catatan Izin / Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-sm">
                      {filteredStudents.map((student, idx) => {
                        const record = getCurrentRecord(student.id);
                        return (
                          <tr key={student.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-5 text-center text-xs text-slate-500 tabular-nums">{idx + 1}</td>
                            <td className="py-3 px-5">
                              {isInlineEditMode ? (
                                <div className="flex flex-col gap-1.5 p-1 bg-slate-950 border border-amber-500/50 rounded-xl">
                                  <input 
                                    type="text" 
                                    value={student.name}
                                    onChange={(e) => handleSaveEditedStudent({ ...student, name: e.target.value })}
                                    className="px-2 py-1 text-xs font-bold text-white bg-slate-900 border border-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    placeholder="Nama Pemain..."
                                  />
                                  <div className="flex items-center gap-1.5 text-[11px]">
                                    <input 
                                      type="text" 
                                      value={student.kelas}
                                      onChange={(e) => handleSaveEditedStudent({ ...student, kelas: e.target.value })}
                                      className="w-16 px-1.5 py-0.5 text-[11px] font-bold text-purple-200 bg-slate-900 border border-slate-700 rounded text-center uppercase"
                                      placeholder="Kelas"
                                    />
                                    <input 
                                      type="text" 
                                      value={student.asrama}
                                      onChange={(e) => handleSaveEditedStudent({ ...student, asrama: e.target.value })}
                                      className="w-16 px-1.5 py-0.5 text-[11px] font-bold text-amber-200 bg-slate-900 border border-slate-700 rounded text-center uppercase"
                                      placeholder="Asrama"
                                    />
                                    <select 
                                      value={student.section}
                                      onChange={(e) => handleSaveEditedStudent({ ...student, section: e.target.value })}
                                      className="px-1.5 py-0.5 text-[11px] font-bold text-sky-200 bg-slate-900 border border-slate-700 rounded"
                                    >
                                      {['Brass', 'Cologuard', 'Battery', 'Pit', student.section].filter((v, i, a) => a.indexOf(v) === i).map(s => (
                                        <option key={s} value={s}>{s}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-100">{student.name}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingStudent(student);
                                        setIsEditMemberModalOpen(true);
                                      }}
                                      className="p-1 rounded-md text-slate-500 hover:text-purple-300 hover:bg-slate-800 transition-colors cursor-pointer"
                                      title={`Edit identitas, kelas, asrama, atau section ${student.name}`}
                                    >
                                      <Edit3 size={13} />
                                    </button>
                                  </div>
                                  <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                                    <span className="text-purple-300 font-semibold">{student.section}</span>
                                    <span>·</span>
                                    <span>Kelas {student.kelas}</span>
                                    <span>·</span>
                                    <span>Asrama {student.asrama}</span>
                                  </div>
                                </>
                              )}
                            </td>
                            <td className="py-3 px-5 text-center">
                              <div className="inline-flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800 gap-1 shadow-inner">
                                {[
                                  { key: 'Hadir', label: 'Hadir', color: 'bg-emerald-600 text-white hover:bg-emerald-500' },
                                  { key: 'Sakit', label: 'Sakit', color: 'bg-amber-600 text-white hover:bg-amber-500' },
                                  { key: 'Izin', label: 'Izin', color: 'bg-sky-600 text-white hover:bg-sky-500' },
                                  { key: 'Alfa', label: 'Alfa', color: 'bg-rose-600 text-white hover:bg-rose-500' }
                                ].map(statusObj => {
                                  const isActive = record.status === statusObj.key;
                                  return (
                                    <button
                                      key={statusObj.key}
                                      type="button"
                                      onClick={() => handleSaveAttendance(student.id, isActive ? '' : statusObj.key, record.note)}
                                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                        isActive ? `${statusObj.color} shadow-md` : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                                      }`}
                                    >
                                      {statusObj.label}
                                    </button>
                                  );
                                })}

                                {/* Opsi Batal / Reset */}
                                <button
                                  type="button"
                                  onClick={() => handleSaveAttendance(student.id, '', '')}
                                  title={record.status ? "Batalkan / Hapus status presensi siswa ini" : "Belum diabsen"}
                                  className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                                    !record.status
                                      ? 'text-slate-500 bg-slate-900 border border-slate-800/80 cursor-default opacity-60'
                                      : 'text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/30'
                                  }`}
                                >
                                  <RotateCcw size={12} className={record.status ? 'text-rose-400' : 'text-slate-500'} />
                                  <span>Batal</span>
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-5">
                              <input 
                                type="text" 
                                placeholder="Keterangan..."
                                value={record.note}
                                onChange={(e) => handleSaveAttendance(student.id, record.status, e.target.value)}
                                className="w-full text-xs px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden p-3 space-y-2.5">
                  {filteredStudents.map((student) => {
                    const record = getCurrentRecord(student.id);
                    return (
                      <div key={student.id} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-1.5">
                              <span>{student.name}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingStudent(student);
                                  setIsEditMemberModalOpen(true);
                                }}
                                className="p-1 text-slate-400 hover:text-purple-300"
                                title="Edit data pemain ini"
                              >
                                <Edit3 size={13} />
                              </button>
                            </div>
                            <div className="text-[11px] text-slate-400">Section {student.section} · Kls {student.kelas} · Asr {student.asrama}</div>
                          </div>
                          {record.status ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-700/50">
                              {record.status}
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-800">
                              Belum Diabsen
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-5 gap-1">
                          {['Hadir', 'Sakit', 'Izin', 'Alfa'].map(st => (
                            <button
                              key={st}
                              onClick={() => handleSaveAttendance(student.id, record.status === st ? '' : st, record.note)}
                              className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                record.status === st 
                                  ? (st === 'Hadir' ? 'bg-emerald-600 text-white' : st === 'Alfa' ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white') 
                                  : 'bg-slate-900 text-slate-400'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => handleSaveAttendance(student.id, '', '')}
                            title="Batalkan status absensi"
                            className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                              !record.status 
                                ? 'bg-slate-900 text-slate-600 border border-slate-800/80' 
                                : 'bg-rose-950/40 text-rose-300 border border-rose-800/50'
                            }`}
                          >
                            <RotateCcw size={11} />
                            <span>Batal</span>
                          </button>
                        </div>

                        <input 
                          type="text" 
                          placeholder="Catatan..."
                          value={record.note}
                          onChange={(e) => handleSaveAttendance(student.id, record.status, e.target.value)}
                          className="w-full text-xs px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-600"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Officer Submit & Draft Status Action Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl mt-2">
                <div className="text-xs text-slate-400">
                  Status: <strong className={currentSession?.isSubmitted ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {currentSession?.isSubmitted ? '✓ Resmi Ter-submit' : '⏳ Draf (Belum Masuk Rekap)'}
                  </strong>
                </div>

                <div className="flex items-center gap-2.5">
                  <button 
                    type="button"
                    onClick={() => handleSaveCurrentSession(false)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Save size={15} />
                    <span>Simpan Draf</span>
                  </button>

                  {!currentSession?.isSubmitted ? (
                    <button 
                      type="button"
                      onClick={() => setIsSubmitConfirmOpen(true)}
                      className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all active:scale-95 cursor-pointer"
                    >
                      <Send size={15} />
                      <span>🚀 Submit Presensi Sesi Ini</span>
                    </button>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => handleSaveCurrentSession(true)}
                      className="px-5 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-purple-950 transition-all active:scale-95 cursor-pointer"
                    >
                      <Save size={15} />
                      <span>Simpan Perubahan</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {petugasTab === 'announcements' && (
            <div className="space-y-4">
              <AnnouncementsTab
                announcements={announcements}
                currentUser={currentUser}
                onSaveAnnouncement={handleSaveAnnouncement}
                onDeleteAnnouncement={handleDeleteAnnouncement}
                triggerToast={triggerToast}
              />
            </div>
          )}

          {petugasTab === 'sessions' && (
            <AttendanceSessionsTab
              sessions={attendances}
              students={students}
              currentUserName={currentUser?.fullName || 'Petugas Lapangan'}
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
              triggerToast={triggerToast}
            />
          )}

          {petugasTab === 'recap' && (
            <div className="space-y-6 pb-20">
              {/* Leaderboard Section Podium */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-bold mb-2">
                      <Trophy size={14} className="text-amber-400" />
                      Leaderboard Disiplin Section
                    </div>
                    <h2 className="text-xl font-extrabold text-white">Peringkat & Rekapitulasi Presensi Resmi</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Dihitung dari seluruh sesi yang telah disubmit resmi ({submittedSessions.length} sesi terekam).
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button 
                      type="button"
                      onClick={() => setIsPaperSheetModalOpen(true)}
                      className="px-4 py-2.5 bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
                      title="Sesuaikan nama, kelas, asrama, dan section sesuai urutan presensi kertas"
                    >
                      <ClipboardList size={15} className="text-amber-400" />
                      <span>Sesuaikan Presensi Kertas</span>
                    </button>
                    <button 
                      type="button"
                      onClick={exportToExcel}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg cursor-pointer"
                    >
                      <Download size={15} />
                      <span>Export Rekap (CSV)</span>
                    </button>
                  </div>
                </div>

                {/* Section Leaderboard Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {sectionLeaderboard.map((board, index) => (
                    <div key={board.section} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400 font-bold">#{index + 1} Section {board.section}</span>
                        <span className="text-[11px] text-slate-500">{board.members} Anggota</span>
                      </div>
                      <div className="text-2xl font-black text-amber-300">{board.average}%</div>
                      <div className="text-[11px] text-slate-400">Total Hadir: {board.presentTotal} orang</div>
                    </div>
                  ))}
                </div>

                {/* Real-time Adjustment Notice */}
                <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-800/40 text-xs text-purple-200 flex items-center gap-2.5">
                  <Sparkles size={16} className="text-amber-400 shrink-0" />
                  <span>
                    <strong>Penyesuaian Otomatis:</strong> Setiap ada pengeditan identitas pemain (nama, kelas, asrama, pindah section) maupun koreksi status hadir, angka rekapitulasi dan peringkat section di atas langsung diperbarui otomatis tanpa perlu refresh.
                  </span>
                </div>
              </div>

              {/* Individual Student Discipline Recap Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white">Rekapitulasi Individual Per Anggota ({recapData.length} Pemain)</h3>
                    <p className="text-xs text-slate-400">Rincian kehadiran, sakit, izin, alfa, dan persentase disiplin.</p>
                  </div>

                  {/* Section Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {sections.map(sec => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setSelectedSection(sec)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          selectedSection === sec
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                        }`}
                      >
                        {sec === 'All' ? 'Semua Section' : sec}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="py-3 px-4 w-12 text-center">No</th>
                        <th className="py-3 px-4">Nama Pemain & Data</th>
                        <th className="py-3 px-3 text-center">Hadir</th>
                        <th className="py-3 px-3 text-center">Sakit</th>
                        <th className="py-3 px-3 text-center">Izin</th>
                        <th className="py-3 px-3 text-center">Alfa</th>
                        <th className="py-3 px-4 text-center">Persentase</th>
                        <th className="py-3 px-4">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs">
                      {recapData
                        .filter(s => selectedSection === 'All' || s.section === selectedSection)
                        .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.kelas.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((student, idx) => (
                          <tr key={student.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4 text-center text-slate-500 tabular-nums">{idx + 1}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5 font-bold text-slate-100">
                                <span>{student.name}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const orig = students.find(s => s.id === student.id) || student;
                                    setEditingStudent(orig);
                                    setIsEditMemberModalOpen(true);
                                  }}
                                  className="p-1 text-slate-500 hover:text-purple-300 hover:bg-slate-800 rounded transition-colors"
                                  title="Edit data pemain ini"
                                >
                                  <Edit3 size={12} />
                                </button>
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                <span className="text-purple-300 font-semibold">{student.section}</span> · Kelas {student.kelas} · Asrama {student.asrama}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-emerald-400 tabular-nums">{student.hadirCount}</td>
                            <td className="py-3 px-3 text-center font-bold text-amber-400 tabular-nums">{student.sakitCount}</td>
                            <td className="py-3 px-3 text-center font-bold text-sky-400 tabular-nums">{student.izinCount}</td>
                            <td className="py-3 px-3 text-center font-bold text-rose-400 tabular-nums">{student.alfaCount}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-block px-2.5 py-1 rounded-full font-black text-xs tabular-nums ${
                                student.percentage >= 80 ? 'bg-emerald-950 border border-emerald-700/50 text-emerald-300' :
                                student.percentage >= 60 ? 'bg-amber-950 border border-amber-700/50 text-amber-300' :
                                'bg-rose-950 border border-rose-700/50 text-rose-300'
                              }`}>
                                {student.percentage}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-400 text-[11px] max-w-xs truncate" title={student.notes}>
                              {student.notes}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {petugasTab === 'members' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-white">Master Data Pemain ({students.length} Anggota)</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Kelola nama, kelas, asrama, dan section sesuai presensi fisik kertas.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button 
                    type="button"
                    onClick={() => setIsPaperSheetModalOpen(true)}
                    className="px-3.5 py-2.5 bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                    title="Input atau koreksi data pemain sekaligus sesuai urutan presensi kertas"
                  >
                    <ClipboardList size={15} className="text-amber-400" />
                    <span>Mode Lembar Presensi Kertas</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => setIsAddMemberModalOpen(true)}
                    className="px-3.5 py-2.5 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <UserPlus size={15} />
                    <span>Tambah Pemain</span>
                  </button>

                  <button 
                    type="button"
                    onClick={handleRestoreDefaultStudents}
                    className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Pulihkan seluruh 43 pemain resmi bawaan"
                  >
                    <RotateCcw size={14} />
                    <span>Pulihkan 43 Anggota</span>
                  </button>
                </div>
              </div>

              {/* Search & Section Filter Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-3 border-t border-slate-800">
                <div className="relative flex-1 max-w-md">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Cari nama pemain, kelas (mis: 2F), atau asrama..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {sections.map(sec => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setSelectedSection(sec)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        selectedSection === sec
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                      }`}
                    >
                      {sec} {sec !== 'All' && `(${students.filter(s => s.section === sec).length})`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Members Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredStudents.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-slate-500 text-xs">
                    Tidak ada anggota pemain yang cocok dengan pencarian / filter ini.
                  </div>
                ) : (
                  filteredStudents.map(s => (
                    <div key={s.id} className="p-4 bg-slate-950 border border-slate-800 hover:border-purple-600/40 rounded-2xl flex flex-col justify-between gap-3 transition-colors shadow-sm">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-bold text-white text-sm">{s.name}</div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.section === 'Brass' ? 'bg-amber-950 text-amber-300 border border-amber-800/50' :
                            s.section === 'Cologuard' ? 'bg-rose-950 text-rose-300 border border-rose-800/50' :
                            s.section === 'Battery' ? 'bg-sky-950 text-sky-300 border border-sky-800/50' :
                            'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                          }`}>
                            {s.section}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                          <span>Kelas <strong className="text-slate-300">{s.kelas}</strong></span>
                          <span>·</span>
                          <span>Asrama <strong className="text-slate-300">{s.asrama}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-900">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingStudent(s);
                            setIsEditMemberModalOpen(true);
                          }}
                          className="flex-1 py-1.5 px-3 bg-purple-900/30 hover:bg-purple-800/50 border border-purple-700/40 text-purple-200 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Edit3 size={13} />
                          <span>Edit Data</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteStudent(s.id, s.name)}
                          className="p-1.5 bg-rose-950/30 hover:bg-rose-900/50 border border-rose-800/40 text-rose-300 hover:text-rose-100 rounded-xl transition-colors cursor-pointer"
                          title={`Hapus ${s.name}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {petugasTab === 'my_history' && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h2 className="text-lg font-bold text-white">Ringkasan Kehadiran Sesi Hari Ini</h2>
              <p className="text-xs text-slate-400">
                Data ini terhubung langsung ke dashboard evaluasi Administrator.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <div className="text-xs text-slate-400">Kehadiran Hari Ini:</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">{attendanceRateToday}%</div>
                  <div className="text-[11px] text-slate-500 mt-1">{presentCount} hadir dari {recordedCount} terdata</div>
                </div>
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <div className="text-xs text-slate-400">Total Sesi Latihan:</div>
                  <div className="text-2xl font-black text-purple-400 mt-1">{attendances.length} Sesi</div>
                  <div className="text-[11px] text-slate-500 mt-1">Tercatat di server lokal</div>
                </div>
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <div className="text-xs text-slate-400">Status Petugas:</div>
                  <div className="text-lg font-bold text-white mt-1">Aktif Bertugas</div>
                  <div className="text-[11px] text-emerald-400 mt-1">✓ Berhasil terotentikasi</div>
                </div>
              </div>
            </div>
          )}

          {/* Petugas Portal Footer with GitHub Domain */}
          <footer className="pt-8 pb-4 text-center text-xs text-slate-500 border-t border-slate-900 mt-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-4xl mx-auto">
              <span className="text-[11px] text-slate-400">
                PGT Mu'allimin Presensi Terpadu · Jalur Petugas Lapangan
              </span>
              <div className="flex items-center gap-3">
                <a 
                  href="https://symzck.github.io/absen/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-mono text-purple-300 hover:text-white transition-colors"
                >
                  <Globe size={12} className="text-purple-400" />
                  <span>symzck.github.io/absen</span>
                  <ExternalLink size={10} />
                </a>
                <span className="text-slate-700">·</span>
                <a 
                  href="https://github.com/symzck/absen"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white transition-colors"
                >
                  <GithubIcon size={12} />
                  <span>GitHub</span>
                </a>
              </div>
            </div>
          </footer>

        </main>
        
        {/* Render Shared Modals for Petugas (Confirm Submit, Edit Member, Paper Sheet, etc.) */}
        {renderSharedModals()}
      </div>
    );
  }

  // =========================================================================
  // VIEW 3: HALAMAN UTAMA ADMINISTRATOR (SUPER ADMIN CONSOLE)
  // Dilengkapi manajemen user (tambah/hapus/reset petugas) & ganti password admin rahasia
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased selection:bg-purple-500 selection:text-white">
      
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white p-3.5 flex justify-between items-center shadow-xl sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-purple-500/40 bg-black flex items-center justify-center shrink-0 shadow-md">
            <img 
              src={OFFICIAL_LOGO_URL} 
              alt="Logo PGT" 
              className="w-full h-full object-contain"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/logo.png"; }}
            />
          </div>
          <div>
            <div className="font-extrabold text-sm text-white leading-tight">ADMIN PGT MU'ALLIMIN</div>
            <div className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
              <span>Pusat Kontrol</span>
              <span>·</span>
              <span className="text-purple-300 capitalize">
                {adminTab === 'home' ? 'Beranda' : adminTab === 'announcements' ? 'Pengumuman' : adminTab === 'admin_dashboard' ? 'Presensi' : adminTab.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="px-3.5 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl shadow-lg border border-purple-400/40 flex items-center gap-1.5 font-bold text-xs active:scale-95 transition-all cursor-pointer"
          title="Buka / Tutup Menu Navigasi"
        >
          {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          <span>{isMobileMenuOpen ? 'Tutup' : 'Menu'}</span>
        </button>
      </div>

      {/* Floating Follow-Along Menu Button on Mobile for persistent access when scrolling */}
      <div className="fixed bottom-5 right-4 z-40 md:hidden pointer-events-auto">
        <button 
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="px-3.5 py-2.5 bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 hover:from-purple-600 hover:to-indigo-500 text-white rounded-full shadow-2xl border-2 border-purple-400/60 active:scale-90 transition-all flex items-center gap-1.5 text-xs font-black cursor-pointer backdrop-blur-sm"
          title="Buka / Tutup Menu"
        >
          {isMobileMenuOpen ? <X size={17} /> : <Menu size={17} />}
          <span className="pr-1">{isMobileMenuOpen ? 'Tutup' : 'Menu'}</span>
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 md:hidden bg-black/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <aside 
            className="w-4/5 max-w-xs h-full bg-slate-900 border-r border-slate-800 text-slate-200 flex flex-col shadow-2xl p-4 overflow-y-auto animate-in slide-in-from-left duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-purple-500/40 bg-black p-0.5 flex items-center justify-center shrink-0">
                  <img 
                    src={OFFICIAL_LOGO_URL} 
                    alt="Logo" 
                    className="w-full h-full object-contain"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/logo.png"; }}
                  />
                </div>
                <div>
                  <div className="font-black text-sm text-white leading-tight">PGT MU'ALLIMIN</div>
                  <div className="text-[10px] text-amber-400 font-bold">SUPER ADMINISTRATOR</div>
                </div>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 mt-3 space-y-1.5 overflow-y-auto">
              <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Navigasi Utama</div>

              <button 
                onClick={() => { setAdminTab('home'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                  adminTab === 'home' 
                    ? 'bg-gradient-to-r from-purple-800/90 to-purple-900 text-white font-bold border border-purple-600/40 shadow-md' 
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Home size={18} className={adminTab === 'home' ? 'text-amber-400' : 'text-purple-400'} />
                  <span>Beranda Utama</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-300 border border-purple-700/50">
                  Home
                </span>
              </button>

              <button 
                onClick={() => { setAdminTab('admin_dashboard'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                  adminTab === 'admin_dashboard' 
                    ? 'bg-gradient-to-r from-purple-800/90 to-purple-900 text-white font-bold border border-purple-600/40 shadow-md' 
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ClipboardList size={18} className={adminTab === 'admin_dashboard' ? 'text-amber-400' : 'text-slate-400'} />
                  <span>Presensi Seluruh Sesi</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 tabular-nums">
                  {filteredStudents.length}
                </span>
              </button>

              <button 
                onClick={() => { setAdminTab('announcements'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                  adminTab === 'announcements' 
                    ? 'bg-gradient-to-r from-purple-800/90 to-purple-900 text-white font-bold border border-purple-600/40 shadow-md' 
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Megaphone size={18} className={adminTab === 'announcements' ? 'text-amber-400' : 'text-amber-400/80'} />
                  <span>Papan Pengumuman</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold tabular-nums">
                  {announcements.length}
                </span>
              </button>

              <button 
                onClick={() => { setAdminTab('edit_absensi'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                  adminTab === 'edit_absensi' 
                    ? 'bg-gradient-to-r from-purple-800/90 to-purple-900 text-white font-bold border border-purple-600/40 shadow-md' 
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Edit3 size={18} className={adminTab === 'edit_absensi' ? 'text-amber-400' : 'text-slate-400'} />
                  <span>Edit Data Absen</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-purple-300 tabular-nums font-bold">
                  {attendances.length} Sesi
                </span>
              </button>

              <button 
                onClick={() => { setAdminTab('recap'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                  adminTab === 'recap' 
                    ? 'bg-gradient-to-r from-purple-800/90 to-purple-900 text-white font-bold border border-purple-600/40 shadow-md' 
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <BarChart3 size={18} className={adminTab === 'recap' ? 'text-amber-400' : 'text-slate-400'} />
                  <span>Rekap & Leaderboard</span>
                </div>
                <Trophy size={14} className="text-amber-400" />
              </button>

              <button 
                onClick={() => { setAdminTab('google_sheets'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                  adminTab === 'google_sheets' 
                    ? 'bg-gradient-to-r from-emerald-800/90 to-teal-900 text-white font-bold border border-emerald-500/40 shadow-md' 
                    : 'text-emerald-300/80 hover:bg-slate-800/60 hover:text-emerald-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet size={18} className="text-emerald-400" />
                  <span>Google Sheets Sync</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  Sheets
                </span>
              </button>

              <button 
                onClick={() => { setAdminTab('manage_users'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                  adminTab === 'manage_users' 
                    ? 'bg-gradient-to-r from-purple-800/90 to-purple-900 text-white font-bold border border-purple-600/40 shadow-md' 
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <UserCheck size={18} className={adminTab === 'manage_users' ? 'text-amber-400' : 'text-slate-400'} />
                  <span>Kelola User & Petugas</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold tabular-nums">
                  {systemUsers.length} User
                </span>
              </button>

              <button 
                onClick={() => { setAdminTab('members'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                  adminTab === 'members' 
                    ? 'bg-gradient-to-r from-purple-800/90 to-purple-900 text-white font-bold border border-purple-600/40 shadow-md' 
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users size={18} className={adminTab === 'members' ? 'text-amber-400' : 'text-slate-400'} />
                  <span>Database Pemain</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 tabular-nums">
                  {students.length}
                </span>
              </button>
            </nav>

            <div className="pt-3 border-t border-slate-800 space-y-2">
              <button
                onClick={handleLogout}
                className="w-full py-2.5 px-3 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut size={14} />
                <span>Keluar dari Admin</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop Admin Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-72 bg-slate-900/95 border-r border-slate-800 text-slate-200 flex-shrink-0 z-20 sticky top-0 h-screen shadow-2xl">
        {/* Brand Banner */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-purple-500/40 bg-black p-1 shadow-lg flex items-center justify-center shrink-0">
              <img 
                src={OFFICIAL_LOGO_URL} 
                alt="Logo PGT Mu'allimin" 
                className="w-full h-full object-contain" 
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/logo.png"; }}
              />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white leading-tight">PGT MU'ALLIMIN</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  SUPER ADMINISTRATOR
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Secret Admin Key Quick Action & Cloud Sync */}
        <div className="px-3 pt-3 space-y-2">
          <button
            type="button"
            onClick={() => setIsAdminPassModalOpen(true)}
            className="w-full py-2 px-3 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/50 text-xs text-amber-300 flex items-center justify-between font-semibold transition-all cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Key size={14} className="text-amber-400" /> Kunci Password Admin
            </span>
            <span className="text-[10px] text-purple-300 font-mono">Ubah</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSyncInfoModal(true)}
            className="w-full py-2 px-3 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 flex items-center justify-between font-semibold transition-all cursor-pointer"
          >
            <span className="flex items-center gap-2 truncate">
              <Cloud size={14} className={syncStatus === 'connected' ? 'text-emerald-400' : 'text-sky-400'} />
              <span className="truncate">Data: {syncStatus === 'connected' ? firebaseConfig.projectId : 'Tersimpan Lokal'}</span>
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
              syncStatus === 'connected' 
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40' 
                : syncStatus === 'syncing'
                ? 'bg-amber-950 text-amber-300 border border-amber-800/40'
                : 'bg-sky-950 text-sky-300 border border-sky-800/40'
            }`}>
              {syncStatus === 'connected' ? 'Cloud Aktif' : syncStatus === 'syncing' ? 'Sync...' : 'Lokal (Aman)'}
            </span>
          </button>
        </div>

        {/* Admin Nav */}
        <nav className="flex-1 mt-3 px-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Menu Administrator</div>
          
          <button 
            onClick={() => { setAdminTab('home'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
              adminTab === 'home' 
                ? 'bg-gradient-to-r from-purple-800/90 to-purple-900 text-white font-bold border border-purple-600/40 shadow-md' 
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Home size={18} className={adminTab === 'home' ? 'text-amber-400' : 'text-purple-400'} />
              <span>Beranda Utama</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-300 border border-purple-700/50">
              Home
            </span>
          </button>

          <button 
            onClick={() => { setAdminTab('admin_dashboard'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
              adminTab === 'admin_dashboard' 
                ? 'bg-gradient-to-r from-purple-800/90 to-purple-900 text-white font-bold border border-purple-600/40 shadow-md' 
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <ClipboardList size={18} className={adminTab === 'admin_dashboard' ? 'text-amber-400' : 'text-slate-400'} />
              <span>Presensi Seluruh Sesi</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 tabular-nums">
              {filteredStudents.length}
            </span>
          </button>

          <button 
            onClick={() => { setAdminTab('announcements'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
              adminTab === 'announcements' 
                ? 'bg-gradient-to-r from-purple-800/90 to-purple-900 text-white font-bold border border-purple-600/40 shadow-md' 
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Megaphone size={18} className={adminTab === 'announcements' ? 'text-amber-400' : 'text-amber-400/80'} />
              <span>Papan Pengumuman</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold tabular-nums">
              {announcements.length}
            </span>
          </button>

          <button 
            onClick={() => { setAdminTab('edit_absensi'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
              adminTab === 'edit_absensi' 
                ? 'bg-gradient-to-r from-purple-800/90 to-purple-900 text-white font-bold border border-purple-600/40 shadow-md' 
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Edit3 size={18} className={adminTab === 'edit_absensi' ? 'text-amber-400' : 'text-slate-400'} />
              <span>Edit Data Absen</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-purple-300 tabular-nums font-bold">
              {attendances.length} Sesi
            </span>
          </button>

          <button 
            onClick={() => { setAdminTab('recap'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
              adminTab === 'recap' 
                ? 'bg-gradient-to-r from-purple-800/90 to-purple-900 text-white font-bold border border-purple-600/40 shadow-md' 
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <BarChart3 size={18} className={adminTab === 'recap' ? 'text-amber-400' : 'text-slate-400'} />
              <span>Rekap & Leaderboard</span>
            </div>
            <Trophy size={14} className="text-amber-400" />
          </button>

          <button 
            onClick={() => { setAdminTab('google_sheets'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
              adminTab === 'google_sheets' 
                ? 'bg-gradient-to-r from-emerald-800/90 to-teal-900 text-white font-bold border border-emerald-500/40 shadow-md' 
                : 'text-emerald-300/80 hover:bg-slate-800/60 hover:text-emerald-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileSpreadsheet size={18} className="text-emerald-400" />
              <span>Google Sheets Sync</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
              Sheets
            </span>
          </button>

          <button 
            onClick={() => { setAdminTab('manage_users'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
              adminTab === 'manage_users' 
                ? 'bg-gradient-to-r from-purple-800/90 to-purple-900 text-white font-bold border border-purple-600/40 shadow-md' 
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <UserCheck size={18} className={adminTab === 'manage_users' ? 'text-amber-400' : 'text-slate-400'} />
              <span>Kelola User & Petugas</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold tabular-nums">
              {systemUsers.length} User
            </span>
          </button>

          <button 
            onClick={() => { setAdminTab('members'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
              adminTab === 'members' 
                ? 'bg-gradient-to-r from-purple-800/90 to-purple-900 text-white font-bold border border-purple-600/40 shadow-md' 
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users size={18} className={adminTab === 'members' ? 'text-amber-400' : 'text-slate-400'} />
              <span>Database Pemain</span>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 tabular-nums">
              {students.length}
            </span>
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="text-xs text-slate-400">
              Admin: <strong className="text-amber-300 font-semibold">{currentUser.username}</strong>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">Privat</span>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs text-red-300 bg-red-950/30 hover:bg-red-900/50 hover:text-white rounded-xl border border-red-800/40 transition-colors font-semibold"
          >
            <LogOut size={15} /> Keluar dari Admin
          </button>
        </div>
      </aside>

      {/* Main Admin Viewport */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-y-auto">
        
        {/* Top Header */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-slate-900/60 border-b border-slate-800 sticky top-0 z-20 backdrop-blur-md">
          <div className="text-xs text-slate-400 font-medium">
            <span className="text-amber-400 font-bold">Admin Console</span>
            <span className="mx-2">/</span>
            <span className="text-slate-200 font-semibold">
              {adminTab === 'admin_dashboard' && 'Presensi Seluruh Sesi Marching Band'}
              {adminTab === 'recap' && 'Rekapitulasi & Leaderboard Kehadiran'}
              {adminTab === 'manage_users' && 'Manajemen Akun Petugas & User'}
              {adminTab === 'members' && 'Kelola Master Data Anggota'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* GitHub Domain & Repo Quick Access */}
            <a
              href="https://symzck.github.io/absen/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/70 border border-purple-800/50 text-purple-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors"
              title="Buka Website di GitHub Pages (symzck.github.io/absen)"
            >
              <Globe size={13} className="text-purple-400" />
              <span>Domain GitHub</span>
              <ExternalLink size={10} />
            </a>

            <a
              href="https://github.com/symzck/absen"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="Repository GitHub: symzck/absen"
            >
              <GithubIcon size={14} />
            </a>

            <div className="h-4 w-[1px] bg-slate-800"></div>

            {/* Cloud Sync Status Button */}
            <button
              type="button"
              onClick={() => setShowSyncInfoModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
              title="Status Database Cloud Firestore (absen-7862e)"
            >
              <Cloud size={13} className={syncStatus === 'connected' ? 'text-emerald-400' : 'text-amber-400'} />
              <span>Cloud:</span>
              <span className="font-mono text-emerald-300">{firebaseConfig.projectId}</span>
              <span className={`w-2 h-2 rounded-full ${syncStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            </button>

            <button
              onClick={() => setIsAdminPassModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Ubah kata sandi rahasia admin"
            >
              <Key size={13} />
              <span>Ganti Password Admin</span>
            </button>
            <div className="h-4 w-[1px] bg-slate-800"></div>
            <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 font-mono">
              <Clock size={13} className="text-purple-400" />
              <span>{selectedDate}</span>
            </div>
          </div>
        </header>

        {/* Toast */}
        {showSuccessMsg && (
          <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in max-w-lg ${
            toastType === 'error'
              ? 'bg-rose-950 border border-rose-500/70 text-rose-200'
              : 'bg-emerald-950 border border-emerald-500/60 text-emerald-200'
          }`}>
            {toastType === 'error' ? (
              <AlertCircle size={20} className="text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
            )}
            <div className="text-xs font-semibold break-words flex-1">{toastMessage}</div>
            <button 
              type="button"
              onClick={() => setShowSuccessMsg(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg shrink-0 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">

          {/* TAB 0: BERANDA / HOME DASHBOARD */}
          {adminTab === 'home' && (
            <HomeDashboardTab
              currentUser={currentUser}
              students={students}
              attendances={attendances}
              announcements={announcements}
              selectedDate={selectedDate}
              currentSessionName={currentSessionName}
              onNavigateTab={(tab) => setAdminTab(tab as AdminTab)}
              onSelectAnnouncement={() => setAdminTab('announcements')}
              onOpenAddMember={() => setIsAddMemberModalOpen(true)}
              onOpenAddAnnouncement={() => setAdminTab('announcements')}
              triggerToast={triggerToast}
            />
          )}

          {/* TAB 1: ADMIN PRESENSI DASHBOARD */}
          {adminTab === 'admin_dashboard' && (
            <div className="space-y-6 pb-20 md:pb-6">
              {/* Top Banner Control & Filters */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
                <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-purple-900/40 text-purple-300 border border-purple-700/40 text-[11px] font-semibold mb-2">
                      <Sparkles size={12} className="text-amber-400" /> Monitoring Presensi Terpusat
                    </div>
                    <h2 className="text-2xl font-extrabold text-white tracking-tight">Presensi Seluruh Sesi</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Administrator dapat meninjau, mengoreksi, atau mencatat kehadiran untuk semua section instrumen.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex items-center bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs">
                      <span className="text-slate-400 mr-2 font-medium">Tanggal:</span>
                      <input 
                        type="date" 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs">
                      <span className="text-slate-400 mr-2 font-medium">Sesi:</span>
                      <input 
                        type="text" 
                        value={currentSessionName}
                        onChange={(e) => setCurrentSessionName(e.target.value)}
                        placeholder="Latihan Rutin"
                        className="bg-transparent text-white font-semibold focus:outline-none w-28 sm:w-36"
                      />
                    </div>

                    <div className="flex items-center bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs">
                      <Filter size={14} className="text-slate-400 mr-2" />
                      <select 
                        value={selectedSection}
                        onChange={(e) => setSelectedSection(e.target.value)}
                        className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
                      >
                        {sections.map(sec => (
                          <option key={sec} value={sec} className="bg-slate-900 text-white">
                            {sec === 'All' ? 'Semua Section' : `Section: ${sec}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button 
                      onClick={handleMarkAllPresent}
                      className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all active:scale-95"
                    >
                      <CheckSquare size={16} />
                      <span>Tandai Semua Hadir</span>
                    </button>
                  </div>
                </div>

                {/* Status Banner: DRAF vs TER-SUBMIT RESMI */}
                <div className={`mt-5 p-4 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-lg ${
                  currentSession?.isSubmitted
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl shrink-0 ${
                      currentSession?.isSubmitted ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {currentSession?.isSubmitted ? <CheckCircle2 size={22} /> : <AlertCircle size={22} />}
                    </div>
                    <div>
                      <div className="font-extrabold text-sm flex items-center gap-2">
                        <span>{currentSession?.isSubmitted ? 'STATUS: TER-SUBMIT RESMI (TEREKAP)' : 'STATUS: DRAF (BELUM DISUBMIT)'}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                          currentSession?.isSubmitted ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}>
                          {currentSession?.isSubmitted ? 'Masuk Rekapitulasi' : 'Belum Masuk Rekapitulasi'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        {currentSession?.isSubmitted 
                          ? `Sesi ini telah disubmit resmi pada ${currentSession.submittedAt || selectedDate} oleh ${currentSession.submittedBy || 'Petugas'}. Data terekam di rekapitulasi.`
                          : 'Data presensi sesi ini masih berstatus draf dan TIDAK AKAN masuk ke rekapitulasi/leaderboard sampai Anda menekan "Submit Presensi Sesi Ini".'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-auto">
                    <button 
                      type="button"
                      onClick={() => setIsPaperSheetModalOpen(true)}
                      className="px-3.5 py-2 bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                      title="Input atau koreksi data pemain (nama, kelas, asrama, section) sesuai lembar presensi kertas"
                    >
                      <ClipboardList size={14} className="text-amber-400" />
                      <span>Mode Presensi Kertas</span>
                    </button>

                    {currentSession?.isSubmitted ? (
                      <button
                        type="button"
                        onClick={() => handleRevertToDraft(selectedDate)}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RotateCcw size={14} />
                        <span>Tarik ke Draf</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsSubmitConfirmOpen(true)}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition-all active:scale-95 cursor-pointer"
                      >
                        <Send size={14} />
                        <span>🚀 Submit Presensi Sesi Ini</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Search Bar & Section Pill Filter Bar */}
                <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Cari nama pemain, kelas (mis: 2F), atau asrama..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {sections.map(sec => (
                      <button
                        key={sec}
                        onClick={() => setSelectedSection(sec)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                          selectedSection === sec 
                            ? 'bg-purple-600 text-white shadow-sm' 
                            : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                        }`}
                      >
                        {sec} {sec !== 'All' && `(${students.filter(s => s.section === sec).length})`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dynamic Metrics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Pemain</div>
                  <div className="text-2xl font-black text-white mt-1 tabular-nums">{filteredStudents.length}</div>
                  <div className="text-[11px] text-purple-400 mt-1 font-medium">
                    {selectedSection === 'All' ? 'Seluruh Section' : `Section ${selectedSection}`}
                  </div>
                </div>

                <div className="bg-emerald-950/30 border border-emerald-800/40 p-4 rounded-2xl">
                  <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Hadir Sesi Ini</span>
                    <Check size={14} />
                  </div>
                  <div className="text-2xl font-black text-emerald-300 mt-1 tabular-nums">{presentCount}</div>
                  <div className="text-[11px] text-emerald-400/80 mt-1 font-mono">
                    Tingkat Kehadiran: {attendanceRateToday}%
                  </div>
                </div>

                <div className="bg-amber-950/30 border border-amber-800/40 p-4 rounded-2xl">
                  <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Izin & Sakit</span>
                    <Clock size={14} />
                  </div>
                  <div className="text-2xl font-black text-amber-300 mt-1 tabular-nums">{sickCount + permitCount}</div>
                  <div className="text-[11px] text-amber-400/80 mt-1">
                    {sickCount} Sakit · {permitCount} Izin
                  </div>
                </div>

                <div className="bg-rose-950/30 border border-rose-800/40 p-4 rounded-2xl">
                  <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Tanpa Keterangan</span>
                    <AlertCircle size={14} />
                  </div>
                  <div className="text-2xl font-black text-rose-300 mt-1 tabular-nums">{absentCount}</div>
                  <div className="text-[11px] text-rose-400/80 mt-1">
                    {recordedCount} sudah terisi dari {filteredStudents.length}
                  </div>
                </div>
              </div>

              {/* Attendance Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="py-3 px-6 w-12 text-center">No</th>
                        <th className="py-3 px-6">Nama Pemain & Data</th>
                        <th className="py-3 px-6 text-center">Status Presensi</th>
                        <th className="py-3 px-6">Catatan Halangan / Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-sm">
                      {filteredStudents.map((student, idx) => {
                        const record = getCurrentRecord(student.id);
                        return (
                          <tr key={student.id} className="hover:bg-slate-800/40 transition-colors group">
                            <td className="py-3 px-6 text-center text-xs text-slate-500 tabular-nums">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-6">
                              <div className="flex items-center gap-2">
                                <div className="font-bold text-slate-100 group-hover:text-purple-300 transition-colors">
                                  {student.name}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingStudent(student);
                                    setIsEditMemberModalOpen(true);
                                  }}
                                  className="p-1 rounded-md text-slate-500 hover:text-purple-300 hover:bg-slate-800 transition-colors cursor-pointer"
                                  title={`Edit nama, kelas, asrama, atau section ${student.name}`}
                                >
                                  <Edit3 size={13} />
                                </button>
                              </div>
                              <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                                <span className="bg-slate-800 text-purple-300 px-2 py-0.5 rounded font-medium text-[11px]">
                                  {student.section}
                                </span>
                                <span>·</span>
                                <span>Kls: <strong className="text-slate-300">{student.kelas}</strong></span>
                                <span>·</span>
                                <span>Asrama: <strong className="text-slate-300">{student.asrama}</strong></span>
                              </div>
                            </td>
                            <td className="py-3 px-6 text-center">
                              <div className="inline-flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800 gap-1 shadow-inner">
                                {[
                                  { key: 'Hadir', label: 'Hadir', color: 'bg-emerald-600 text-white hover:bg-emerald-500' },
                                  { key: 'Sakit', label: 'Sakit', color: 'bg-amber-600 text-white hover:bg-amber-500' },
                                  { key: 'Izin', label: 'Izin', color: 'bg-sky-600 text-white hover:bg-sky-500' },
                                  { key: 'Alfa', label: 'Alfa', color: 'bg-rose-600 text-white hover:bg-rose-500' }
                                ].map(statusObj => {
                                  const isActive = record.status === statusObj.key;
                                  return (
                                    <button
                                      key={statusObj.key}
                                      type="button"
                                      onClick={() => handleSaveAttendance(student.id, isActive ? '' : statusObj.key, record.note)}
                                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                        isActive 
                                          ? `${statusObj.color} shadow-md shadow-black/40 scale-100` 
                                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                                      }`}
                                    >
                                      {statusObj.label}
                                    </button>
                                  );
                                })}

                                {/* Opsi Batal / Reset */}
                                <button
                                  type="button"
                                  onClick={() => handleSaveAttendance(student.id, '', '')}
                                  title={record.status ? "Batalkan / Hapus status presensi siswa ini" : "Belum diabsen"}
                                  className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                                    !record.status
                                      ? 'text-slate-500 bg-slate-900 border border-slate-800/80 cursor-default opacity-60'
                                      : 'text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/30'
                                  }`}
                                >
                                  <RotateCcw size={12} className={record.status ? 'text-rose-400' : 'text-slate-500'} />
                                  <span>Batal</span>
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-6">
                              <input 
                                type="text" 
                                placeholder="Tulis catatan..."
                                value={record.note}
                                onChange={(e) => handleSaveAttendance(student.id, record.status, e.target.value)}
                                className="w-full text-xs px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile view */}
                <div className="md:hidden p-3 space-y-2.5">
                  {filteredStudents.map((student) => {
                    const record = getCurrentRecord(student.id);
                    return (
                      <div key={student.id} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-1.5">
                              <span>{student.name}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingStudent(student);
                                  setIsEditMemberModalOpen(true);
                                }}
                                className="p-1 text-slate-400 hover:text-purple-300"
                                title="Edit data pemain ini"
                              >
                                <Edit3 size={13} />
                              </button>
                            </div>
                            <div className="text-[11px] text-slate-400">Section {student.section} · Kls {student.kelas} · Asr {student.asrama}</div>
                          </div>
                          {record.status ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-900/60 text-purple-300">
                              {record.status}
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-800">
                              Belum Diabsen
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-5 gap-1">
                          {['Hadir', 'Sakit', 'Izin', 'Alfa'].map(st => (
                            <button
                              key={st}
                              onClick={() => handleSaveAttendance(student.id, record.status === st ? '' : st, record.note)}
                              className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                record.status === st 
                                  ? (st === 'Hadir' ? 'bg-emerald-600 text-white' : st === 'Alfa' ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white') 
                                  : 'bg-slate-900 text-slate-400'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => handleSaveAttendance(student.id, '', '')}
                            title="Batalkan status absensi"
                            className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                              !record.status 
                                ? 'bg-slate-900 text-slate-600 border border-slate-800/80' 
                                : 'bg-rose-950/40 text-rose-300 border border-rose-800/50'
                            }`}
                          >
                            <RotateCcw size={11} />
                            <span>Batal</span>
                          </button>
                        </div>

                        <input 
                          type="text" 
                          placeholder="Catatan..."
                          value={record.note}
                          onChange={(e) => handleSaveAttendance(student.id, record.status, e.target.value)}
                          className="w-full text-xs px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl">
                <div className="text-xs text-slate-400">
                  Status Sesi: <strong className={currentSession?.isSubmitted ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {currentSession?.isSubmitted ? '✓ Resmi Ter-submit' : '⏳ Masih Draf (Belum Masuk Rekap)'}
                  </strong>
                </div>

                <div className="flex items-center gap-2.5">
                  <button 
                    type="button"
                    onClick={() => handleSaveCurrentSession(false)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Save size={15} />
                    <span>Simpan Draf</span>
                  </button>

                  {!currentSession?.isSubmitted ? (
                    <button 
                      type="button"
                      onClick={() => setIsSubmitConfirmOpen(true)}
                      className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all active:scale-95 cursor-pointer"
                    >
                      <Send size={15} />
                      <span>🚀 Finalisasi & Submit Presensi</span>
                    </button>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => handleSaveCurrentSession(true)}
                      className="px-5 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-purple-950 transition-all active:scale-95 cursor-pointer"
                    >
                      <Save size={15} />
                      <span>Simpan Perubahan Koreksi</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: PAPAN PENGUMUMAN & INFORMASI ADMIN */}
          {adminTab === 'announcements' && (
            <div className="space-y-6 pb-20 md:pb-6">
              <AnnouncementsTab
                announcements={announcements}
                currentUser={currentUser}
                onSaveAnnouncement={handleSaveAnnouncement}
                onDeleteAnnouncement={handleDeleteAnnouncement}
                triggerToast={triggerToast}
              />
            </div>
          )}

          {/* TAB 2: REKAPITULASI & LEADERBOARD */}
          {adminTab === 'recap' && (
            <div className="space-y-6 pb-20 md:pb-6">
              {/* Podium Section Marching Band */}
              <div className="bg-gradient-to-br from-slate-900 via-purple-950/70 to-slate-900 border border-purple-800/40 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 relative z-10">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-bold mb-2">
                      <Trophy size={14} className="text-amber-400" />
                      Leaderboard Disiplin Section PGT
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tight">
                      Peringkat Section Terdisiplin
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Dihitung berdasarkan rata-rata persentase presensi latihan seluruh anggota di setiap instrumen.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button 
                      type="button"
                      onClick={() => setIsPaperSheetModalOpen(true)}
                      className="self-start md:self-auto px-4 py-2.5 bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
                      title="Sesuaikan nama, kelas, asrama, dan section sesuai urutan presensi kertas"
                    >
                      <ClipboardList size={16} className="text-amber-400" />
                      <span>Sesuaikan Presensi Kertas</span>
                    </button>

                    <button 
                      onClick={exportToExcel}
                      className="self-start md:self-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all active:scale-95 cursor-pointer"
                    >
                      <Download size={16} />
                      <span>Export Rekap (CSV/Excel)</span>
                    </button>
                  </div>
                </div>

                {/* Podium Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 relative z-10">
                  {sectionLeaderboard.map((board, index) => {
                    const isFirst = index === 0;
                    const isSecond = index === 1;
                    const isThird = index === 2;

                    return (
                      <div 
                        key={board.section}
                        className={`p-4 rounded-2xl border transition-all ${
                          isFirst 
                            ? 'bg-gradient-to-b from-amber-500/20 to-slate-900/90 border-amber-400/60 shadow-lg shadow-amber-500/10' 
                            : isSecond 
                            ? 'bg-gradient-to-b from-slate-400/15 to-slate-900/90 border-slate-400/40' 
                            : isThird
                            ? 'bg-gradient-to-b from-amber-700/15 to-slate-900/90 border-amber-700/40'
                            : 'bg-slate-900/70 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                            isFirst ? 'bg-amber-400 text-slate-950 shadow-md' :
                            isSecond ? 'bg-slate-300 text-slate-950' :
                            isThird ? 'bg-amber-700 text-white' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            #{index + 1}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400">
                            {board.members} Pemain
                          </span>
                        </div>
                        <div className="font-extrabold text-lg text-white">{board.section}</div>
                        
                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="text-2xl font-black text-amber-300 tabular-nums">
                            {board.average}%
                          </span>
                          <span className="text-[11px] text-slate-400">Rata-rata</span>
                        </div>

                        <div className="w-full bg-slate-950 h-2 rounded-full mt-3 overflow-hidden border border-slate-800">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              board.average >= 85 ? 'bg-emerald-400' : board.average >= 70 ? 'bg-amber-400' : 'bg-rose-500'
                            }`}
                            style={{ width: `${board.average}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Individual Student Recap Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <h3 className="text-base font-extrabold text-white">Data Rekap Per Pemain</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Pemain dengan kehadiran <strong className="text-rose-400">&lt; 80%</strong> disorot warna merah untuk bahan evaluasi pelatih.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setRecapFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${recapFilter === 'all' ? 'bg-purple-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}
                    >
                      Semua
                    </button>
                    <button
                      onClick={() => setRecapFilter('warning')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${recapFilter === 'warning' ? 'bg-rose-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}
                    >
                      Perlu Evaluasi (&lt;80%)
                    </button>
                    <button
                      onClick={() => setRecapFilter('safe')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${recapFilter === 'safe' ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}
                    >
                      Aman (≥80%)
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="py-3 px-6">Nama Pemain</th>
                        <th className="py-3 px-6">Section</th>
                        <th className="py-3 px-6 text-center">% Kehadiran</th>
                        <th className="py-3 px-6">Status Kedisiplinan</th>
                        <th className="py-3 px-6">Catatan Halangan Terkumpul</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-sm">
                      {recapData
                        .filter(s => {
                          const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                              s.kelas.toLowerCase().includes(searchQuery.toLowerCase());
                          if (!matchSearch) return false;
                          if (recapFilter === 'warning') return s.percentage < 80;
                          if (recapFilter === 'safe') return s.percentage >= 80;
                          return true;
                        })
                        .map(student => {
                          const isWarning = student.percentage < 80;
                          return (
                            <tr key={student.id} className={isWarning ? 'bg-rose-950/20 hover:bg-rose-950/30' : 'hover:bg-slate-800/40'}>
                              <td className="py-3.5 px-6">
                                <div className="flex items-center gap-2">
                                  <span className={`font-bold ${isWarning ? 'text-rose-300' : 'text-slate-100'}`}>
                                    {student.name}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const orig = students.find(s => s.id === student.id) || student;
                                      setEditingStudent(orig);
                                      setIsEditMemberModalOpen(true);
                                    }}
                                    className="p-1 text-slate-500 hover:text-purple-300 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                                    title={`Edit data ${student.name}`}
                                  >
                                    <Edit3 size={13} />
                                  </button>
                                </div>
                                <div className="text-xs text-slate-400 mt-0.5">
                                  Kls: {student.kelas} · Asrama: {student.asrama}
                                </div>
                              </td>
                              <td className="py-3.5 px-6">
                                <span className="bg-slate-800 text-purple-300 text-xs px-2.5 py-1 rounded-md font-medium border border-slate-700">
                                  {student.section}
                                </span>
                              </td>
                              <td className="py-3.5 px-6 text-center">
                                <span className={`inline-flex px-3 py-1 rounded-xl text-xs font-black tabular-nums ${
                                  isWarning 
                                    ? 'bg-rose-950 text-rose-300 border border-rose-800' 
                                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                }`}>
                                  {student.percentage}%
                                </span>
                              </td>
                              <td className="py-3.5 px-6">
                                {isWarning ? (
                                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400">
                                    <AlertCircle size={14} /> Evaluasi (Sering Absen)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                                    <Check size={14} /> Disiplin Latihan
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-6 text-xs text-slate-400 max-w-xs truncate">
                                {student.notes || <span className="text-slate-600">- Tidak ada halangan -</span>}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MANAJEMEN USER & PETUGAS (FITUR UTAMA YANG DIMINTA USER) */}
          {adminTab === 'manage_users' && (
            <div className="space-y-6 pb-20 md:pb-6">
              
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold mb-2">
                    <Shield size={12} className="text-amber-400" /> Hak Akses Khusus Administrator
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Kelola Akun Petugas & Hak Akses</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Tambahkan akun petugas section, atur kata sandi, dan tetapkan wewenang section untuk setiap staf lapangan.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button 
                    onClick={() => setIsAdminPassModalOpen(true)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 transition-all"
                  >
                    <Key size={15} />
                    <span>Ubah Password Admin Saya</span>
                  </button>
                  <button 
                    onClick={handleOpenAddUserModal}
                    className="px-4 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-purple-950 transition-all active:scale-95"
                  >
                    <UserPlus size={16} />
                    <span>Tambah Akun User / Petugas</span>
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                  <div className="text-sm font-bold text-white">
                    Daftar Seluruh Akun Terdaftar ({systemUsers.length} Akun)
                  </div>
                  <div className="text-xs text-slate-400">
                    Akun Petugas hanya dapat mengakses portal absensi lapangan tanpa akses ke menu admin.
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="py-3 px-6">Nama Pengguna / Petugas</th>
                        <th className="py-3 px-6">Username</th>
                        <th className="py-3 px-6">Kata Sandi</th>
                        <th className="py-3 px-6">Peran / Role</th>
                        <th className="py-3 px-6">Section Ditugaskan</th>
                        <th className="py-3 px-6 text-right">Aksi Kelola</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-sm">
                      {systemUsers.map(u => {
                        const isCurrent = u.id === currentUser.id;
                        return (
                          <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3.5 px-6">
                              <div className="font-bold text-white flex items-center gap-2">
                                <span>{u.fullName}</span>
                                {isCurrent && (
                                  <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.2 rounded">
                                    Akun Anda
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">Dibuat: {u.createdAt}</div>
                            </td>
                            <td className="py-3.5 px-6 font-mono text-xs text-purple-300">
                              @{u.username}
                            </td>
                            <td className="py-3.5 px-6 font-mono text-xs text-slate-300">
                              {/* Show password directly to admin for easy management */}
                              <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                                {u.password}
                              </span>
                            </td>
                            <td className="py-3.5 px-6">
                              <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold ${
                                u.role === 'admin' 
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              }`}>
                                {u.role === 'admin' ? 'Administrator' : 'Petugas Lapangan'}
                              </span>
                            </td>
                            <td className="py-3.5 px-6 text-xs text-slate-300 font-semibold">
                              {u.assignedSection === 'All' ? 'Semua Section' : `Section ${u.assignedSection}`}
                            </td>
                            <td className="py-3.5 px-6 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={() => handleOpenEditUserModal(u)}
                                  className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition-colors"
                                  title="Edit / Reset Password"
                                >
                                  <Edit2 size={16} />
                                </button>
                                {!isCurrent && (
                                  <button
                                    onClick={() => handleDeleteUser(u.id, u.fullName)}
                                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                                    title="Hapus Akun User"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DATABASE ANGGOTA */}
          {adminTab === 'members' && (
            <div className="space-y-6 pb-20 md:pb-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-purple-900/40 text-purple-300 border border-purple-700/40 text-[11px] font-semibold mb-2">
                    <Users size={12} className="text-amber-400" /> Database Anggota Marching Band
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Master Data Pemain ({students.length} Orang)</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Kelola data identitas, kelas, asrama, dan penempatan section instrumen marching band.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button 
                    type="button"
                    onClick={() => setIsPaperSheetModalOpen(true)}
                    className="px-3.5 py-2.5 bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-700 hover:to-indigo-700 text-white border border-purple-600/50 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer"
                    title="Input ulang nama, kelas, asrama, dan section sesuai urutan presensi kertas"
                  >
                    <ClipboardList size={15} className="text-amber-400" />
                    <span>Mode Lembar Presensi Kertas</span>
                  </button>
                  <button 
                    type="button"
                    onClick={handleRestoreDefaultStudents}
                    className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer"
                    title="Pulihkan dan pastikan seluruh 43 anggota resmi PGT terdata lengkap"
                  >
                    <RotateCcw size={14} />
                    <span>Pulihkan 43 Anggota</span>
                  </button>
                  {students.length > 0 && (
                    <button 
                      type="button"
                      onClick={() => setIsClearAllModalOpen(true)}
                      className="px-3.5 py-2.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer"
                      title="Kosongkan seluruh baris pemain lama untuk menginput ulang daftar baru dari awal tanpa terpatok pemain lama"
                    >
                      <Trash2 size={14} />
                      <span>Kosongkan Pemain Lama</span>
                    </button>
                  )}
                  <button 
                    onClick={() => setIsAddMemberModalOpen(true)}
                    className="px-4 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-purple-950 transition-all active:scale-95 cursor-pointer"
                  >
                    <UserPlus size={16} />
                    <span>Tambah Pemain Baru</span>
                  </button>
                </div>
              </div>

              {/* Member Search & Section Filter */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-lg">
                <div className="relative flex-1 max-w-md">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Cari nama pemain, kelas (mis: 2F), atau asrama..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {searchQuery && (
                    <button 
                      type="button"
                      onClick={() => setSearchQuery('')} 
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {sections.map(sec => {
                    const count = sec === 'All' ? students.length : students.filter(s => s.section === sec).length;
                    return (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setSelectedSection(sec)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                          selectedSection === sec
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                        }`}
                      >
                        {sec === 'All' ? 'Semua Section' : sec} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Members Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {students
                  .filter(s => {
                    const matchSec = selectedSection === 'All' || s.section === selectedSection;
                    const query = searchQuery.toLowerCase().trim();
                    const matchQuery = !query || 
                      s.name.toLowerCase().includes(query) || 
                      s.section.toLowerCase().includes(query) ||
                      s.kelas.toLowerCase().includes(query) ||
                      s.asrama.toLowerCase().includes(query);
                    return matchSec && matchQuery;
                  })
                  .map(s => (
                    <div 
                      key={s.id}
                      className="bg-slate-900 border border-slate-800 hover:border-purple-600/40 p-4 rounded-2xl flex items-center justify-between shadow-md transition-all group"
                    >
                      <div>
                        <div className="font-bold text-slate-100 group-hover:text-purple-300 transition-colors">
                          {s.name}
                        </div>
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                          <span className="text-amber-400 font-semibold">{s.section}</span>
                          <span>·</span>
                          <span>Kelas {s.kelas}</span>
                          <span>·</span>
                          <span>Asrama {s.asrama}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          type="button"
                          onClick={() => {
                            setEditingStudent(s);
                            setIsEditMemberModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-purple-300 hover:bg-purple-950/50 rounded-xl transition-colors cursor-pointer"
                          title="Ubah Data Pemain"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleDeleteStudent(s.id, s.name)}
                          className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
                          title="Hapus Pemain"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}

                {students.filter(s => {
                  const matchSec = selectedSection === 'All' || s.section === selectedSection;
                  const query = searchQuery.toLowerCase().trim();
                  return matchSec && (!query || s.name.toLowerCase().includes(query) || s.section.toLowerCase().includes(query) || s.kelas.toLowerCase().includes(query) || s.asrama.toLowerCase().includes(query));
                }).length === 0 && (
                  <div className="col-span-full bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center space-y-3">
                    <Users size={36} className="mx-auto text-slate-600" />
                    <div className="font-bold text-slate-300 text-sm">Tidak ada pemain yang cocok dengan pencarian</div>
                    <p className="text-xs text-slate-500">Coba periksa ejaan nama pemain atau ganti filter section di atas.</p>
                    <button 
                      type="button"
                      onClick={() => { setSearchQuery(''); setSelectedSection('All'); }} 
                      className="px-4 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-800/50 text-purple-300 text-xs font-bold transition-all cursor-pointer"
                    >
                      Reset Filter Pencarian
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: RIWAYAT & EDIT DATA ABSEN */}
          {adminTab === 'edit_absensi' && (
            <AttendanceSessionsTab
              sessions={attendances}
              students={students}
              currentUserName={currentUser?.fullName || currentUser?.username || 'Super Administrator'}
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
              triggerToast={triggerToast}
            />
          )}

          {/* TAB 6: GOOGLE SHEETS SYNC */}
          {adminTab === 'google_sheets' && (
            <GoogleSheetsTab
              students={students}
              attendances={attendances}
              recapList={recapData}
              triggerToast={triggerToast}
            />
          )}

          {/* Admin View Footer with GitHub Domain */}
          <footer className="mt-14 pt-8 pb-10 border-t border-slate-800 text-center text-xs text-slate-400">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-5xl mx-auto px-4">
              <div className="flex items-center gap-2.5 text-slate-300">
                <Shield size={16} className="text-amber-400" />
                <span className="font-bold text-white tracking-wide">PGT MU'ALLIMIN YOGYAKARTA</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">Sistem Absensi Terpadu</span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <a 
                  href="https://symzck.github.io/absen/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-950/50 hover:bg-purple-900/70 border border-purple-800/50 text-purple-300 hover:text-white transition-all text-xs font-mono shadow-sm"
                  title="Buka Website di GitHub Pages"
                >
                  <Globe size={13} className="text-purple-400" />
                  <span>symzck.github.io/absen</span>
                  <ExternalLink size={10} />
                </a>

                <a 
                  href="https://github.com/symzck/absen"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-all text-xs shadow-sm"
                  title="Buka Source Code di GitHub"
                >
                  <GithubIcon size={14} />
                  <span>Repository GitHub</span>
                  <ExternalLink size={10} />
                </a>
              </div>
            </div>
          </footer>

        </div>
      </main>

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

      {/* SHARED MODALS */}
      {renderSharedModals()}

    </div>
  );
}
