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

export const db = getFirestore(app);

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
      console.warn('[Firestore] Error subscribing to students:', error);
      notifyStatus('error', error.message);
      if (onError) onError(error);
    }
  );
};

export const saveStudentToCloud = async (student: Student): Promise<void> => {
  notifyStatus('syncing');
  try {
    const docRef = doc(db, 'students', String(student.id));
    await setDoc(docRef, {
      id: student.id,
      name: student.name,
      kelas: student.kelas,
      asrama: student.asrama,
      section: student.section,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    notifyStatus('connected');
  } catch (error: any) {
    console.error('[Firestore] Error saving student:', error);
    notifyStatus('error', error?.message || 'Gagal menyimpan ke cloud');
    throw error;
  }
};

export const deleteStudentFromCloud = async (studentId: number): Promise<void> => {
  notifyStatus('syncing');
  try {
    const docRef = doc(db, 'students', String(studentId));
    await deleteDoc(docRef);
    notifyStatus('connected');
  } catch (error: any) {
    console.error('[Firestore] Error deleting student:', error);
    notifyStatus('error', error?.message || 'Gagal menghapus dari cloud');
    throw error;
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
      console.warn('[Firestore] Error subscribing to attendances:', error);
      notifyStatus('error', error.message);
      if (onError) onError(error);
    }
  );
};

export const saveAttendanceToCloud = async (attendance: DailyAttendance): Promise<void> => {
  notifyStatus('syncing');
  try {
    const docId = attendance.id || `sesi-${attendance.date}`;
    const docRef = doc(db, 'attendances', docId);
    await setDoc(docRef, {
      id: docId,
      date: attendance.date,
      sessionName: attendance.sessionName || 'Latihan Rutin',
      isSubmitted: attendance.isSubmitted !== false,
      submittedAt: attendance.submittedAt || null,
      submittedBy: attendance.submittedBy || null,
      records: attendance.records || [],
      updatedAt: new Date().toISOString()
    }, { merge: true });
    notifyStatus('connected');
  } catch (error: any) {
    console.error('[Firestore] Error saving attendance:', error);
    notifyStatus('error', error?.message || 'Gagal menyimpan absensi ke cloud');
    throw error;
  }
};

export const deleteAttendanceFromCloud = async (attendanceId: string): Promise<void> => {
  notifyStatus('syncing');
  try {
    const docRef = doc(db, 'attendances', attendanceId);
    await deleteDoc(docRef);
    notifyStatus('connected');
  } catch (error: any) {
    console.error('[Firestore] Error deleting attendance:', error);
    notifyStatus('error', error?.message || 'Gagal menghapus sesi dari cloud');
    throw error;
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
      console.warn('[Firestore] Error subscribing to system users:', error);
      notifyStatus('error', error.message);
      if (onError) onError(error);
    }
  );
};

export const saveUserToCloud = async (user: SystemUser): Promise<void> => {
  notifyStatus('syncing');
  try {
    const docRef = doc(db, 'system_users', user.id);
    await setDoc(docRef, {
      id: user.id,
      username: user.username,
      password: user.password,
      fullName: user.fullName,
      role: user.role,
      assignedSection: user.assignedSection || 'All',
      createdAt: user.createdAt,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    notifyStatus('connected');
  } catch (error: any) {
    console.error('[Firestore] Error saving user:', error);
    notifyStatus('error', error?.message || 'Gagal menyimpan user ke cloud');
    throw error;
  }
};

export const deleteUserFromCloud = async (userId: string): Promise<void> => {
  notifyStatus('syncing');
  try {
    const docRef = doc(db, 'system_users', userId);
    await deleteDoc(docRef);
    notifyStatus('connected');
  } catch (error: any) {
    console.error('[Firestore] Error deleting user:', error);
    notifyStatus('error', error?.message || 'Gagal menghapus user dari cloud');
    throw error;
  }
};

// ---------------------------------------------------------------------------
// 4. AUTO-SEED DATABASE IF EMPTY (INITIAL MIGRATION)
// ---------------------------------------------------------------------------

export const seedInitialDatabaseIfEmpty = async (
  initialStudents: Student[],
  initialUsers: SystemUser[]
): Promise<{ seeded: boolean; message: string }> => {
  try {
    const studentSnapshot = await getDocs(collection(db, 'students'));
    if (studentSnapshot.empty) {
      console.log('[Firestore] Database students is empty. Seeding initial data...');
      notifyStatus('syncing');
      
      // Batch seed students
      const batch = writeBatch(db);
      initialStudents.forEach((student) => {
        const ref = doc(db, 'students', String(student.id));
        batch.set(ref, student);
      });
      
      // Batch seed initial users
      initialUsers.forEach((user) => {
        const ref = doc(db, 'system_users', user.id);
        batch.set(ref, user);
      });

      await batch.commit();
      notifyStatus('connected');
      return { seeded: true, message: 'Data awal berhasil di-seed ke Cloud Firestore (absen-7862e).' };
    }
    return { seeded: false, message: 'Data sudah ada di cloud database.' };
  } catch (error: any) {
    console.warn('[Firestore] Error during seed check:', error);
    notifyStatus('error', error?.message || 'Koneksi Firestore gagal');
    return { seeded: false, message: error?.message || 'Gagal terhubung ke Cloud Firestore' };
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

    await batch.commit();
    notifyStatus('connected');
    return { 
      success: true, 
      message: `Seluruh data (${students.length} anggota, ${users.length} akun, ${attendances.length} sesi) berhasil disimpan permanen ke Cloud Database (absen-7862e)!` 
    };
  } catch (error: any) {
    console.error('[Firestore] Bulk upload error:', error);
    notifyStatus('error', error?.message || 'Gagal upload ke cloud');
    return { 
      success: false, 
      message: error?.message || 'Gagal menyimpan data ke Cloud Firestore.' 
    };
  }
};

