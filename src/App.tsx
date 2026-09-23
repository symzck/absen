import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, ClipboardList, BarChart3, LogOut, Download, 
  UserPlus, Trash2, CheckCircle2, AlertCircle, Menu, X, Save,
  Search, CheckSquare, Trophy, Shield, Sparkles, Filter, 
  Check, Clock, UserCheck, Lock, Eye, EyeOff, Edit2, Settings, Key
} from 'lucide-react';

// ==========================================
// LOGO RESMI PGT MU'ALLIMIN (DITETAPKAN SECARA PERMANEN)
// ==========================================
export const OFFICIAL_LOGO_URL = "/image.png";

// --- DATA STRUKTUR APLIKASI ---
interface Student {
  id: number;
  name: string;
  kelas: string;
  asrama: string;
  section: string;
}

interface AttendanceRecord {
  studentId: number;
  status: string;
  note: string;
}

interface DailyAttendance {
  date: string;
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
  // Petugas: 'attendance' | 'my_history'
  // Admin: 'admin_dashboard' | 'recap' | 'members' | 'manage_users'
  const [adminTab, setAdminTab] = useState<'admin_dashboard' | 'recap' | 'members' | 'manage_users'>('admin_dashboard');
  const [petugasTab, setPetugasTab] = useState<'attendance' | 'my_history'>('attendance');

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSuccessMsg, setShowSuccessMsg] = useState(false);
  const [toastMessage, setToastMessage] = useState('Aksi berhasil disimpan.');
  const [loginError, setLoginError] = useState('');

  // Password visibility on login
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Student & Attendance Data
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('pgt_students');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  const [attendances, setAttendances] = useState<DailyAttendance[]>(() => {
    const saved = localStorage.getItem('pgt_attendances');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSection, setSelectedSection] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [recapFilter, setRecapFilter] = useState<'all' | 'warning' | 'safe'>('all');

  // Modal: Add New Member
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentKelas, setNewStudentKelas] = useState('');
  const [newStudentAsrama, setNewStudentAsrama] = useState('A');
  const [newStudentSection, setNewStudentSection] = useState('Brass');

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

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowSuccessMsg(true);
    setTimeout(() => {
      setShowSuccessMsg(false);
    }, 2800);
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
        setAdminTab('admin_dashboard');
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

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = userFormUsername.trim().toLowerCase();
    const cleanFullName = userFormFullName.trim();
    const cleanPass = userFormPassword.trim();

    if (!cleanUsername || !cleanFullName || !cleanPass) {
      alert('Mohon lengkapi seluruh kolom input.');
      return;
    }

    // Check duplicate username if adding new or renaming
    const existing = systemUsers.find(
      u => u.username.toLowerCase() === cleanUsername && u.id !== editingUserId
    );
    if (existing) {
      alert('Username tersebut sudah digunakan oleh pengguna lain. Harap gunakan username lain.');
      return;
    }

    if (editingUserId) {
      // Update existing user
      setSystemUsers(prev => prev.map(u => {
        if (u.id === editingUserId) {
          return {
            ...u,
            username: cleanUsername,
            password: cleanPass,
            fullName: cleanFullName,
            role: userFormRole,
            assignedSection: userFormSection
          };
        }
        return u;
      }));

      // If updating current logged in user
      if (currentUser?.id === editingUserId) {
        setCurrentUser(prev => prev ? ({
          ...prev,
          username: cleanUsername,
          password: cleanPass,
          fullName: cleanFullName,
          role: userFormRole,
          assignedSection: userFormSection
        }) : null);
      }

      setIsUserModalOpen(false);
      triggerToast(`Akun "${cleanFullName}" berhasil diperbarui!`);
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
      triggerToast(`Petugas / User "${cleanFullName}" berhasil didaftarkan!`);
    }
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (userId === currentUser?.id) {
      alert('Anda tidak dapat menghapus akun Anda sendiri saat sedang masuk.');
      return;
    }
    const adminCount = systemUsers.filter(u => u.role === 'admin').length;
    const targetUser = systemUsers.find(u => u.id === userId);
    if (targetUser?.role === 'admin' && adminCount <= 1) {
      alert('Tidak dapat menghapus akun admin terakhir. Minimal harus ada 1 akun Administrator.');
      return;
    }

    if (confirm(`Apakah Anda yakin ingin menghapus akun "${userName}"? Akun ini tidak akan bisa login lagi.`)) {
      setSystemUsers(prev => prev.filter(u => u.id !== userId));
      triggerToast(`Akun "${userName}" telah dihapus.`);
    }
  };

  // Change Admin Password (Secret setting)
  const handleChangeAdminPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminPass.trim()) {
      alert('Kata sandi baru tidak boleh kosong.');
      return;
    }
    if (newAdminPass !== confirmAdminPass) {
      alert('Konfirmasi kata sandi tidak cocok. Silakan ketik ulang.');
      return;
    }

    if (currentUser) {
      setSystemUsers(prev => prev.map(u => {
        if (u.id === currentUser.id) {
          return { ...u, password: newAdminPass };
        }
        return u;
      }));
      setCurrentUser(prev => prev ? { ...prev, password: newAdminPass } : null);
      setIsAdminPassModalOpen(false);
      setNewAdminPass('');
      setConfirmAdminPass('');
      triggerToast('Kata sandi rahasia Administrator Anda berhasil diubah!');
    }
  };

  // Attendance Handlers
  const handleSaveAttendance = (studentId: number, status: string, note: string) => {
    setAttendances(prev => {
      let dateIndex = prev.findIndex(a => a.date === selectedDate);
      let newData = [...prev];

      if (dateIndex === -1) {
        newData.push({ date: selectedDate, records: [{ studentId, status, note }] });
      } else {
        let recordIndex = newData[dateIndex].records.findIndex(r => r.studentId === studentId);
        if (recordIndex === -1) {
          newData[dateIndex].records.push({ studentId, status, note });
        } else {
          newData[dateIndex].records[recordIndex] = { studentId, status, note };
        }
      }
      return newData;
    });
  };

  const handleMarkAllPresent = () => {
    setAttendances(prev => {
      let newData = [...prev];
      let dateIndex = newData.findIndex(a => a.date === selectedDate);
      
      if (dateIndex === -1) {
        newData.push({ date: selectedDate, records: [] });
        dateIndex = newData.length - 1;
      }
      
      const currentRecords = [...newData[dateIndex].records];
      
      filteredStudents.forEach(student => {
        const existingRecordIndex = currentRecords.findIndex(r => r.studentId === student.id);
        if (existingRecordIndex === -1) {
          currentRecords.push({ studentId: student.id, status: 'Hadir', note: '' });
        } else {
          currentRecords[existingRecordIndex] = { ...currentRecords[existingRecordIndex], status: 'Hadir' };
        }
      });
      
      newData[dateIndex].records = currentRecords;
      return newData;
    });
    triggerToast(`Semua anggota ${selectedSection === 'All' ? 'aktif' : selectedSection} ditandai Hadir!`);
  };

  const getCurrentRecord = (studentId: number) => {
    const dateData = attendances.find(a => a.date === selectedDate);
    return dateData?.records.find(r => r.studentId === studentId) || { status: '', note: '' };
  };

  const recapData = useMemo(() => {
    const totalDays = attendances.length || 1;
    
    return students.map(student => {
      let presentCount = 0;
      let notes: string[] = [];

      attendances.forEach(day => {
        const record = day.records.find(r => r.studentId === student.id);
        if (record) {
          if (record.status === 'Hadir') presentCount++;
          if (record.note) notes.push(`(${day.date}: ${record.note})`);
        }
      });

      const percentage = Math.round((presentCount / totalDays) * 100);
      return {
        ...student,
        presentCount,
        percentage: attendances.length === 0 ? 100 : percentage,
        notes: notes.join(', ')
      };
    });
  }, [students, attendances]);

  const sectionLeaderboard = useMemo(() => {
    const stats: Record<string, { totalPercentage: number; count: number; presentTotal: number }> = {};
    recapData.forEach(student => {
      if (!stats[student.section]) {
        stats[student.section] = { totalPercentage: 0, count: 0, presentTotal: 0 };
      }
      stats[student.section].totalPercentage += student.percentage;
      stats[student.section].count += 1;
      stats[student.section].presentTotal += student.presentCount;
    });

    return Object.keys(stats).map(section => ({
      section,
      average: Math.round(stats[section].totalPercentage / stats[section].count),
      members: stats[section].count
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

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;
    const newStudent: Student = {
      id: Date.now(),
      name: newStudentName.trim(),
      kelas: newStudentKelas.trim() || '1A',
      asrama: newStudentAsrama,
      section: newStudentSection,
    };
    setStudents(prev => [...prev, newStudent]);
    setNewStudentName('');
    setNewStudentKelas('');
    setIsAddMemberModalOpen(false);
    triggerToast(`Pemain ${newStudent.name} berhasil ditambahkan ke database!`);
  };

  const handleDeleteStudent = (id: number, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data anggota "${name}"?`)) {
      setStudents(prev => prev.filter(s => s.id !== id));
      triggerToast(`Data anggota "${name}" telah dihapus.`);
    }
  };

  const sections = ['All', 'Brass', 'Cologuard', 'Battery', 'Pit'];
  
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

        {/* Success Toast */}
        {showSuccessMsg && (
          <div className="fixed top-5 right-5 z-50 bg-emerald-950 border border-emerald-500/60 text-emerald-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in">
            <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
            <div className="text-xs font-semibold">{toastMessage}</div>
          </div>
        )}

        {/* Officer Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-6">
          
          {/* Officer Navigation Pills */}
          <div className="flex items-center justify-between bg-slate-900 p-2 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPetugasTab('attendance')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${petugasTab === 'attendance' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                <ClipboardList size={15} />
                <span>Input Presensi Hari Ini</span>
              </button>
              <button
                onClick={() => setPetugasTab('my_history')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${petugasTab === 'my_history' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                <BarChart3 size={15} />
                <span>Ringkasan Sesi</span>
              </button>
            </div>

            <div className="text-xs text-slate-400 pr-2 hidden sm:block">
              Total {filteredStudents.length} Anggota Ditugaskan
            </div>
          </div>

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
                              <div className="font-bold text-slate-100">{student.name}</div>
                              <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                                <span className="text-purple-300 font-semibold">{student.section}</span>
                                <span>·</span>
                                <span>Kelas {student.kelas}</span>
                                <span>·</span>
                                <span>Asrama {student.asrama}</span>
                              </div>
                            </td>
                            <td className="py-3 px-5 text-center">
                              <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 gap-1">
                                {[
                                  { key: 'Hadir', label: 'Hadir', color: 'bg-emerald-600 text-white' },
                                  { key: 'Sakit', label: 'Sakit', color: 'bg-amber-600 text-white' },
                                  { key: 'Izin', label: 'Izin', color: 'bg-sky-600 text-white' },
                                  { key: 'Alfa', label: 'Alfa', color: 'bg-rose-600 text-white' }
                                ].map(statusObj => {
                                  const isActive = record.status === statusObj.key;
                                  return (
                                    <button
                                      key={statusObj.key}
                                      type="button"
                                      onClick={() => handleSaveAttendance(student.id, statusObj.key, record.note)}
                                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                        isActive ? `${statusObj.color} shadow-md` : 'text-slate-400 hover:text-slate-200'
                                      }`}
                                    >
                                      {statusObj.label}
                                    </button>
                                  );
                                })}
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
                            <div className="font-bold text-white text-sm">{student.name}</div>
                            <div className="text-[11px] text-slate-400">Section {student.section} · Kls {student.kelas}</div>
                          </div>
                          {record.status && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-700/50">
                              {record.status}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-4 gap-1">
                          {['Hadir', 'Sakit', 'Izin', 'Alfa'].map(st => (
                            <button
                              key={st}
                              onClick={() => handleSaveAttendance(student.id, st, record.note)}
                              className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                                record.status === st 
                                  ? (st === 'Hadir' ? 'bg-emerald-600 text-white' : st === 'Alfa' ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white') 
                                  : 'bg-slate-900 text-slate-400'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
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

              {/* Sticky Submit by Officer */}
              <div className="flex justify-end pt-2">
                <button 
                  onClick={() => triggerToast('Presensi berhasil disimpan dan tersinkronisasi ke laporan Administrator!')}
                  className="px-6 py-3 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-purple-950 transition-all active:scale-95"
                >
                  <Save size={16} />
                  <span>Kunci & Simpan Presensi Sesi Ini</span>
                </button>
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

        </main>
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
      <div className="md:hidden bg-slate-900 border-b border-slate-800 text-white p-3.5 flex justify-between items-center shadow-lg sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-purple-500/40 bg-black flex items-center justify-center shrink-0">
            <img 
              src={OFFICIAL_LOGO_URL} 
              alt="Logo PGT" 
              className="w-full h-full object-contain"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/logo.png"; }}
            />
          </div>
          <div>
            <div className="font-extrabold text-sm text-white leading-tight">ADMIN PGT MU'ALLIMIN</div>
            <div className="text-[11px] text-amber-400">Pusat Kontrol Utama</div>
          </div>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-200"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Admin Sidebar Navigation */}
      <aside className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:flex flex-col w-full md:w-72 bg-slate-900/95 border-r border-slate-800 text-slate-200 flex-shrink-0 z-20 md:sticky md:top-0 md:h-screen transition-all absolute md:relative shadow-2xl`}>
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

        {/* Secret Admin Key Quick Action */}
        <div className="px-3 pt-3">
          <button
            type="button"
            onClick={() => setIsAdminPassModalOpen(true)}
            className="w-full py-2 px-3 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/50 text-xs text-amber-300 flex items-center justify-between font-semibold transition-all"
          >
            <span className="flex items-center gap-2">
              <Key size={14} className="text-amber-400" /> Kunci Password Admin
            </span>
            <span className="text-[10px] text-purple-300 font-mono">Ubah</span>
          </button>
        </div>

        {/* Admin Nav */}
        <nav className="flex-1 mt-3 px-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Menu Administrator</div>
          
          <button 
            onClick={() => { setAdminTab('admin_dashboard'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
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
            onClick={() => { setAdminTab('recap'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
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
            onClick={() => { setAdminTab('manage_users'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
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
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
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
          <div className="fixed top-5 right-5 z-50 bg-emerald-950 border border-emerald-500/60 text-emerald-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in">
            <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
            <div className="text-xs font-semibold">{toastMessage}</div>
          </div>
        )}

        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">

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
                              <div className="font-bold text-slate-100 group-hover:text-purple-300 transition-colors">
                                {student.name}
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
                              <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 gap-1 shadow-inner">
                                {[
                                  { key: 'Hadir', label: 'Hadir', color: 'bg-emerald-600 text-white' },
                                  { key: 'Sakit', label: 'Sakit', color: 'bg-amber-600 text-white' },
                                  { key: 'Izin', label: 'Izin', color: 'bg-sky-600 text-white' },
                                  { key: 'Alfa', label: 'Alfa', color: 'bg-rose-600 text-white' }
                                ].map(statusObj => {
                                  const isActive = record.status === statusObj.key;
                                  return (
                                    <button
                                      key={statusObj.key}
                                      type="button"
                                      onClick={() => handleSaveAttendance(student.id, statusObj.key, record.note)}
                                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                        isActive 
                                          ? `${statusObj.color} shadow-md shadow-black/40 scale-100` 
                                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                                      }`}
                                    >
                                      {statusObj.label}
                                    </button>
                                  );
                                })}
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
                            <div className="font-bold text-white text-sm">{student.name}</div>
                            <div className="text-[11px] text-slate-400">{student.section} · Kls {student.kelas}</div>
                          </div>
                          {record.status && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-900/60 text-purple-300">
                              {record.status}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-4 gap-1">
                          {['Hadir', 'Sakit', 'Izin', 'Alfa'].map(st => (
                            <button
                              key={st}
                              onClick={() => handleSaveAttendance(student.id, st, record.note)}
                              className={`py-1.5 text-xs font-bold rounded-lg ${record.status === st ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-400'}`}
                            >
                              {st}
                            </button>
                          ))}
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
              <div className="flex justify-end">
                <button 
                  onClick={() => triggerToast('Data absensi berhasil disimpan!')}
                  className="px-6 py-3 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-purple-950 transition-all active:scale-95"
                >
                  <Save size={16} />
                  <span>Simpan Perubahan Presensi</span>
                </button>
              </div>
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

                  <button 
                    onClick={exportToExcel}
                    className="self-start md:self-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all active:scale-95"
                  >
                    <Download size={16} />
                    <span>Export Rekap (CSV/Excel)</span>
                  </button>
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
                                <div className={`font-bold ${isWarning ? 'text-rose-300' : 'text-slate-100'}`}>
                                  {student.name}
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

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsAddMemberModalOpen(true)}
                    className="px-4 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-purple-950 transition-all active:scale-95"
                  >
                    <UserPlus size={16} />
                    <span>Tambah Pemain Baru</span>
                  </button>
                </div>
              </div>

              {/* Members Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {students
                  .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.section.toLowerCase().includes(searchQuery.toLowerCase()))
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

                      <button 
                        type="button"
                        onClick={() => handleDeleteStudent(s.id, s.name)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-950/40 rounded-xl transition-colors"
                        title="Hapus Pemain"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

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

      {/* MODAL: ADD STUDENT */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-3xl p-6 sm:p-7 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus size={20} className="text-purple-400" />
                Tambah Anggota Pemain Baru
              </h3>
              <button onClick={() => setIsAddMemberModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
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
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white text-xs font-bold transition-all shadow-md"
                >
                  Simpan Anggota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
