import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  Unsubscribe 
} from 'firebase/firestore';
import { app } from './googleAuth';
import { Student, DailyAttendance, SystemUser } from '../App';

// In Google Cloud Firestore for project absen-7862e, the database ID is named 'default'
export const db = getFirestore(app, 'default');

export type SyncStatus = 'connected' | 'syncing' | 'offline' | 'error' | 'connecting';

// Event emitter / listener callback types for real-time updates
type SyncCallback = (status: SyncStatus, errorDetail?: string) => void;
const syncListeners: Set<SyncCallback> = new Set();

let currentSyncStatus: SyncStatus = 'connecting';
let currentSyncError: string | undefined = undefined;

export const getSyncStatus = () => ({ status: currentSyncStatus, error: currentSyncError });

export const onSyncStatusChange = (cb: SyncCallback) => {
  syncListeners.add(cb);
  cb(currentSyncStatus, currentSyncError);
  return () => {
    syncListeners.delete(cb);
  };
};

function notifyStatus(status: SyncStatus, error?: string) {
  currentSyncStatus = status;
  currentSyncError = error;
  syncListeners.forEach(cb => cb(status, error));
}

// Timeout helper to avoid infinite hanging when Cloud Firestore is not provisioned or network is slow
const withTimeout = <T>(promise: Promise<T>, ms = 3500, fallbackMessage = 'Koneksi cloud timeout'): Promise<T> => {
  let timer: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(fallbackMessage)), ms);
  });
  return Promise.race([
    promise.then(res => { clearTimeout(timer); return res; }),
    timeoutPromise
  ]);
};

// Auto fallback: never stay stuck on connecting
if (typeof window !== 'undefined') {
  setTimeout(() => {
    if (currentSyncStatus === 'connecting') {
      notifyStatus('offline', 'Database Cloud belum diaktifkan di Firebase Console. Berjalan lancar di Mode Lokal.');
    }
  }, 3000);
}

// ---------------------------------------------------------------------------
// 1. STUDENTS / MASTER ANGGOTA REAL-TIME SYNC
// ---------------------------------------------------------------------------

export const subscribeStudents = (
  onData: (students: Student[]) => void,
  onError?: (err: Error) => void
): Unsubscribe => {
  const colRef = collection(db, 'students');

  return onSnapshot(
    colRef,
    (snapshot) => {
      notifyStatus('connected');
      if (!snapshot.empty) {
        const list: Student[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as Student;
          list.push({
            id: Number(data.id || d.id),
            name: data.name || '',
            kelas: data.kelas || '',
            asrama: data.asrama || 'A',
            section: data.section || 'Brass'
          });
        });
        // Sort by ID ascending
        list.sort((a, b) => a.id - b.id);
        onData(list);
      }
    },
    (error) => {
      console.warn('[Firestore] Students subscription offline/not found:', error.message);
      notifyStatus('offline', error.message.includes('NOT_FOUND') ? 'Database Firestore belum dibuat di Firebase Console' : error.message);
      if (onError) onError(error);
    }
  );
};

export const saveStudentToCloud = async (student: Student): Promise<void> => {
  notifyStatus('syncing');
  try {
    const docRef = doc(db, 'students', String(student.id));
    await withTimeout(
      setDoc(docRef, {
        id: student.id,
        name: student.name,
        kelas: student.kelas,
        asrama: student.asrama,
        section: student.section,
        updatedAt: new Date().toISOString()
      }, { merge: true }),
      3500,
      'Cloud timeout'
    );
    notifyStatus('connected');
  } catch (error: any) {
    console.warn('[Firestore] Notice saving student to cloud (using local cache):', error?.message);
    notifyStatus('offline', error?.message || 'Berjalan di mode lokal');
  }
};

export const deleteStudentFromCloud = async (studentId: number): Promise<void> => {
  notifyStatus('syncing');
  try {
    const docRef = doc(db, 'students', String(studentId));
    await withTimeout(deleteDoc(docRef), 3500, 'Cloud timeout');
    notifyStatus('connected');
  } catch (error: any) {
    console.warn('[Firestore] Notice deleting student from cloud:', error?.message);
    notifyStatus('offline', error?.message);
  }
};

// ---------------------------------------------------------------------------
// 2. ATTENDANCES / SESI ABSENSI REAL-TIME SYNC
// ---------------------------------------------------------------------------

export const subscribeAttendances = (
  onData: (attendances: DailyAttendance[]) => void,
  onError?: (err: Error) => void
): Unsubscribe => {
  const colRef = collection(db, 'attendances');

  return onSnapshot(
    colRef,
    (snapshot) => {
      notifyStatus('connected');
      if (!snapshot.empty) {
        const list: DailyAttendance[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          list.push({
            id: data.id || d.id,
            date: data.date || '',
            sessionName: data.sessionName || 'Latihan Rutin',
            isSubmitted: data.isSubmitted !== false,
            submittedAt: data.submittedAt || null,
            submittedBy: data.submittedBy || null,
            records: Array.isArray(data.records) ? data.records : []
          });
        });
        // Sort by date descending
        list.sort((a, b) => b.date.localeCompare(a.date));
        onData(list);
      }
    },
    (error) => {
      console.warn('[Firestore] Attendances subscription offline/not found:', error.message);
      notifyStatus('offline', error.message.includes('NOT_FOUND') ? 'Database Firestore belum dibuat di Firebase Console' : error.message);
      if (onError) onError(error);
    }
  );
};

export const saveAttendanceToCloud = async (attendance: DailyAttendance): Promise<void> => {
  notifyStatus('syncing');
  try {
    const docId = attendance.id || `sesi-${attendance.date}`;
    const docRef = doc(db, 'attendances', docId);
    await withTimeout(
      setDoc(docRef, {
        id: docId,
        date: attendance.date,
        sessionName: attendance.sessionName || 'Latihan Rutin',
        isSubmitted: attendance.isSubmitted !== false,
        submittedAt: attendance.submittedAt || null,
        submittedBy: attendance.submittedBy || null,
        records: attendance.records || [],
        updatedAt: new Date().toISOString()
      }, { merge: true }),
      3500,
      'Cloud timeout'
    );
    notifyStatus('connected');
  } catch (error: any) {
    console.warn('[Firestore] Notice saving attendance to cloud (using local cache):', error?.message);
    notifyStatus('offline', error?.message || 'Berjalan di mode lokal');
  }
};

export const deleteAttendanceFromCloud = async (attendanceId: string): Promise<void> => {
  notifyStatus('syncing');
  try {
    const docRef = doc(db, 'attendances', attendanceId);
    await withTimeout(deleteDoc(docRef), 3500, 'Cloud timeout');
    notifyStatus('connected');
  } catch (error: any) {
    console.warn('[Firestore] Notice deleting attendance from cloud:', error?.message);
    notifyStatus('offline', error?.message);
  }
};

// ---------------------------------------------------------------------------
// 3. SYSTEM USERS / AKUN PENGGUNA REAL-TIME SYNC
// ---------------------------------------------------------------------------

export const subscribeSystemUsers = (
  onData: (users: SystemUser[]) => void,
  onError?: (err: Error) => void
): Unsubscribe => {
  const colRef = collection(db, 'system_users');

  return onSnapshot(
    colRef,
    (snapshot) => {
      notifyStatus('connected');
      if (!snapshot.empty) {
        const list: SystemUser[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as SystemUser;
          list.push({
            id: data.id || d.id,
            username: data.username || '',
            password: data.password || '',
            fullName: data.fullName || '',
            role: (data.role as 'admin' | 'petugas') || 'petugas',
            assignedSection: data.assignedSection || 'All',
            createdAt: data.createdAt || ''
          });
        });
        onData(list);
      }
    },
    (error) => {
      console.warn('[Firestore] Users subscription offline/not found:', error.message);
      notifyStatus('offline', error.message.includes('NOT_FOUND') ? 'Database Firestore belum dibuat di Firebase Console' : error.message);
      if (onError) onError(error);
    }
  );
};

export const saveUserToCloud = async (user: SystemUser): Promise<void> => {
  notifyStatus('syncing');
  try {
    const docRef = doc(db, 'system_users', user.id);
    await withTimeout(
      setDoc(docRef, {
        id: user.id,
        username: user.username,
        password: user.password,
        fullName: user.fullName,
        role: user.role,
        assignedSection: user.assignedSection || 'All',
        createdAt: user.createdAt,
        updatedAt: new Date().toISOString()
      }, { merge: true }),
      3500,
      'Cloud timeout'
    );
    notifyStatus('connected');
  } catch (error: any) {
    console.warn('[Firestore] Notice saving user to cloud (using local cache):', error?.message);
    notifyStatus('offline', error?.message || 'Berjalan di mode lokal');
  }
};

export const deleteUserFromCloud = async (userId: string): Promise<void> => {
  notifyStatus('syncing');
  try {
    const docRef = doc(db, 'system_users', userId);
    await withTimeout(deleteDoc(docRef), 3500, 'Cloud timeout');
    notifyStatus('connected');
  } catch (error: any) {
    console.warn('[Firestore] Notice deleting user from cloud:', error?.message);
    notifyStatus('offline', error?.message);
  }
};

// ---------------------------------------------------------------------------
// 4. ANNOUNCEMENTS / PAPAN PENGUMUMAN & INFORMASI ADMIN
// ---------------------------------------------------------------------------

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'urgent' | 'info' | 'schedule' | 'praise';
  targetAudience: 'All' | 'Brass' | 'Cologuard' | 'Battery' | 'Pit';
  author: string;
  authorRole: string;
  createdAt: string;
  pinned?: boolean;
}

export const subscribeAnnouncements = (
  onData: (announcements: Announcement[]) => void,
  onError?: (err: Error) => void
): Unsubscribe => {
  const colRef = collection(db, 'announcements');

  return onSnapshot(
    colRef,
    (snapshot) => {
      notifyStatus('connected');
      if (!snapshot.empty) {
        const list: Announcement[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as Announcement;
          list.push({
            id: data.id || d.id,
            title: data.title || '',
            content: data.content || '',
            category: data.category || 'info',
            targetAudience: data.targetAudience || 'All',
            author: data.author || 'Admin PGT',
            authorRole: data.authorRole || 'Administrator',
            createdAt: data.createdAt || new Date().toISOString().split('T')[0],
            pinned: Boolean(data.pinned)
          });
        });
        // Sort: pinned first, then by date descending
        list.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return b.createdAt.localeCompare(a.createdAt);
        });
        onData(list);
      }
    },
    (error) => {
      console.warn('[Firestore] Announcements subscription notice:', error.message);
      if (onError) onError(error);
    }
  );
};

export const saveAnnouncementToCloud = async (announcement: Announcement): Promise<void> => {
  notifyStatus('syncing');
  try {
    const docRef = doc(db, 'announcements', announcement.id);
    await withTimeout(
      setDoc(docRef, {
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        category: announcement.category,
        targetAudience: announcement.targetAudience,
        author: announcement.author,
        authorRole: announcement.authorRole,
        createdAt: announcement.createdAt,
        pinned: Boolean(announcement.pinned),
        updatedAt: new Date().toISOString()
      }, { merge: true }),
      3500,
      'Cloud timeout'
    );
    notifyStatus('connected');
  } catch (error: any) {
    console.warn('[Firestore] Notice saving announcement to cloud:', error?.message);
    notifyStatus('offline', error?.message || 'Berjalan di mode lokal');
  }
};

export const deleteAnnouncementFromCloud = async (announcementId: string): Promise<void> => {
  notifyStatus('syncing');
  try {
    const docRef = doc(db, 'announcements', announcementId);
    await withTimeout(deleteDoc(docRef), 3500, 'Cloud timeout');
    notifyStatus('connected');
  } catch (error: any) {
    console.warn('[Firestore] Notice deleting announcement from cloud:', error?.message);
    notifyStatus('offline', error?.message);
  }
};

// ---------------------------------------------------------------------------
// 5. AUTO-SEED DATABASE IF EMPTY (INITIAL MIGRATION)
// ---------------------------------------------------------------------------

export const seedInitialDatabaseIfEmpty = async (
  initialStudents: Student[],
  initialUsers: SystemUser[]
): Promise<{ seeded: boolean; message: string }> => {
  try {
    const studentSnapshot = await withTimeout(getDocs(collection(db, 'students')), 3000, 'Cloud timeout');
    const userSnapshot = await withTimeout(getDocs(collection(db, 'system_users')), 3000, 'Cloud timeout');

    const shouldSeedStudents = studentSnapshot.empty;
    const shouldSeedUsers = userSnapshot.empty;

    if (shouldSeedStudents || shouldSeedUsers) {
      notifyStatus('syncing');
      
      const batch = writeBatch(db);
      if (shouldSeedStudents) {
        initialStudents.forEach((student) => {
          const ref = doc(db, 'students', String(student.id));
          batch.set(ref, student, { merge: true });
        });
      }
      
      if (shouldSeedUsers) {
        initialUsers.forEach((user) => {
          const ref = doc(db, 'system_users', user.id);
          batch.set(ref, user, { merge: true });
        });
      }

      await withTimeout(batch.commit(), 3500, 'Cloud timeout');
      notifyStatus('connected');
      return { seeded: true, message: `Inisialisasi database awal berhasil di-sinkronkan ke Cloud Firestore!` };
    }
    return { seeded: false, message: 'Data sudah tersedia di cloud database.' };
  } catch (error: any) {
    console.warn('[Firestore] Seed check notice (operating in local mode):', error?.message);
    notifyStatus('offline', 'Database Cloud belum diaktifkan di Firebase Console. Data aman di perangkat lokal.');
    return { seeded: false, message: 'Berjalan di mode lokal (offline).' };
  }
};

// ---------------------------------------------------------------------------
// 5. BULK SYNC ALL LOCAL DATA TO CLOUD (MANUAL BACKUP)
// ---------------------------------------------------------------------------

export const uploadAllLocalDataToCloud = async (
  students: Student[],
  attendances: DailyAttendance[],
  users: SystemUser[]
): Promise<{ success: boolean; message: string }> => {
  notifyStatus('syncing');
  try {
    const batch = writeBatch(db);

    students.forEach((student) => {
      const ref = doc(db, 'students', String(student.id));
      batch.set(ref, {
        id: student.id,
        name: student.name,
        kelas: student.kelas,
        asrama: student.asrama,
        section: student.section,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    });

    users.forEach((user) => {
      const ref = doc(db, 'system_users', user.id);
      batch.set(ref, {
        id: user.id,
        username: user.username,
        password: user.password,
        fullName: user.fullName,
        role: user.role,
        assignedSection: user.assignedSection || 'All',
        createdAt: user.createdAt,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    });

    attendances.forEach((att) => {
      const docId = att.id || `sesi-${att.date}`;
      const ref = doc(db, 'attendances', docId);
      batch.set(ref, {
        id: docId,
        date: att.date,
        sessionName: att.sessionName || 'Latihan Rutin',
        isSubmitted: att.isSubmitted !== false,
        submittedAt: att.submittedAt || null,
        submittedBy: att.submittedBy || null,
        records: att.records || [],
        updatedAt: new Date().toISOString()
      }, { merge: true });
    });

    await withTimeout(batch.commit(), 4000, 'Koneksi timeout');
    notifyStatus('connected');
    return { 
      success: true, 
      message: `Seluruh data (${students.length} anggota, ${users.length} akun, ${attendances.length} sesi) berhasil disimpan ke Cloud Database!` 
    };
  } catch (error: any) {
    console.warn('[Firestore] Bulk upload notice:', error?.message);
    notifyStatus('offline', 'Database Cloud belum diaktifkan di Firebase Console.');
    return { 
      success: false, 
      message: error?.message?.includes('NOT_FOUND') 
        ? 'Database Firestore belum dibuat di Firebase Console (absen-7862e). Data Anda tetap aman tersimpan di perangkat lokal.' 
        : (error?.message || 'Gagal menyimpan ke cloud. Data aman tersimpan lokal.') 
    };
  }
};

