import React, { useState } from 'react';
import { 
  Calendar, Clock, UserCheck, Edit3, Trash2, CheckCircle2, 
  AlertCircle, ChevronRight, Save, X, RotateCcw, Send, Shield, Sparkles, Filter
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

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
  isSubmitted?: boolean;
  submittedAt?: string | null;
  submittedBy?: string | null;
  records: AttendanceRecord[];
}

interface AttendanceSessionsTabProps {
  sessions: AttendanceSession[];
  students: Student[];
  currentUserName: string;
  onUpdateSession: (updatedSession: AttendanceSession) => void;
  onDeleteSession: (sessionIdentifier: string) => void;
  onSubmitSession: (sessionIdentifier: string) => void;
  triggerToast: (msg: string) => void;
}

export const AttendanceSessionsTab: React.FC<AttendanceSessionsTabProps> = ({
  sessions,
  students,
  currentUserName,
  onUpdateSession,
  onDeleteSession,
  onSubmitSession,
  triggerToast
}) => {
  const [filterType, setFilterType] = useState<'all' | 'submitted' | 'draft'>('all');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editSessionData, setEditSessionData] = useState<AttendanceSession | null>(null);
  const [sessionSearchQuery, setSessionSearchQuery] = useState('');
  
  // Deletion modal
  const [sessionToDelete, setSessionToDelete] = useState<AttendanceSession | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Filter sessions
  const filteredSessions = sessions.filter(s => {
    const isSubmitted = s.isSubmitted !== false;
    if (filterType === 'submitted' && !isSubmitted) return false;
    if (filterType === 'draft' && isSubmitted) return false;
    if (sessionSearchQuery) {
      const matchDate = s.date.includes(sessionSearchQuery);
      const matchName = (s.sessionName || '').toLowerCase().includes(sessionSearchQuery.toLowerCase());
      const matchOfficer = (s.submittedBy || '').toLowerCase().includes(sessionSearchQuery.toLowerCase());
      return matchDate || matchName || matchOfficer;
    }
    return true;
  });

  const handleStartEdit = (session: AttendanceSession) => {
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
    triggerToast(`Data presensi tanggal ${editSessionData.date} berhasil diperbarui!`);
  };

  const handleStatusChangeInEdit = (studentId: number, status: string) => {
    if (!editSessionData) return;
    setEditSessionData(prev => {
      if (!prev) return prev;
      const records = [...prev.records];
      const idx = records.findIndex(r => r.studentId === studentId);
      if (idx === -1) {
        records.push({ studentId, status, note: '' });
      } else {
        records[idx] = { ...records[idx], status };
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

  const handleToggleDraftSubmitted = (session: AttendanceSession) => {
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
        : `Sesi ${session.date} dikembalikan ke status Draf (tidak masuk rekap).`
    );
  };

  const confirmDelete = () => {
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
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-purple-900/40 text-purple-300 border border-purple-700/40 text-[11px] font-semibold mb-2">
            <Edit3 size={12} className="text-amber-400" /> Riwayat & Koreksi Presensi
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Koreksi & Edit Data Absensi ({sessions.length} Sesi)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Admin memiliki wewenang penuh untuk mengubah status hadir, catatan halangan, atau mengembalikan sesi ke status draf.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'all'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 border border-slate-800'
            }`}
          >
            Semua ({sessions.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('submitted')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'submitted'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 border border-slate-800'
            }`}
          >
            Ter-submit ({sessions.filter(s => s.isSubmitted !== false).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('draft')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'draft'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 border border-slate-800'
            }`}
          >
            Draf ({sessions.filter(s => s.isSubmitted === false).length})
          </button>
        </div>
      </div>

      {/* If currently editing a session */}
      {editingSessionId && editSessionData ? (
        <div className="bg-slate-900 border-2 border-purple-500/50 rounded-3xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 mb-1">
                <Sparkles size={14} />
                <span>MODE EDIT & KOREKSI ABSEN AKTIF</span>
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
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEditedSession}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-purple-950 transition-all active:scale-95"
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
                  <th className="py-3 px-4">Catatan Halangan</th>
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
                      <td className="py-2.5 px-4 font-bold text-white">
                        {student.name}
                      </td>
                      <td className="py-2.5 px-4 text-slate-300">
                        <span className="text-amber-400 font-semibold">{student.section}</span> · Kls {student.kelas} · Asr {student.asrama}
                      </td>
                      <td className="py-2.5 px-4">
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
                      <td className="py-2.5 px-4">
                        <input
                          type="text"
                          value={rec.note || ''}
                          onChange={(e) => handleNoteChangeInEdit(student.id, e.target.value)}
                          placeholder="Keterangan halangan..."
                          className="w-full text-xs px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
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
          <div className="col-span-full bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center">
            <AlertCircle size={36} className="mx-auto text-slate-500 mb-3" />
            <h4 className="text-base font-bold text-white">Belum Ada Sesi Presensi yang Tercatat</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Silakan lakukan presensi pada tab "Presensi Harian" lalu submit untuk merekam sesi ke dalam sistem.
            </p>
          </div>
        ) : (
          filteredSessions.map(session => {
            const sId = session.id || `sesi-${session.date}`;
            const isSubmitted = session.isSubmitted !== false;

            const hadirCount = session.records.filter(r => r.status === 'Hadir').length;
            const sakitCount = session.records.filter(r => r.status === 'Sakit').length;
            const izinCount = session.records.filter(r => r.status === 'Izin').length;
            const alfaCount = session.records.filter(r => r.status === 'Alfa').length;
            const totalRecorded = session.records.length;

            return (
              <div
                key={sId}
                className={`bg-slate-900 border rounded-3xl p-5 shadow-xl transition-all ${
                  isSubmitted
                    ? 'border-slate-800 hover:border-emerald-500/40'
                    : 'border-amber-500/40 bg-slate-900/95 shadow-amber-950/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-extrabold text-white">
                        {session.sessionName || 'Latihan Rutin'}
                      </span>
                      {isSubmitted ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 size={11} /> Ter-submit Resmi
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                          <AlertCircle size={11} /> Draf (Belum Disubmit)
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                      <Calendar size={13} className="text-purple-400" />
                      <span>{session.date}</span>
                      <span>·</span>
                      <UserCheck size={13} className="text-indigo-400" />
                      <span>{session.submittedBy || 'Petugas Lapangan'}</span>
                    </div>
                  </div>

                  {/* Action: Delete */}
                  <button
                    type="button"
                    onClick={() => {
                      setSessionToDelete(session);
                      setIsDeleteModalOpen(true);
                    }}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors"
                    title="Hapus Sesi"
                  >
                    <Trash2 size={16} />
                  </button>
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
                  {isSubmitted ? (
                    <span className="text-slate-400">
                      Disubmit pada: <span className="text-slate-200">{session.submittedAt || session.date}</span>
                    </span>
                  ) : (
                    <span className="text-amber-400 font-medium">
                      ⚠️ Data ini belum masuk ke Rekapitulasi & Leaderboard sebelum Anda menekan tombol Submit.
                    </span>
                  )}
                </div>

                {/* Button actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(session)}
                    className="flex-1 py-2 px-3 bg-purple-700/30 hover:bg-purple-700/50 border border-purple-600/40 text-purple-200 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit3 size={14} />
                    <span>Edit & Koreksi Data</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleDraftSubmitted(session)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      isSubmitted
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950'
                    }`}
                  >
                    {isSubmitted ? (
                      <>
                        <RotateCcw size={14} />
                        <span>Tarik ke Draf</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Submit Resmi</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
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
    </div>
  );
};
