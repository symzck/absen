import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  enableNetwork,
  getDocFromServer,
  Unsubscribe 
} from 'firebase/firestore';
import { app } from './googleAuth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Student, DailyAttendance, SystemUser } from '../App';

// Connect to Cloud Firestore with the configured database ID
const configuredDbId = (firebaseConfig as any).firestoreDatabaseId;
export const db = configuredDbId ? getFirestore(app, configuredDbId) : getFirestore(app);

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

// Deep recursive sanitizer to eliminate all `undefined` values that cause Firestore setDoc() to fail
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined) return null as any;
  if (data === null) return null as any;
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForFirestore(item)) as any;
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as any)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      } else {
        cleaned[key] = null;
      }
    }
    return cleaned as T;
  }
  return data;
}

// Timeout helper with generous window (15s) so mobile connections (3G/4G/5G) don't get falsely timed out
const withTimeout = <T>(promise: Promise<T>, ms = 15000, fallbackMessage = 'Koneksi cloud timeout'): Promise<T> => {
  let timer: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(fallbackMessage)), ms);
  });
  return Promise.race([
    promise.then(res => { clearTimeout(timer); return res; }),
    timeoutPromise
  ]);
};

// Test server connection to Firestore
export const testCloudConnection = async (): Promise<boolean> => {
  try {
    await getDocFromServer(doc(db, 'system_users', 'admin-master'));
    notifyStatus('connected');
    return true;
  } catch (err: any) {
    if (err?.message?.includes('the client is offline')) {
      notifyStatus('offline', 'Perangkat sedang tidak terhubung internet.');
      return false;
    }
    notifyStatus('connected');
    return true;
  }
};

// Automatic Network & Mobile Lifecycle Listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    notifyStatus('connecting');
    enableNetwork(db)
      .then(() => testCloudConnection())
      .catch(() => {});
  });

  window.addEventListener('offline', () => {
    notifyStatus('offline', 'Koneksi internet seluler/WiFi terputus.');
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && navigator.onLine) {
      enableNetwork(db).catch(() => {});
    }
  });

  // Initial connection probe (does not immediately force offline; waits for snapshot or probe)
  setTimeout(() => {
    testCloudConnection().catch(() => {});
  }, 1000);
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
    },
    (error) => {
      console.warn('[Firestore] Students subscription status:', error.message);
      if (!navigator.onLine) {
        notifyStatus('offline', 'Perangkat sedang offline.');
      } else {
        notifyStatus('error', error.message);
      }
      if (onError) onError(error);
    }
  );
};

export const saveStudentToCloud = async (student: Student): Promise<void> => {
  notifyStatus('syncing');
  try {
    const docRef = doc(db, 'students', String(student.id));
    const payload = sanitizeForFirestore({
      id: Number(student.id),
      name: student.name || '',
      kelas: student.kelas || '',
      asrama: student.asrama || 'A',
      section: student.section || 'Brass',
      updatedAt: new Date().toISOString()
    });
    await withTimeout(
      setDoc(docRef, payload, { merge: true }),
      15000,
      'Gagal menyimpan anggota ke cloud (timeout)'
    );
    notifyStatus('connected');
  } catch (error: any) {
    console.warn('[Firestore] Notice saving student to cloud:', error?.message);
    if (!navigator.onLine) {
      notifyStatus('offline', 'Perangkat sedang offline. Tersimpan di cache lokal & akan disinkronkan saat online.');
    }
    throw error;
  }
};

export const saveMultipleStudentsToCloud = async (studentsList: Student[]): Promise<void> => {
  if (!studentsList || studentsList.length === 0) return;
  notifyStatus('syncing');
  try {
    const batch = writeBatch(db);
    for (const student of studentsList) {
      const docRef = doc(db, 'students', String(student.id));
      const payload = sanitizeForFirestore({
        id: Number(student.id),
        name: student.name || '',
        kelas: student.kelas || '',
        asrama: student.asrama || 'A',
        section: student.section || 'Brass',
        updatedAt: new Date().toISOString()
      });
      batch.set(docRef, payload, { merge: true });
    }
    await withTimeout(batch.commit(), 18000, 'Cloud timeout batch save students');
    notifyStatus('connected');
  } catch (error: any) {
    console.warn('[Firestore] Notice batch saving students to cloud:', error?.message);
    if (!navigator.onLine) notifyStatus('offline');
    throw error;
  }
};

export const replaceAllStudentsInCloud = async (
  newStudentsList: Student[],
  removedStudentIds: number[] = []
): Promise<void> => {
  notifyStatus('syncing');
  try {
    const existingSnap = await withTimeout(getDocs(collection(db, 'students')), 12000, 'Cloud timeout');
    const newIds = new Set(newStudentsList.map(s => String(s.id)));
    const batch = writeBatch(db);

    // Delete any document currently in cloud that is not present in the new student list
    if (existingSnap && !existingSnap.empty) {
      existingSnap.forEach((docSnap) => {
        if (!newIds.has(docSnap.id)) {
          batch.delete(docSnap.ref);
        }
      });
    }

    // Delete explicit removed IDs
    for (const removedId of removedStudentIds) {
      const docRef = doc(db, 'students', String(removedId));
      batch.delete(docRef);
    }

    // Write all new students
    for (const student of newStudentsList) {
      const docRef = doc(db, 'students', String(student.id));
      const payload = sanitizeForFirestore({
        id: Number(student.id),
        name: student.name || '',
        kelas: student.kelas || '',
        asrama: student.asrama || 'A',
        section: student.section || 'Brass',
        updatedAt: new Date().toISOString()
      });
      batch.set(docRef, payload, { merge: true });
    }

    await withTimeout(batch.commit(), 20000, 'Cloud timeout replace all students');
    notifyStatus('connected');
  } catch (error: any) {
    console.warn('[Firestore] Notice replacing students in cloud:', error?.message);
    if (!navigator.onLine) notifyStatus('offline');
    throw error;
  }
};

export const deleteStudentFromCloud = async (studentId: number): Promise<void> => {
  notifyStatus('syncing');
  try {
    const docRef = doc(db, 'students', String(studentId));
    await withTimeout(deleteDoc(docRef), 12000, 'Cloud timeout');

    // Record deletion tombstone in Cloud Firestore so all devices respect deletion
    const tombstoneRef = doc(db, 'deleted_students', String(studentId));
    await withTimeout(
      setDoc(tombstoneRef, {
        id: studentId,
        deletedAt: new Date().toISOString()
      }, { merge: true }),
      12000,
      'Cloud timeout'
    );
    notifyStatus('connected');
  } catch (error: any) {
    console.warn('[Firestore] Notice deleting student from cloud:', error?.message);
    if (!navigator.onLine) notifyStatus('offline');
    throw error;
  }
};

export const subscribeDeletedStudents = (
  onData: (deletedIds: number[]) => void,
  onError?: (err: Error) => void
): Unsubscribe => {
  const colRef = collection(db, 'deleted_students');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const ids: number[] = [];
      snapshot.forEach((d) => {
        ids.push(Number(d.id));
      });
      onData(ids);
    },
    (error) => {
      if (onError) onError(error);
    }
  );
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
      const list: DailyAttendance[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: data.id || d.id,
          date: data.date || '',
          sessionName: data.sessionName || 'Latihan Rutin',
          sessionType: data.sessionType || (data.sessionName?.toLowerCase().includes('sunnah') ? 'sunnah' : 'wajib'),
          scheduledTime: data.scheduledTime || undefined,
          location: data.location || undefined,
          targetSection: data.targetSection || undefined,
          description: data.description || undefined,
          isScheduled: data.isScheduled ?? undefined,
          isClosed: data.isClosed ?? false,
          closedAt: data.closedAt || null,
          closedBy: data.closedBy || null,
          isSubmitted: data.isSubmitted !== false,
          submittedAt: data.submittedAt || null,
          submittedBy: data.submittedBy || null,
          records: Array.isArray(data.records) 
            ? data.records.map((r: any) => ({
                studentId: Number(r.studentId),
                status: r.status || '',
                note: r.note || ''
              }))
            : []
        });
      });
      // Sort by date descending
      list.sort((a, b) => b.date.localeCompare(a.date));
      onData(list);
    },
    (error) => {
      console.warn('[Firestore] Attendances subscription status:', error.message);
      if (!navigator.onLine) notifyStatus('offline');
      if (onError) onError(error);
    }
  );
};

export const saveAttendanceToCloud = async (attendance: DailyAttendance): Promise<void> => {
  notifyStatus('syncing');
  try {
    const docId = attendance.id || `sesi-${attendance.date}`;
    const docRef = doc(db, 'attendances', docId);
    const payload = sanitizeForFirestore({
      id: docId,
      date: attendance.date,
      sessionName: attendance.sessionName || 'Latihan Rutin',
      sessionType: attendance.sessionType || (attendance.sessionName?.toLowerCase().includes('sunnah') ? 'sunnah' : 'wajib'),
      scheduledTime: attendance.scheduledTime || null,
      location: attendance.location || null,
      targetSection: attendance.targetSection || null,
      description: attendance.description || null,
      isScheduled: attendance.isScheduled ?? false,
      isClosed: attendance.isClosed ?? false,
      closedAt: attendance.closedAt || null,
      closedBy: attendance.closedBy || null,
      isSubmitted: attendance.isSubmitted !== false,
      submittedAt: attendance.submittedAt || null,
      submittedBy: attendance.submittedBy || null,
      records: Array.isArray(attendance.records)
        ? attendance.records.map(r => ({
            studentId: Number(r.studentId),
            status: r.status || '',
            note: r.note || ''
          }))
        : [],
      updatedAt: new Date().toISOString()
    });
    await withTimeout(
      setDoc(docRef, payload, { merge: true }),
      15000,
      'Gagal menyimpan absensi ke cloud (timeout)'
    );
    notifyStatus('connected');
  } catch (error: any) {
    console.warn('[Firestore] Notice saving attendance to cloud:', error?.message);
    if (!navigator.onLine) {
      notifyStatus('offline', 'Perangkat sedang offline. Tersimpan di cache lokal & akan tersinkron saat online.');
    }
    throw error;
  }
};

export const saveMultipleAttendancesToCloud = async (attendancesList: DailyAttendance[]): Promise<void> => {
  if (!attendancesList || attendancesList.length === 0) return;
  notifyStatus('syncing');
  try {
    const batch = writeBatch(db);
    for (const att of attendancesList) {
      const docId = att.id || `sesi-${att.date}`;
      const docRef = doc(db, 'attendances', docId);
      const payload = sanitizeForFirestore({
        id: docId,
        date: att.date,
        sessionName: att.sessionName || 'Latihan Rutin',
        sessionType: att.sessionType || (att.sessionName?.toLowerCase().includes('sunnah') ? 'sunnah' : 'wajib'),
        scheduledTime: att.scheduledTime || null,
        location: att.location || null,
        targetSection: att.targetSection || null,
        description: att.description || null,
        isScheduled: att.isScheduled ?? false,
        isClosed: att.isClosed ?? false,
        closedAt: att.closedAt || null,
        closedBy: att.closedBy || null,
        isSubmitted: att.isSubmitted !== false,
        submittedAt: att.submittedAt || null,
        submittedBy: att.submittedBy || null,
        records: Array.isArray(att.records)
          ? att.records.map(r => ({
              studentId: Number(r.studentId),
              status: r.status || '',
              note: r.note || ''
            }))
          : [],
        updatedAt: new Date().toISOString()
      });
      batch.set(docRef, payload, { merge: true });
    }
    await withTimeout(batch.commit(), 20000, 'Cloud timeout batch commit attendances');
    notifyStatus('connected');
  } catch (err: any) {
    console.warn('[Firestore] Notice batch saving attendances:', err?.message);
    if (!navigator.onLine) notifyStatus('offline');
    throw err;
  }
};

export const deleteAttendanceFromCloud = async (attendanceId: string): Promise<void> => {
  notifyStatus('syncing');
  try {
    const docRef = doc(db, 'attendances', attendanceId);
    await withTimeout(deleteDoc(docRef), 12000, 'Cloud timeout');

    // Record deletion tombstone in Cloud Firestore
    const tombstoneRef = doc(db, 'deleted_attendances', attendanceId);
    await withTimeout(
      setDoc(tombstoneRef, {
        id: attendanceId,
        deletedAt: new Date().toISOString()
      }, { merge: true }),
      12000,
      'Cloud timeout'
    );
    notifyStatus('connected');
  } catch (error: any) {
    console.warn('[Firestore] Notice deleting attendance from cloud:', error?.message);
    if (!navigator.onLine) notifyStatus('offline');
    throw error;
  }
};

export const subscribeDeletedAttendances = (
  onData: (deletedIds: string[]) => void,
  onError?: (err: Error) => void
): Unsubscribe => {
  const colRef = collection(db, 'deleted_attendances');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const ids: string[] = [];
      snapshot.forEach((d) => {
        ids.push(d.id);
      });
      onData(ids);
    },
    (error) => {
      if (onError) onError(error);
    }
  );
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
      const list: SystemUser[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as SystemUser;
        list.push({
          id: data.id || d.id,
          username: data.username || '',
          password: data.password || '',
          fullName: data.fullName || '',
          role: (data.role as 'admin' | 'petugas' | 'personalia') || 'petugas',
          assignedSection: data.assignedSection || 'All',
          createdAt: data.createdAt || ''
        });
      });
      onData(list);
    },
    (error) => {
      console.warn('[Firestore] Users subscription status:', error.message);
      if (!navigator.onLine) notifyStatus('offline');
      if (onError) onError(error);
    }
  );
};

export const saveUserToCloud = async (user: SystemUser): Promise<void> => {
  notifyStatus('syncing');
  try {
    const docRef = doc(db, 'system_users', user.id);
    const payload = sanitizeForFirestore({
      id: user.id,
      username: user.username,
      password: user.password,
      fullName: user.fullName,
      role: user.role,
      assignedSection: user.assignedSection || 'All',
      createdAt: user.createdAt,
      updatedAt: new Date().toISOString()
    });
    await withTimeout(
      setDoc(docRef, payload, { merge: true }),
      15000,
      'Gagal menyimpan pengguna ke cloud (timeout)'
    );
    notifyStatus('connected');
  } catch (error: any) {
    console.warn('[Firestore] Notice saving user to cloud:', error?.message);
    if (!navigator.onLine) notifyStatus('offline');
    throw error;
  }
};

export const deleteUserFromCloud = async (userId: string): Promise<void> => {
  notifyStatus('syncing');
  try {
    const docRef = doc(db, 'system_users', userId);
    await withTimeout(deleteDoc(docRef), 12000, 'Cloud timeout');

    // Record deletion tombstone in Cloud Firestore
    const tombstoneRef = doc(db, 'deleted_users', userId);
    await withTimeout(
      setDoc(tombstoneRef, {
        id: userId,
        deletedAt: new Date().toISOString()
      }, { merge: true }),
      12000,
      'Cloud timeout'
    );
    notifyStatus('connected');
  } catch (error: any) {
    console.warn('[Firestore] Notice deleting user from cloud:', error?.message);
    if (!navigator.onLine) notifyStatus('offline');
    throw error;
  }
};

export const subscribeDeletedUsers = (
  onData: (deletedIds: string[]) => void,
  onError?: (err: Error) => void
): Unsubscribe => {
  const colRef = collection(db, 'deleted_users');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const ids: string[] = [];
      snapshot.forEach((d) => {
        ids.push(d.id);
      });
      onData(ids);
    },
    (error) => {
      if (onError) onError(error);
    }
  );
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
  isAuto?: boolean;
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
          pinned: Boolean(data.pinned),
          isAuto: Boolean(data.isAuto)
        });
      });
      // Sort: pinned first, then by date descending
      list.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.createdAt.localeCompare(a.createdAt);
      });
      onData(list);
    },
    (error) => {
      console.warn('[Firestore] Announcements subscription notice:', error.message);
      if (!navigator.onLine) notifyStatus('offline');
      if (onError) onError(error);
    }
  );
};

export const subscribeDeletedAnnouncements = (
  onData: (deletedIds: string[]) => void,
  onError?: (err: Error) => void
): Unsubscribe => {
  const colRef = collection(db, 'deleted_announcements');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const ids: string[] = [];
      snapshot.forEach((d) => {
        ids.push(d.id);
      });
      onData(ids);
    },
    (error) => {
      console.warn('[Firestore] Deleted announcements subscription notice:', error?.message);
      if (onError) onError(error);
    }
  );
};

export const saveAnnouncementToCloud = async (announcement: Announcement): Promise<void> => {
  notifyStatus('syncing');
  try {
    const docRef = doc(db, 'announcements', announcement.id);
    const payload = sanitizeForFirestore({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      category: announcement.category,
      targetAudience: announcement.targetAudience,
      author: announcement.author,
      authorRole: announcement.authorRole,
      createdAt: announcement.createdAt,
      pinned: Boolean(announcement.pinned),
      isAuto: Boolean(announcement.isAuto),
      updatedAt: new Date().toISOString()
    });
    await withTimeout(
      setDoc(docRef, payload, { merge: true }),
      15000,
      'Gagal menyimpan pengumuman ke cloud (timeout)'
    );
    notifyStatus('connected');
  } catch (error: any) {
    console.warn('[Firestore] Notice saving announcement to cloud:', error?.message);
    if (!navigator.onLine) notifyStatus('offline');
    throw error;
  }
};

export const deleteAnnouncementFromCloud = async (announcementId: string): Promise<void> => {
  notifyStatus('syncing');
  try {
    const docRef = doc(db, 'announcements', announcementId);
    await withTimeout(deleteDoc(docRef), 12000, 'Cloud timeout');

    // Permanently record deletion in Cloud Firestore so all devices across network respect deletion
    const tombstoneRef = doc(db, 'deleted_announcements', announcementId);
    await withTimeout(
      setDoc(tombstoneRef, {
        id: announcementId,
        deletedAt: new Date().toISOString()
      }, { merge: true }),
      12000,
      'Cloud timeout'
    );
    notifyStatus('connected');
  } catch (error: any) {
    console.warn('[Firestore] Notice deleting announcement from cloud:', error?.message);
    if (!navigator.onLine) notifyStatus('offline');
    throw error;
  }
};

// ---------------------------------------------------------------------------
// 5. AUTO-SEED DATABASE IF EMPTY (INITIAL MIGRATION)
// ---------------------------------------------------------------------------

export const seedInitialDatabaseIfEmpty = async (
  initialStudents: Student[],
  initialUsers: SystemUser[],
  initialAnnouncements: Announcement[] = [],
  initialAttendances: DailyAttendance[] = []
): Promise<{ seeded: boolean; message: string }> => {
  try {
    const studentSnapshot = await withTimeout(getDocs(collection(db, 'students')), 10000, 'Cloud timeout');
    const userSnapshot = await withTimeout(getDocs(collection(db, 'system_users')), 10000, 'Cloud timeout');
    const annSnapshot = await withTimeout(getDocs(collection(db, 'announcements')), 10000, 'Cloud timeout');
    const deletedAnnSnapshot = await withTimeout(getDocs(collection(db, 'deleted_announcements')), 10000, 'Cloud timeout');
    const attSnapshot = await withTimeout(getDocs(collection(db, 'attendances')), 10000, 'Cloud timeout');

    const deletedAnnIds = new Set<string>();
    if (!deletedAnnSnapshot.empty) {
      deletedAnnSnapshot.forEach(d => deletedAnnIds.add(d.id));
    }

    const shouldSeedStudents = studentSnapshot.empty && initialStudents.length > 0;
    const shouldSeedUsers = userSnapshot.empty && initialUsers.length > 0;
    const shouldSeedAnnouncements = annSnapshot.empty && initialAnnouncements.length > 0;
    const shouldSeedAttendances = attSnapshot.empty && initialAttendances.length > 0;

    if (shouldSeedStudents || shouldSeedUsers || shouldSeedAnnouncements || shouldSeedAttendances) {
      notifyStatus('syncing');
      
      const batch = writeBatch(db);
      if (shouldSeedStudents) {
        initialStudents.forEach((student) => {
          const ref = doc(db, 'students', String(student.id));
          const payload = sanitizeForFirestore({
            id: Number(student.id),
            name: student.name || '',
            kelas: student.kelas || '',
            asrama: student.asrama || 'A',
            section: student.section || 'Brass',
            updatedAt: new Date().toISOString()
          });
          batch.set(ref, payload, { merge: true });
        });
      }
      
      if (shouldSeedUsers) {
        initialUsers.forEach((user) => {
          const ref = doc(db, 'system_users', user.id);
          const payload = sanitizeForFirestore({
            id: user.id,
            username: user.username,
            password: user.password,
            fullName: user.fullName,
            role: user.role,
            assignedSection: user.assignedSection || 'All',
            createdAt: user.createdAt,
            updatedAt: new Date().toISOString()
          });
          batch.set(ref, payload, { merge: true });
        });
      }

      if (shouldSeedAnnouncements) {
        initialAnnouncements.forEach((ann) => {
          if (!deletedAnnIds.has(ann.id)) {
            const ref = doc(db, 'announcements', ann.id);
            const payload = sanitizeForFirestore({
              ...ann,
              updatedAt: new Date().toISOString()
            });
            batch.set(ref, payload, { merge: true });
          }
        });
      }

      if (shouldSeedAttendances) {
        initialAttendances.forEach((att) => {
          const docId = att.id || `sesi-${att.date}`;
          const ref = doc(db, 'attendances', docId);
          const payload = sanitizeForFirestore({
            id: docId,
            date: att.date,
            sessionName: att.sessionName || 'Latihan Rutin',
            sessionType: att.sessionType || (att.sessionName?.toLowerCase().includes('sunnah') ? 'sunnah' : 'wajib'),
            scheduledTime: att.scheduledTime || null,
            location: att.location || null,
            targetSection: att.targetSection || null,
            description: att.description || null,
            isScheduled: att.isScheduled ?? false,
            isClosed: att.isClosed ?? false,
            closedAt: att.closedAt || null,
            closedBy: att.closedBy || null,
            isSubmitted: att.isSubmitted !== false,
            submittedAt: att.submittedAt || null,
            submittedBy: att.submittedBy || null,
            records: Array.isArray(att.records)
              ? att.records.map(r => ({
                  studentId: Number(r.studentId),
                  status: r.status || '',
                  note: r.note || ''
                }))
              : [],
            updatedAt: new Date().toISOString()
          });
          batch.set(ref, payload, { merge: true });
        });
      }

      await withTimeout(batch.commit(), 18000, 'Cloud timeout commit seed');
      notifyStatus('connected');
      return { seeded: true, message: `Inisialisasi database awal berhasil di-sinkronkan ke Cloud Firestore!` };
    }
    
    notifyStatus('connected');
    return { seeded: false, message: 'Data sudah tersedia di Cloud Database.' };
  } catch (error: any) {
    console.warn('[Firestore] Seed check notice:', error?.message);
    if (!navigator.onLine) {
      notifyStatus('offline', 'Perangkat sedang offline.');
    } else {
      notifyStatus('connected');
    }
    return { seeded: false, message: 'Sinkronisasi cloud otomatis berjalan di latar belakang.' };
  }
};

// ---------------------------------------------------------------------------
// 6. BULK SYNC ALL DATA TO CLOUD (MANUAL BACKUP / FORCE RE-SYNC)
// ---------------------------------------------------------------------------

export const uploadAllLocalDataToCloud = async (
  students: Student[],
  attendances: DailyAttendance[],
  users: SystemUser[],
  announcements: Announcement[] = []
): Promise<{ success: boolean; message: string }> => {
  notifyStatus('syncing');
  try {
    const existingSnap = await withTimeout(getDocs(collection(db, 'students')), 12000, 'Cloud timeout');
    const newIds = new Set(students.map(s => String(s.id)));
    const batch = writeBatch(db);

    // Purge student docs in cloud that no longer exist
    if (existingSnap && !existingSnap.empty) {
      existingSnap.forEach((docSnap) => {
        if (!newIds.has(docSnap.id)) {
          batch.delete(docSnap.ref);
        }
      });
    }

    students.forEach((student) => {
      const ref = doc(db, 'students', String(student.id));
      const payload = sanitizeForFirestore({
        id: Number(student.id),
        name: student.name || '',
        kelas: student.kelas || '',
        asrama: student.asrama || 'A',
        section: student.section || 'Brass',
        updatedAt: new Date().toISOString()
      });
      batch.set(ref, payload, { merge: true });
    });

    users.forEach((user) => {
      const ref = doc(db, 'system_users', user.id);
      const payload = sanitizeForFirestore({
        id: user.id,
        username: user.username,
        password: user.password,
        fullName: user.fullName,
        role: user.role,
        assignedSection: user.assignedSection || 'All',
        createdAt: user.createdAt,
        updatedAt: new Date().toISOString()
      });
      batch.set(ref, payload, { merge: true });
    });

    attendances.forEach((att) => {
      const docId = att.id || `sesi-${att.date}`;
      const ref = doc(db, 'attendances', docId);
      const payload = sanitizeForFirestore({
        id: docId,
        date: att.date,
        sessionName: att.sessionName || 'Latihan Rutin',
        sessionType: att.sessionType || (att.sessionName?.toLowerCase().includes('sunnah') ? 'sunnah' : 'wajib'),
        scheduledTime: att.scheduledTime || null,
        location: att.location || null,
        targetSection: att.targetSection || null,
        description: att.description || null,
        isScheduled: att.isScheduled ?? false,
        isClosed: att.isClosed ?? false,
        closedAt: att.closedAt || null,
        closedBy: att.closedBy || null,
        isSubmitted: att.isSubmitted !== false,
        submittedAt: att.submittedAt || null,
        submittedBy: att.submittedBy || null,
        records: Array.isArray(att.records)
          ? att.records.map(r => ({
              studentId: Number(r.studentId),
              status: r.status || '',
              note: r.note || ''
            }))
          : [],
        updatedAt: new Date().toISOString()
      });
      batch.set(ref, payload, { merge: true });
    });

    if (announcements && announcements.length > 0) {
      announcements.forEach((ann) => {
        const ref = doc(db, 'announcements', ann.id);
        const payload = sanitizeForFirestore({
          ...ann,
          updatedAt: new Date().toISOString()
        });
        batch.set(ref, payload, { merge: true });
      });
    }

    await withTimeout(batch.commit(), 20000, 'Koneksi timeout');
    notifyStatus('connected');
    return { 
      success: true, 
      message: `Seluruh data (${students.length} anggota, ${users.length} akun, ${attendances.length} sesi, ${announcements.length} pengumuman) berhasil disinkronkan ke Cloud Database!` 
    };
  } catch (error: any) {
    console.warn('[Firestore] Bulk upload notice:', error?.message);
    if (!navigator.onLine) {
      notifyStatus('offline', 'Koneksi internet tidak tersedia.');
    }
    return { 
      success: false, 
      message: error?.message || 'Gagal sinkronisasi ke cloud. Silakan periksa koneksi internet.'
    };
  }
};
