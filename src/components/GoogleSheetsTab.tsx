import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, ExternalLink, RefreshCw, CheckCircle2, 
  AlertCircle, ShieldCheck, Link2, Sparkles, LogOut, Check,
  Globe, Copy
} from 'lucide-react';
import { User } from 'firebase/auth';
import { 
  signInWithGoogle, 
  signOutGoogle, 
  initGoogleAuth, 
  getGoogleAccessToken 
} from '../services/googleAuth';
import { 
  createAttendanceSpreadsheet, 
  syncAllDataToGoogleSheet, 
  SheetConfig 
} from '../services/googleSheets';
import { ConfirmModal } from './ConfirmModal';

interface GoogleSheetsTabProps {
  students: Array<{ id: number; name: string; kelas: string; asrama: string; section: string }>;
  attendances: Array<{
    id?: string;
    date: string;
    sessionName?: string;
    isSubmitted?: boolean;
    submittedAt?: string | null;
    submittedBy?: string | null;
    records: Array<{ studentId: number; status: string; note: string }>;
  }>;
  recapList: Array<{
    studentId: number;
    name: string;
    kelas: string;
    asrama: string;
    section: string;
    hadirCount: number;
    izinCount: number;
    sakitCount: number;
    alfaCount: number;
    percentage: number;
  }>;
  triggerToast: (msg: string) => void;
}

export const GoogleSheetsTab: React.FC<GoogleSheetsTabProps> = ({
  students,
  attendances,
  recapList,
  triggerToast
}) => {
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Config state
  const [sheetConfig, setSheetConfig] = useState<SheetConfig>(() => {
    const saved = localStorage.getItem('pgt_sheet_config');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      spreadsheetId: '',
      spreadsheetTitle: "PGT Mu'allimin - Presensi & Master Anggota",
      spreadsheetUrl: '',
      lastSyncTime: null,
      autoSync: false
    };
  });

  const [inputSheetId, setInputSheetId] = useState(sheetConfig.spreadsheetId);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const handleCopyGithubDomain = () => {
    navigator.clipboard.writeText('symzck.github.io');
    setCopiedDomain(true);
    triggerToast('Domain GitHub "symzck.github.io" berhasil disalin ke clipboard!');
    setTimeout(() => setCopiedDomain(false), 3000);
  };

  useEffect(() => {
    localStorage.setItem('pgt_sheet_config', JSON.stringify(sheetConfig));
  }, [sheetConfig]);

  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (user) => setGoogleUser(user),
      () => setGoogleUser(null)
    );
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await signInWithGoogle();
      setGoogleUser(result.user);
      triggerToast(`Berhasil login Google: ${result.user.displayName || result.user.email}`);
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      triggerToast(`Gagal login Google: ${err.message || 'Coba lagi'}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await signOutGoogle();
    setGoogleUser(null);
    triggerToast('Telah keluar dari akun Google.');
  };

  const handleCreateNewSheet = async () => {
    if (!googleUser || !getGoogleAccessToken()) {
      triggerToast('Silakan login dengan akun Google terlebih dahulu.');
      return;
    }

    setIsCreatingSheet(true);
    try {
      const created = await createAttendanceSpreadsheet();
      const updatedConfig: SheetConfig = {
        ...sheetConfig,
        spreadsheetId: created.spreadsheetId,
        spreadsheetTitle: created.title,
        spreadsheetUrl: created.spreadsheetUrl,
        lastSyncTime: new Date().toLocaleString('id-ID')
      };
      setSheetConfig(updatedConfig);
      setInputSheetId(created.spreadsheetId);

      // Immediately sync initial data
      const submittedOnly = attendances
        .filter(a => a.isSubmitted)
        .map(a => ({
          ...a,
          id: a.id || `sesi-${a.date}`
        }));

      await syncAllDataToGoogleSheet(created.spreadsheetId, students, submittedOnly, recapList);
      triggerToast('Google Spreadsheet baru berhasil dibuat dan disinkronkan!');
    } catch (err: any) {
      console.error('Create Sheet Error:', err);
      triggerToast(`Error: ${err.message || 'Gagal membuat Google Sheet'}`);
    } finally {
      setIsCreatingSheet(false);
    }
  };

  const handleSaveCustomSheetId = () => {
    if (!inputSheetId.trim()) {
      triggerToast('Masukkan Spreadsheet ID atau URL yang valid.');
      return;
    }

    let cleanId = inputSheetId.trim();
    // Support full URL input: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
    const match = cleanId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      cleanId = match[1];
    }

    const updatedConfig: SheetConfig = {
      ...sheetConfig,
      spreadsheetId: cleanId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${cleanId}/edit`
    };
    setSheetConfig(updatedConfig);
    triggerToast('ID Google Spreadsheet berhasil disimpan.');
  };

  const executeSync = async () => {
    if (!sheetConfig.spreadsheetId) {
      triggerToast('Pilih atau buat Google Spreadsheet terlebih dahulu.');
      return;
    }

    setIsSyncing(true);
    setIsConfirmModalOpen(false);

    try {
      const submittedOnly = attendances
        .filter(a => a.isSubmitted)
        .map(a => ({
          ...a,
          id: a.id || `sesi-${a.date}`
        }));

      const res = await syncAllDataToGoogleSheet(
        sheetConfig.spreadsheetId,
        students,
        submittedOnly,
        recapList
      );

      setSheetConfig(prev => ({
        ...prev,
        lastSyncTime: new Date().toLocaleString('id-ID')
      }));

      triggerToast(`Sinkronisasi Sukses: ${res.rowsPresensi} baris presensi & ${res.rowsRekap} baris rekap tersinkron!`);
    } catch (err: any) {
      console.error('Sync Error:', err);
      triggerToast(`Gagal sinkronisasi: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const submittedSessionsCount = attendances.filter(a => a.isSubmitted).length;

  return (
    <div className="space-y-6 pb-20 md:pb-6 text-left">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-800/40 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold mb-3">
              <FileSpreadsheet size={14} />
              <span>Integrasi Resmi Google Workspace</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Sinkronisasi Langsung Google Sheets
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Hubungkan sistem presensi PGT Mu'allimin langsung ke Google Sheets Anda. 
              Data presensi resmi, rekapitulasi nilai kehadiran, dan master data pemain tersinkron secara real-time ke akun Google Drive Anda.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {googleUser ? (
              <div className="bg-slate-950/80 border border-emerald-500/40 px-4 py-2 rounded-2xl flex items-center gap-3">
                {googleUser.photoURL ? (
                  <img src={googleUser.photoURL} alt="Avatar" className="w-9 h-9 rounded-xl border border-emerald-500/50" />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-emerald-700 font-bold flex items-center justify-center text-white text-xs">
                    {(googleUser.displayName || 'G')[0]}
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{googleUser.displayName || 'Akun Terhubung'}</span>
                    <ShieldCheck size={14} className="text-emerald-400" />
                  </div>
                  <div className="text-[11px] text-slate-400">{googleUser.email}</div>
                </div>
                <button
                  type="button"
                  onClick={handleGoogleLogout}
                  title="Keluar Akun Google"
                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors ml-1"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="px-5 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center gap-3 shadow-xl transition-all active:scale-95 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>{isLoggingIn ? 'Menghubungkan...' : 'Sign in with Google'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Spreadsheet Connection & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Spreadsheet Setup */}
        <div className="lg:col-span-2 space-y-5">
          {/* Card 1: Setup Spreadsheet */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Link2 size={18} className="text-emerald-400" />
                <span>Koneksi Google Spreadsheet</span>
              </h3>
              {sheetConfig.spreadsheetId && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1">
                  <Check size={12} /> Terhubung
                </span>
              )}
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  ID Spreadsheet / URL Google Sheets
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputSheetId}
                    onChange={(e) => setInputSheetId(e.target.value)}
                    placeholder="Contoh: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms atau paste URL lengkap"
                    className="flex-1 text-xs px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleSaveCustomSheetId}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
                  >
                    Simpan ID
                  </button>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleCreateNewSheet}
                  disabled={isCreatingSheet || !googleUser}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950 flex items-center gap-2 transition-all active:scale-95"
                >
                  <Sparkles size={16} />
                  <span>{isCreatingSheet ? 'Sedang Membuat Spreadsheet...' : '⚡ Buat Spreadsheet Baru Otomatis'}</span>
                </button>

                {sheetConfig.spreadsheetUrl && (
                  <a
                    href={sheetConfig.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-2 border border-slate-700 transition-colors"
                  >
                    <ExternalLink size={15} />
                    <span>Buka di Google Sheets</span>
                  </a>
                )}
              </div>
            </div>

            {/* Structure Preview Info */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 text-xs space-y-2 mt-4">
              <div className="font-bold text-slate-300">Format Tab yang Otomatis Dibuat di Google Sheets:</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="font-bold text-emerald-400">1. Presensi_Resmi</div>
                  <div className="text-slate-400 mt-0.5">Seluruh sesi absen ter-submit beserta catatan halangan.</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="font-bold text-emerald-400">2. Rekap_Kehadiran</div>
                  <div className="text-slate-400 mt-0.5">Persentase disiplin, total hadir/izin/sakit/alfa per anggota.</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="font-bold text-emerald-400">3. Master_Anggota</div>
                  <div className="text-slate-400 mt-0.5">Data induk nama, kelas, asrama, & section pemain.</div>
                </div>
              </div>
            </div>

            {/* GitHub Domain & OAuth Settings Card */}
            <div className="bg-slate-950/80 border border-purple-500/30 rounded-2xl p-4 text-xs space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-white">
                  <Globe size={15} className="text-purple-400" />
                  <span>Domain GitHub Pages & Authorized Domains</span>
                </div>
                <span className="text-[10px] font-mono bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800/40">
                  GitHub Pages
                </span>
              </div>

              <p className="text-slate-400 text-[11px] leading-relaxed">
                Jika aplikasi dijalankan melalui domain GitHub Pages, pastikan domain berikut telah didaftarkan pada 
                <strong className="text-purple-300"> Firebase Console &gt; Authentication &gt; Settings &gt; Authorized Domains </strong>
                agar fitur Google Sign-in dan Google Sheets berjalan mulus:
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-mono text-[11px]">Domain:</span>
                  <code className="text-emerald-400 font-bold font-mono text-xs select-all">
                    symzck.github.io
                  </code>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyGithubDomain}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
                  >
                    {copiedDomain ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copiedDomain ? 'Tersalin!' : 'Salin Domain'}</span>
                  </button>

                  <a
                    href="https://symzck.github.io/absen/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-purple-900/40 hover:bg-purple-900/70 text-purple-300 text-[11px] font-semibold flex items-center gap-1 transition-colors border border-purple-700/40"
                  >
                    <ExternalLink size={12} />
                    <span>Buka URL</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sync Center */}
        <div className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <RefreshCw size={18} className="text-emerald-400" />
              <span>Pusat Sinkronisasi Data</span>
            </h3>

            {/* Status Info */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-300">
                <span className="text-slate-400">Status Akun:</span>
                <span className={googleUser ? 'text-emerald-400 font-bold' : 'text-amber-400 font-medium'}>
                  {googleUser ? 'Terhubung' : 'Belum Login'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-300">
                <span className="text-slate-400">Sesi Ter-submit:</span>
                <span className="font-bold text-white">{submittedSessionsCount} Sesi Resmi</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-300">
                <span className="text-slate-400">Total Anggota:</span>
                <span className="font-bold text-white">{students.length} Pemain</span>
              </div>
              <div className="flex justify-between py-1.5 text-slate-300">
                <span className="text-slate-400">Terakhir Sinkron:</span>
                <span className="font-mono text-emerald-300 text-[11px]">
                  {sheetConfig.lastSyncTime || 'Belum pernah'}
                </span>
              </div>
            </div>

            {/* Auto-Sync Toggle */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">Auto-Sync Saat Submit</div>
                <div className="text-[11px] text-slate-400">Sync otomatis saat presensi difinalisasi</div>
              </div>
              <input
                type="checkbox"
                checked={sheetConfig.autoSync}
                onChange={(e) => setSheetConfig(prev => ({ ...prev, autoSync: e.target.checked }))}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            {/* Trigger Sync Button with confirmation requirement */}
            <button
              type="button"
              onClick={() => {
                if (!googleUser) {
                  triggerToast('Silakan login ke akun Google terlebih dahulu.');
                  return;
                }
                if (!sheetConfig.spreadsheetId) {
                  triggerToast('Silakan tentukan atau buat Google Spreadsheet terlebih dahulu.');
                  return;
                }
                setIsConfirmModalOpen(true);
              }}
              disabled={isSyncing || !sheetConfig.spreadsheetId || !googleUser}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xl shadow-emerald-950 transition-all active:scale-95 cursor-pointer"
            >
              <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal before mutating data (MANDATORY per workspace skill) */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="Konfirmasi Sinkronisasi Google Sheets"
        message="Anda akan memperbarui data pada spreadsheet Google Drive Anda. Operasi ini akan menulis seluruh data presensi resmi yang telah disubmit dan data rekapitulasi anggota."
        details={[
          `Spreadsheet ID: ${sheetConfig.spreadsheetId}`,
          `Total Sesi Resmi: ${submittedSessionsCount} sesi`,
          `Total Anggota: ${students.length} orang pemain`,
          'Tab terpengaruh: Presensi_Resmi, Rekap_Kehadiran, Master_Anggota'
        ]}
        confirmText="Ya, Sinkronkan Data"
        cancelText="Batal"
        isLoading={isSyncing}
        onConfirm={executeSync}
        onCancel={() => setIsConfirmModalOpen(false)}
      />
    </div>
  );
};
