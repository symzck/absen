import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Inisialisasi Firebase Analytics jika didukung pada environment browser
export const analyticsPromise = typeof window !== 'undefined'
  ? isSupported().then((supported) => (supported ? getAnalytics(app) : null)).catch(() => null)
  : Promise.resolve(null);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');
// Additional scopes requested
provider.addScope('https://www.googleapis.com/auth/drive.readonly');
provider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');

// In-memory token cache (DO NOT store in localStorage per security guidelines)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const signInWithGoogle = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    
    // Safety timeout of 20 seconds so it never hangs indefinitely
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Koneksi timeout (20 detik). Jika jendela pop-up Google tidak muncul, kemungkinan diblokir oleh browser atau terhalang di dalam frame preview. Silakan izinkan pop-up atau buka aplikasi di tab baru.'));
      }, 20000);
    });

    const result = await Promise.race([
      signInWithPopup(auth, provider),
      timeoutPromise
    ]);

    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Akses token Google tidak diperoleh.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (err: any) {
    if (err?.code === 'auth/popup-blocked') {
      throw new Error('Jendela pop-up Google diblokir browser! Silakan klik ikon pop-up di bilah URL browser Anda untuk mengizinkannya, atau buka di tab baru.');
    }
    if (err?.code === 'auth/popup-closed-by-user') {
      throw new Error('Jendela login ditutup sebelum proses selesai.');
    }
    if (err?.code === 'auth/cancelled-popup-request') {
      throw new Error('Permintaan login dibatalkan karena ada aksi baru.');
    }
    throw err;
  } finally {
    isSigningIn = false;
  }
};

export const getGoogleAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setGoogleAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const signOutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};
