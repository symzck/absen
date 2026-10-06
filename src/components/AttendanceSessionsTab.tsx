import React, { useState } from 'react';
import { 
  Calendar, Clock, UserCheck, Edit3, Trash2, CheckCircle2, 
  AlertCircle, ChevronRight, Save, X, RotateCcw, Send, Shield, Sparkles, Filter,
  Lock, Unlock, CheckSquare, AlertTriangle, MapPin, Layers, Timer, Play, Plus, FileText
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { calculateSessionCountdown, sortSessionsByClosest } from './OfficerSubmissionGuide';

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

export interface AttendanceSession {
  id?: string;
  date: string;
  sessionName?: string;
  sessionType?: 'wajib' | 'sunnah';
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

interface AttendanceSessionsTabProps {
  sessions: AttendanceSession[];
  students: Student[];
  currentUserName: string;
  isAdmin?: boolean;
  onUpdateSession: (updatedSession: AttendanceSession) => void;
  onDeleteSession: (sessionIdentifier: string) => void;
  onSubmitSession: (sessionIdentifier: string) => void;
  onSelectSessionDate?: (dateStr: string) => void;
  onOpenScheduleModal?: () => void;
  triggerToast: (msg: string, type?: 'success' | 'warning' | 'info') => void;
}

export const AttendanceSessionsTab: React.FC<AttendanceSessionsTabProps> = ({
  sessions,
  students,
  currentUserName,
  isAdmin = false,
  onUpdateSession,
  onDeleteSession,
  onSubmitSession,
  onSelectSessionDate,
  onOpenScheduleModal,
  triggerToast
}) => {
  const [filterType, setFilterType] = useState<'all' | 'active' | 'closed' | 'expired' | 'draft'>('all');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editSessionData, setEditSessionData] = useState<AttendanceSession | null>(null);
  const [sessionSearchQuery, setSessionSearchQuery] = useState('');
  
  // Deletion modal
  const [sessionToDelete, setSessionToDelete] = useState<AttendanceSession | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Close All Expired Confirmation Modal
  const [isCloseAllExpiredModalOpen, setIsCloseAllExpiredModalOpen] = useState(false);
  // Close All Finished Confirmation Modal
  const [isCloseAllFinishedModalOpen, setIsCloseAllFinishedModalOpen] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  // Available sessions:
  // Admin: melihat semua sesi untuk pengelolaan & arsip
  // Petugas: melihat sesi terdekat (Hari H / Jadwal Mendatang) serta sesi yang telah selesai
  const availableSessions = sortSessionsByClosest(
    isAdmin ? sessions : sessions.filter(s => s.date >= todayStr || s.isSubmitted === true || (s.records && s.records.length > 0))
  );

  // Filter sessions based on tab & query
  const filteredSessions = availableSessions.filter(s => {
    const isClosed = s.isClosed === true;
    const isExpired = s.date < todayStr && !isClosed;
    const isSubmitted = s.isSubmitted !== false;

    if (filterType === 'active' && (isClosed || isExpired)) return false;
    if (filterType === 'closed' && !isClosed) return false;
    if (filterType === 'expired' && !isExpired) return false;
    if (filterType === 'draft' && isSubmitted) return false;

    if (sessionSearchQuery) {
      const matchDate = s.date.includes(sessionSearchQuery);
      const matchName = (s.sessionName || '').toLowerCase().includes(sessionSearchQuery.toLowerCase());
      const matchOfficer = (s.submittedBy || '').toLowerCase().includes(sessionSearchQuery.toLowerCase());
      return matchDate || matchName || matchOfficer;
    }
    return true;
  });

  const expiredCount = sessions.filter(s => s.date < todayStr && !s.isClosed).length;
  const finishedUnclosedCount = sessions.filter(s => s.isSubmitted !== false && !s.isClosed).length;

  const handleStartEdit = (session: AttendanceSession) => {
    if (!isAdmin && session.isClosed) {
      triggerToast('Sesi telah ditutup & terkunci. Hanya Administrator yang dapat mengubah data.', 'warning');
      return;
    }
    const sessionId = session.id || `sesi-${session.date}`;
    setEditingSessionId(sessionId);
    // Clone deep copy
    setEditSessionData(JSON.parse(JSON.stringify({
      ...session,
      id: sessionId,
      sessionName: session.sessionName || 'Latihan Rutin'
    })));
  };

  const handleSaveEditedSession = () => {
    if (!editSessionData) return;
    onUpdateSession(editSessionData);
    setEditingSessionId(null);
    setEditSessionData(null);
    triggerToast(`Data presensi tanggal ${editSessionData.date} berhasil diperbarui!`, 'success');
  };

  const handleStatusChangeInEdit = (studentId: number, status: string) => {
    if (!editSessionData) return;
    setEditSessionData(prev => {
      if (!prev) return prev;
      const records = [...prev.records];
      const idx = records.findIndex(r => r.studentId === studentId);
      if (idx === -1) {
        if (status) {
          records.push({ studentId, status, note: '' });
        }
      } else {
        if (!status) {
          records.splice(idx, 1);
        } else {
          records[idx] = { ...records[idx], status };
        }
      }
      return { ...prev, records };
    });
  };

  const handleNoteChangeInEdit = (studentId: number, note: string) => {
    if (!editSessionData) return;
    setEditSessionData(prev => {
      if (!prev) return prev;
      const records = [...prev.records];
      const idx = records.findIndex(r => r.studentId === studentId);
      if (idx === -1) {
        records.push({ studentId, status: 'Hadir', note });
      } else {
        records[idx] = { ...records[idx], note };
      }
      return { ...prev, records };
    });
  };

  const handleToggleCloseSession = (session: AttendanceSession) => {
    if (!isAdmin) {
      triggerToast('Hanya Administrator yang memiliki wewenang untuk membuka atau menutup sesi.', 'warning');
      return;
    }
    const isCurrentlyClosed = session.isClosed === true;
    const nowStr = new Date().toLocaleString('id-ID');
    const updated: AttendanceSession = {
      ...session,
      id: session.id || `sesi-${session.date}`,
      isClosed: !isCurrentlyClosed,
      closedAt: !isCurrentlyClosed ? nowStr : null,
      closedBy: !isCurrentlyClosed ? currentUserName : null
    };
    onUpdateSession(updated);
    triggerToast(
      !isCurrentlyClosed
        ? `Sesi ${session.date} (${session.sessionName || 'Latihan'}) resmi DITUTUP / SELESAI.`
        : `Sesi ${session.date} DIBUKA KEMBALI untuk pengisian.`,
      'info'
    );
  };

  const handleCloseAllExpiredConfirm = () => {
    if (!isAdmin) return;
    const nowStr = new Date().toLocaleString('id-ID');
    let closedCount = 0;
    sessions.forEach(s => {
      if (s.date < todayStr && !s.isClosed) {
        closedCount++;
        onUpdateSession({
          ...s,
          id: s.id || `sesi-${s.date}`,
          isClosed: true,
          closedAt: nowStr,
          closedBy: currentUserName
        });
      }
    });
    setIsCloseAllExpiredModalOpen(false);
    triggerToast(`Berhasil menutup ${closedCount} sesi latihan yang telah expired/lewat!`, 'success');
  };

  const handleCloseAllFinishedConfirm = () => {
    if (!isAdmin) return;
    const nowStr = new Date().toLocaleString('id-ID');
    let closedCount = 0;
    sessions.forEach(s => {
      if (s.isSubmitted !== false && !s.isClosed) {
        closedCount++;
        onUpdateSession({
          ...s,
          id: s.id || `sesi-${s.date}`,
          isClosed: true,
          closedAt: nowStr,
          closedBy: currentUserName
        });
      }
    });
    setIsCloseAllFinishedModalOpen(false);
    triggerToast(`Berhasil mengunci & menutup ${closedCount} sesi yang telah ter-submit!`, 'success');
  };

  const handleToggleDraftSubmitted = (session: AttendanceSession) => {
    if (!isAdmin && session.isClosed) {
      triggerToast('Sesi telah ditutup & terkunci.', 'warning');
      return;
    }
    const isSubmitted = session.isSubmitted !== false;
    const updated: AttendanceSession = {
      ...session,
      id: session.id || `sesi-${session.date}`,
      isSubmitted: !isSubmitted,
      submittedAt: !isSubmitted ? new Date().toLocaleString('id-ID') : null,
      submittedBy: !isSubmitted ? currentUserName : session.submittedBy
    };
    onUpdateSession(updated);
    triggerToast(
      !isSubmitted
        ? `Sesi ${session.date} resmi disubmit ke Rekapitulasi!`
        : `Sesi ${session.date} dikembalikan ke status Draf (tidak masuk rekap).`,
      'info'
    );
  };

  const confirmDelete = () => {
    if (!isAdmin) {
      triggerToast('Hanya Administrator yang memiliki wewenang untuk menghapus sesi.', 'warning');
      return;
    }
    if (!sessionToDelete) return;
    const sId = sessionToDelete.id || `sesi-${sessionToDelete.date}`;
    onDeleteSession(sId);
    setIsDeleteModalOpen(false);
    setSessionToDelete(null);
    triggerToast(`Sesi presensi tanggal ${sessionToDelete.date} berhasil dihapus.`);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6 text-left">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-purple-900/40 text-purple-300 border border-purple-700/40 text-[11px] font-semibold mb-2">
              <Sparkles size={12} className="text-amber-400" /> 
              Jadwal & Agenda Sesi Latihan Korps
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Manajemen & Jadwal Sesi Latihan ({sessions.length} Sesi)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Pantau seluruh agenda sesi latihan, countdown pelaksanaan hari H, status penguncian sesi, dan kelola pengisian presensi korps.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && expiredCount > 0 && (
              <button
                type="button"
                onClick={() => setIsCloseAllExpiredModalOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-200 flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                title="Tutup semua sesi yang tanggalnya sudah lewat"
              >
                <Lock size={13} className="text-rose-400" />
                <span>Tutup {expiredCount} Sesi Expired</span>
              </button>
            )}

            {isAdmin && finishedUnclosedCount > 0 && (
              <button
                type="button"
                onClick={() => setIsCloseAllFinishedModalOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-200 flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                title="Tutup semua sesi yang sudah disubmit"
              >
                <Lock size={13} className="text-indigo-400" />
                <span>Tutup {finishedUnclosedCount} Sesi Selesai</span>
              </button>
            )}

            {onOpenScheduleModal && (
              <button
                type="button"
                onClick={onOpenScheduleModal}
                className="px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>Jadwalkan Sesi Baru</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills & Search */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-3 border-t border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              Semua ({availableSessions.length})
            </button>

            <button
              type="button"
              onClick={() => setFilterType('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterType === 'active'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              Sesi Aktif ({availableSessions.filter(s => !s.isClosed && s.date >= todayStr).length})
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setFilterType('closed')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterType === 'closed'
                    ? 'bg-slate-700 text-white shadow-md'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                Ditutup / Selesai ({sessions.filter(s => s.isClosed).length})
              </button>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => setFilterType('expired')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterType === 'expired'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                Expired / Lewat ({sessions.filter(s => s.date < todayStr && !s.isClosed).length})
              </button>
            )}

            <button
              type="button"
              onClick={() => setFilterType('draft')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterType === 'draft'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              Draf ({availableSessions.filter(s => s.isSubmitted === false).length})
            </button>
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Cari sesi / tanggal / petugas..."
              value={sessionSearchQuery}
              onChange={(e) => setSessionSearchQuery(e.target.value)}
              className="w-full text-xs px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* If currently editing a session (Admin Only) */}
      {isAdmin && editingSessionId && editSessionData ? (
        <div className="bg-slate-900 border-2 border-purple-500/50 rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 mb-1">
                <Sparkles size={14} />
                <span>MODE EDIT & KOREKSI ABSEN (ADMINISTRATOR)</span>
              </div>
              <h3 className="text-xl font-black text-white">
                Edit Sesi: {editSessionData.sessionName || 'Latihan Rutin'} ({editSessionData.date})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ubah status kehadiran masing-masing siswa dan simpan perubahan untuk memperbarui database.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingSessionId(null);
                  setEditSessionData(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEditedSession}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-purple-950 transition-all active:scale-95 cursor-pointer"
              >
                <Save size={16} />
                <span>Simpan Perubahan Koreksi</span>
              </button>
            </div>
          </div>

          {/* Session Metadata Edit Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nama Sesi / Kegiatan
              </label>
              <input
                type="text"
                value={editSessionData.sessionName || ''}
                onChange={(e) => setEditSessionData({ ...editSessionData, sessionName: e.target.value })}
                className="w-full text-xs px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="Contoh: Latihan Pagi, Gladi Bersih, dll"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tanggal Sesi
              </label>
              <input
                type="date"
                value={editSessionData.date}
                onChange={(e) => setEditSessionData({ ...editSessionData, date: e.target.value })}
                className="w-full text-xs px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Students List in Edit Mode */}
          <div className="overflow-x-auto max-h-[500px] border border-slate-800 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950 text-slate-400 font-bold sticky top-0 z-10 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Nama Pemain</th>
                  <th className="py-3 px-4">Section / Kelas</th>
                  <th className="py-3 px-4 text-center">Status Kehadiran</th>
                  <th className="py-3 px-4 hidden sm:table-cell">Catatan Halangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {students.map(student => {
                  const rec = editSessionData.records.find(r => r.studentId === student.id) || {
                    status: '',
                    note: ''
                  };

                  return (
                    <tr key={student.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-4 font-bold text-white align-top sm:align-middle">
                        <div>{student.name}</div>
                        {/* Input Keterangan Khusus Mobile */}
                        <div className="sm:hidden mt-2 pt-1.5 border-t border-slate-800/70 font-normal">
                          {rec.status === 'Izin' ? (
                            <div className="space-y-1.5">
                              <div className="text-[10px] font-bold text-blue-400 flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                  <FileText size={11} /> Alasan Izin:
                                </span>
                                {rec.note && (
                                  <button
                                    type="button"
                                    onClick={() => handleNoteChangeInEdit(student.id, '')}
                                    className="text-[9px] text-slate-400 hover:text-rose-400"
                                  >
                                    Reset
                                  </button>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-1.5">
                                {['Pulang', 'Organisasi', 'Acara Sekolah', 'Acara Keluarga'].map(reason => {
                                  const isSelected = rec.note === reason;
                                  return (
                                    <button
                                      key={reason}
                                      type="button"
                                      onClick={() => handleNoteChangeInEdit(student.id, isSelected ? '' : reason)}
                                      className={`text-[10px] py-1.5 px-2 rounded-lg font-bold border transition-all text-center ${
                                        isSelected
                                          ? 'bg-blue-600 border-blue-400 text-white shadow-sm ring-1 ring-blue-400'
                                          : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-blue-500/50 hover:text-blue-300'
                                      }`}
                                    >
                                      {reason}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 whitespace-nowrap">
                                  <FileText size={11} className={rec.note ? "text-amber-400" : "text-slate-500"} />
                                  <span>Ket:</span>
                                </span>
                                <div className="relative flex-1">
                                  <input
                                    type="text"
                                    value={rec.note || ''}
                                    onChange={(e) => handleNoteChangeInEdit(student.id, e.target.value)}
                                    placeholder={
                                      rec.status === 'Sakit'
                                        ? 'Ket sakit (cth: Demam, UKS)...'
                                        : 'Keterangan...'
                                    }
                                    className={`w-full text-xs px-2.5 py-1.5 rounded-lg bg-slate-950 border transition-all ${
                                      rec.note 
                                        ? 'border-amber-500/50 text-amber-200' 
                                        : 'border-slate-800 text-slate-200 placeholder-slate-600 focus:border-amber-500/60'
                                    } focus:outline-none focus:ring-1 focus:ring-amber-500/50 pr-6`}
                                  />
                                  {rec.note && (
                                    <button
                                      type="button"
                                      onClick={() => handleNoteChangeInEdit(student.id, '')}
                                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-400 p-0.5"
                                      title="Hapus keterangan"
                                    >
                                      <X size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>
                              {rec.status === 'Sakit' && !rec.note && (
                                <div className="flex flex-wrap gap-1 mt-1 pl-8">
                                  {['Demam', 'UKS', 'Flu/Batuk', 'Cedera'].map(preset => (
                                    <button
                                      key={preset}
                                      type="button"
                                      onClick={() => handleNoteChangeInEdit(student.id, preset)}
                                      className="text-[9.5px] px-1.5 py-0.5 rounded-md bg-slate-800/90 text-amber-300 hover:bg-amber-950/60 border border-amber-900/40"
                                    >
                                      +{preset}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-slate-300 align-top sm:align-middle">
                        <span className="text-amber-400 font-semibold">{student.section}</span> · Kls {student.kelas} · Asr {student.asrama}
                      </td>
                      <td className="py-2.5 px-4 align-top sm:align-middle">
                        <div className="flex items-center justify-center gap-1">
                          {[
                            { key: 'Hadir', bg: 'bg-emerald-600 text-white', label: 'H' },
                            { key: 'Sakit', bg: 'bg-amber-600 text-white', label: 'S' },
                            { key: 'Izin', bg: 'bg-blue-600 text-white', label: 'I' },
                            { key: 'Alfa', bg: 'bg-rose-600 text-white', label: 'A' }
                          ].map(st => (
                            <button
                              type="button"
                              key={st.key}
                              onClick={() => handleStatusChangeInEdit(student.id, rec.status === st.key ? '' : st.key)}
                              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                rec.status === st.key
                                  ? `${st.bg} shadow-md`
                                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                              }`}
                              title={st.key}
                            >
                              {st.key}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => handleStatusChangeInEdit(student.id, '')}
                            title="Batalkan status presensi siswa ini"
                            className={`px-2 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                              !rec.status
                                ? 'bg-slate-900 text-slate-500 border border-slate-800/80 cursor-default opacity-60'
                                : 'text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/30'
                            }`}
                          >
                            Batal
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 hidden sm:table-cell align-middle">
                        {rec.status === 'Izin' ? (
                          <select
                            value={rec.note || ''}
                            onChange={(e) => handleNoteChangeInEdit(student.id, e.target.value)}
                            className={`w-full text-xs px-2.5 py-1.5 rounded-xl border font-semibold cursor-pointer transition-all ${
                              rec.note 
                                ? 'bg-blue-950/50 border-blue-600 text-blue-200' 
                                : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-600'
                            }`}
                          >
                            <option value="">-- Pilih Alasan Izin --</option>
                            <option value="Pulang">Pulang</option>
                            <option value="Organisasi">Organisasi</option>
                            <option value="Acara Sekolah">Acara Sekolah</option>
                            <option value="Acara Keluarga">Acara Keluarga</option>
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={rec.note || ''}
                            onChange={(e) => handleNoteChangeInEdit(student.id, e.target.value)}
                            placeholder={rec.status === 'Sakit' ? 'Ket sakit (cth: Demam, UKS)...' : 'Keterangan halangan...'}
                            className="w-full text-xs px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Sessions List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSessions.length === 0 ? (
          <div className="col-span-full bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center space-y-2">
            <AlertCircle size={36} className="mx-auto text-slate-500" />
            <h4 className="text-base font-bold text-white">Tidak Ada Sesi yang Sesuai dengan Filter</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {isAdmin 
                ? 'Gunakan tombol "Semua" atau jadwalkan sesi baru melalui tombol di atas.'
                : 'Hari ini tidak ada sesi latihan marching band. Sesi untuk petugas hanya ditampilkan ketika Hari H pelaksanaan.'}
            </p>
          </div>
        ) : (
          filteredSessions.map(session => {
            const sId = session.id || `sesi-${session.date}`;
            const isSubmitted = session.isSubmitted !== false;
            const isClosed = session.isClosed === true;
            const isExpired = session.date < todayStr && !isClosed;
            const countdown = calculateSessionCountdown(session.date, session.scheduledTime);
            const isUpcoming = countdown.isUpcoming;

            const hadirCount = session.records.filter(r => r.status === 'Hadir').length;
            const sakitCount = session.records.filter(r => r.status === 'Sakit').length;
            const izinCount = session.records.filter(r => r.status === 'Izin').length;
            const alfaCount = session.records.filter(r => r.status === 'Alfa').length;

            return (
              <div
                key={sId}
                className={`border rounded-3xl p-5 shadow-xl transition-all ${
                  isClosed
                    ? 'bg-slate-950 border-slate-800 opacity-90'
                    : isUpcoming && !isAdmin
                    ? 'bg-gradient-to-br from-slate-900 via-amber-950/20 to-slate-900 border-amber-500/40 shadow-amber-950/20'
                    : isExpired
                    ? 'bg-rose-950/20 border-rose-800/40'
                    : isSubmitted
                    ? 'bg-slate-900 border-slate-800 hover:border-emerald-500/40'
                    : 'bg-slate-900 border-amber-500/40 shadow-amber-950/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-extrabold text-white">
                        {session.sessionName || 'Latihan Rutin'}
                      </span>

                      {/* Sunnah / Wajib Badge */}
                      {session.sessionType === 'sunnah' || session.sessionName?.toLowerCase().includes('sunnah') ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/50 text-[10px] font-black flex items-center gap-1 shadow-sm">
                          <Sparkles size={11} className="text-amber-400" /> Sesi Sunnah (+Bonus)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/60 text-[10px] font-bold">
                          🏛️ Wajib
                        </span>
                      )}

                      {/* Status Badges */}
                      {isClosed ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold flex items-center gap-1">
                          <Lock size={10} className="text-amber-400" /> Selesai & Ditutup
                        </span>
                      ) : isUpcoming ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1">
                          <Timer size={10} /> {countdown.formatted}
                        </span>
                      ) : isExpired ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold flex items-center gap-1">
                          <Clock size={10} /> Expired (Belum Ditutup)
                        </span>
                      ) : isSubmitted ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 size={11} /> Ter-submit Resmi
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                          <AlertCircle size={11} /> Draf Aktif
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Calendar size={13} className="text-purple-400" />
                        <span>{session.date}</span>
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <UserCheck size={13} className="text-indigo-400" />
                        <span>{session.submittedBy || 'Petugas Lapangan'}</span>
                      </span>
                      {session.scheduledTime && (
                        <>
                          <span>·</span>
                          <span className="text-slate-300">{session.scheduledTime}</span>
                        </>
                      )}
                      {session.location && (
                        <>
                          <span>·</span>
                          <span className="text-amber-300">{session.location}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action: Delete (Admin Only) */}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setSessionToDelete(session);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                      title="Hapus Sesi"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {/* Stat Counters */}
                <div className="grid grid-cols-4 gap-2 my-3.5">
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 text-center">
                    <div className="text-[10px] text-slate-400 font-semibold">Hadir</div>
                    <div className="text-sm font-black text-emerald-400">{hadirCount}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 text-center">
                    <div className="text-[10px] text-slate-400 font-semibold">Sakit</div>
                    <div className="text-sm font-black text-amber-400">{sakitCount}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 text-center">
                    <div className="text-[10px] text-slate-400 font-semibold">Izin</div>
                    <div className="text-sm font-black text-blue-400">{izinCount}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 text-center">
                    <div className="text-[10px] text-slate-400 font-semibold">Alfa</div>
                    <div className="text-sm font-black text-rose-400">{alfaCount}</div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 mb-4">
                  {isClosed ? (
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Lock size={12} className="text-amber-400" />
                      Sesi ditutup & dikunci pada <strong className="text-slate-200">{session.closedAt || session.date}</strong> oleh <strong className="text-purple-300">{session.closedBy || 'Admin'}</strong>
                    </span>
                  ) : isUpcoming && !isAdmin ? (
                    <span className="text-amber-300 flex items-center gap-1.5 font-medium">
                      <Timer size={12} />
                      Sesi dimulai dalam {countdown.formatted}. Input presensi dibuka saat sesi dimulai.
                    </span>
                  ) : isSubmitted ? (
                    <span className="text-emerald-400/90 flex items-center gap-1.5">
                      <CheckCircle2 size={12} />
                      Disubmit pada: <span className="text-slate-200">{session.submittedAt || session.date}</span>
                    </span>
                  ) : (
                    <span className="text-amber-400 font-medium">
                      ⚠️ Status Draf. {isExpired ? 'Sesi telah lewat tanggal.' : 'Belum difinalisasi ke rekapitulasi.'}
                    </span>
                  )}
                </div>

                {/* Button actions */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
                  {/* Non-Admin: Quick open attendance button */}
                  {!isAdmin ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectSessionDate) {
                          onSelectSessionDate(session.date);
                        }
                      }}
                      className="w-full py-2 px-3 bg-purple-700/30 hover:bg-purple-700/60 border border-purple-600/40 text-purple-200 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Play size={14} className="text-amber-400" />
                      <span>{isUpcoming ? 'Lihat Lembar Presensi Sesi Ini' : 'Buka & Isi Presensi Sesi Ini'}</span>
                    </button>
                  ) : (
                    <>
                      {/* Admin Controls */}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(session)}
                        className="flex-1 py-2 px-3 bg-purple-700/30 hover:bg-purple-700/50 border border-purple-600/40 text-purple-200 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Edit3 size={14} />
                        <span>Edit Data</span>
                      </button>

                      {/* Toggle Close / Reopen Session Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleCloseSession(session)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isClosed
                            ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700'
                            : 'bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 border border-rose-800/60'
                        }`}
                        title={isClosed ? 'Buka kembali sesi ini' : 'Tutup sesi ini (kunci & selesaikan)'}
                      >
                        {isClosed ? (
                          <>
                            <Unlock size={14} />
                            <span>Buka Sesi</span>
                          </>
                        ) : (
                          <>
                            <Lock size={14} />
                            <span>Tutup Sesi</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleDraftSubmitted(session)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isSubmitted
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950'
                        }`}
                      >
                        {isSubmitted ? (
                          <>
                            <RotateCcw size={14} />
                            <span>Tarik Draf</span>
                          </>
                        ) : (
                          <>
                            <Send size={14} />
                            <span>Submit</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal (Admin Only) */}
      {isAdmin && (
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          title="Hapus Sesi Presensi?"
          message={`Apakah Anda yakin ingin menghapus permanen data sesi presensi tanggal ${sessionToDelete?.date}? Tindakan ini tidak dapat dibatalkan.`}
          confirmText="Hapus Permanen"
          cancelText="Batal"
          isDanger={true}
          onConfirm={confirmDelete}
          onCancel={() => {
            setIsDeleteModalOpen(false);
            setSessionToDelete(null);
          }}
        />
      )}

      {/* Close All Expired Sessions Confirmation Modal (Admin Only) */}
      {isAdmin && (
        <ConfirmModal
          isOpen={isCloseAllExpiredModalOpen}
          title="Tutup Seluruh Sesi yang Expired / Lewat Tanggal?"
          message={`Apakah Anda yakin ingin menutup sekaligus ${expiredCount} sesi latihan yang tanggalnya telah lewat?`}
          details={[
            `${expiredCount} sesi lampau yang belum ditutup akan dikunci secara resmi.`,
            'Sesi yang ditutup tetap dapat dibuka kembali secara individual jika diperlukan koreksi.'
          ]}
          confirmText="🔒 Ya, Tutup Sesi Expired"
          cancelText="Batal"
          onConfirm={handleCloseAllExpiredConfirm}
          onCancel={() => setIsCloseAllExpiredModalOpen(false)}
        />
      )}

      {/* Close All Finished Sessions Confirmation Modal (Admin Only) */}
      {isAdmin && (
        <ConfirmModal
          isOpen={isCloseAllFinishedModalOpen}
          title="Tutup Seluruh Sesi yang Selesai Disubmit?"
          message={`Apakah Anda yakin ingin menutup & mengunci ${finishedUnclosedCount} sesi yang telah ter-submit?`}
          details={[
            'Sesi yang telah disubmit akan difinalisasi sehingga tidak berubah tanpa sengaja.',
            'Data tetap tercatat utuh di rekapitulasi dan dapat dibuka kembali kapan saja.'
          ]}
          confirmText="🔒 Ya, Tutup Sesi Selesai"
          cancelText="Batal"
          onConfirm={handleCloseAllFinishedConfirm}
          onCancel={() => setIsCloseAllFinishedModalOpen(false)}
        />
      )}
    </div>
  );
};
