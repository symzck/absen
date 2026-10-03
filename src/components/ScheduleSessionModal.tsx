import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  FileText, 
  Save, 
  Megaphone, 
  Sparkles,
  Trash2,
  Zap,
  Repeat,
  Check,
  CalendarCheck
} from 'lucide-react';
import { DailyAttendance, Student } from '../App';

export interface BatchScheduleData {
  sessions: Array<{
    date: string;
    sessionName: string;
    scheduledTime: string;
    location: string;
    targetSection: string;
    description: string;
  }>;
  autoPublishAnnouncement: boolean;
}

interface ScheduleSessionModalProps {
  isOpen: boolean;
  editingSession: DailyAttendance | null;
  students?: Student[];
  onClose: () => void;
  onSaveSchedule: (sessionData: {
    date: string;
    sessionName: string;
    scheduledTime: string;
    location: string;
    targetSection: string;
    description: string;
    autoPublishAnnouncement: boolean;
  }) => Promise<void>;
  onSaveBatchSchedule?: (batchData: BatchScheduleData) => Promise<void>;
  onDeleteSchedule?: (sessionId: string) => Promise<void>;
  triggerToast: (msg: string, type?: 'success' | 'warning' | 'info') => void;
}

const DAYS_OF_WEEK = [
  { id: 1, name: 'Senin', short: 'Sen' },
  { id: 2, name: 'Selasa', short: 'Sel' },
  { id: 3, name: 'Rabu', short: 'Rab' },
  { id: 4, name: 'Kamis', short: 'Kam' },
  { id: 5, name: 'Jumat', short: 'Jum' },
  { id: 6, name: 'Sabtu', short: 'Sab' },
  { id: 0, name: 'Minggu', short: 'Min' },
];

export const ScheduleSessionModal: React.FC<ScheduleSessionModalProps> = ({
  isOpen,
  editingSession,
  students = [],
  onClose,
  onSaveSchedule,
  onSaveBatchSchedule,
  onDeleteSchedule,
  triggerToast
}) => {
  const [scheduleMode, setScheduleMode] = useState<'single' | 'auto'>('single');
  
  // Single mode state
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [sessionName, setSessionName] = useState('');
  const [scheduledTime, setScheduledTime] = useState('15:30 - 17:30 WIB');
  const [location, setLocation] = useState('Lapangan Utama PGT');
  const [targetSection, setTargetSection] = useState('All');
  const [description, setDescription] = useState('');
  const [autoPublishAnnouncement, setAutoPublishAnnouncement] = useState(true);

  // Auto-generate mode state
  const [selectedDays, setSelectedDays] = useState<number[]>([3, 6]); // Default Rabu (3) & Sabtu (6)
  const [durationWeeks, setDurationWeeks] = useState<number>(4); // 4 weeks
  const [autoSessionBaseName, setAutoSessionBaseName] = useState('Latihan Rutin Marching Band');

  // Sync internal state when editing or opening
  useEffect(() => {
    if (isOpen) {
      if (editingSession) {
        setScheduleMode('single');
        setDate(editingSession.date);
        setSessionName(editingSession.sessionName || '');
        setScheduledTime(editingSession.scheduledTime || '15:30 - 17:30 WIB');
        setLocation(editingSession.location || 'Lapangan Utama PGT');
        setTargetSection(editingSession.targetSection || 'All');
        setDescription(editingSession.description || '');
        setAutoPublishAnnouncement(false);
      } else {
        const todayStr = new Date().toISOString().split('T')[0];
        setDate(todayStr);
        setSessionName('Latihan Rutin Marching Band');
        setScheduledTime('15:30 - 17:30 WIB');
        setLocation('Lapangan Utama PGT');
        setTargetSection('All');
        setDescription('');
        setAutoPublishAnnouncement(true);
      }
    }
  }, [isOpen, editingSession]);

  if (!isOpen) return null;

  // Compute generated dates for Auto Mode
  const computeGeneratedDates = (): string[] => {
    const dates: string[] = [];
    const today = new Date();
    const totalDays = durationWeeks * 7;

    for (let i = 0; i <= totalDays; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dayOfWeek = d.getDay();
      if (selectedDays.includes(dayOfWeek)) {
        dates.push(d.toISOString().split('T')[0]);
      }
    }
    return dates;
  };

  const previewDates = computeGeneratedDates();

  const handleToggleDay = (dayId: number) => {
    setSelectedDays(prev => 
      prev.includes(dayId) 
        ? prev.filter(d => d !== dayId) 
        : [...prev, dayId].sort((a, b) => a - b)
    );
  };

  const handleSubmitSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      triggerToast('Pilih tanggal sesi latihan terlebih dahulu!', 'warning');
      return;
    }
    if (!sessionName.trim()) {
      triggerToast('Nama sesi latihan tidak boleh kosong!', 'warning');
      return;
    }

    await onSaveSchedule({
      date,
      sessionName: sessionName.trim(),
      scheduledTime: scheduledTime.trim() || '15:30 - 17:30 WIB',
      location: location.trim() || 'Lapangan Utama PGT',
      targetSection: targetSection || 'All',
      description: description.trim(),
      autoPublishAnnouncement
    });

    onClose();
  };

  const handleSubmitAuto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDays.length === 0) {
      triggerToast('Pilih minimal satu hari latihan rutin!', 'warning');
      return;
    }
    if (previewDates.length === 0) {
      triggerToast('Tidak ada tanggal sesi yang memenuhi kriteria!', 'warning');
      return;
    }

    const batchSessions = previewDates.map(d => {
      const dayName = new Date(d).toLocaleDateString('id-ID', { weekday: 'long' });
      return {
        date: d,
        sessionName: `${autoSessionBaseName.trim()} (${dayName})`,
        scheduledTime: scheduledTime.trim() || '15:30 - 17:30 WIB',
        location: location.trim() || 'Lapangan Utama PGT',
        targetSection: targetSection || 'All',
        description: description.trim() || `Sesi latihan terjadwal rutin korps hari ${dayName}.`
      };
    });

    if (onSaveBatchSchedule) {
      await onSaveBatchSchedule({
        sessions: batchSessions,
        autoPublishAnnouncement
      });
    } else {
      // Fallback: save one by one
      for (const s of batchSessions) {
        await onSaveSchedule({
          ...s,
          autoPublishAnnouncement: false
        });
      }
      triggerToast(`Berhasil membuat ${batchSessions.length} sesi latihan otomatis!`, 'success');
    }

    onClose();
  };

  const sectionOptions = Array.from(new Set(['All', 'Brass', 'Cologuard', 'Battery', 'Pit', ...students.map(s => s.section).filter(Boolean)]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 text-left">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 text-amber-300 rounded-2xl border border-amber-500/30">
              <Calendar size={22} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-950 text-purple-300 text-[10px] font-bold uppercase mb-0.5">
                <Sparkles size={10} className="text-amber-400" /> Atur Jadwal Latihan (Admin)
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                {editingSession ? 'Edit Jadwal Sesi Latihan' : 'Jadwal Sesi Latihan Korps'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mode Selector Tabs (If not editing existing single session) */}
        {!editingSession && (
          <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-800 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => setScheduleMode('single')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                scheduleMode === 'single'
                  ? 'bg-purple-700 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar size={14} />
              <span>Satu Sesi Spesifik</span>
            </button>

            <button
              type="button"
              onClick={() => setScheduleMode('auto')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                scheduleMode === 'auto'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              <Zap size={14} />
              <span>⚡ Buat Otomatis (Rutin)</span>
            </button>
          </div>
        )}

        {/* AUTO-GENERATE RECURRING FORM */}
        {scheduleMode === 'auto' && !editingSession ? (
          <form onSubmit={handleSubmitAuto} className="space-y-4">
            <div className="p-3.5 bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-slate-950 border border-amber-500/40 rounded-2xl text-xs text-slate-300 space-y-1">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <Zap size={14} /> Generator Jadwal Sesi Otomatis
              </div>
              <p className="text-[11px] text-slate-400">
                Sistem akan secara otomatis membuatkan sesi-sesi latihan resmi untuk beberapa minggu ke depan sesuai hari rutin yang Anda pilih.
              </p>
            </div>

            {/* Day Selector Pills */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                Pilih Hari Latihan Rutin Tiap Minggu <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-7 gap-1.5">
                {DAYS_OF_WEEK.map(day => {
                  const isSelected = selectedDays.includes(day.id);
                  return (
                    <button
                      type="button"
                      key={day.id}
                      onClick={() => handleToggleDay(day.id)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md shadow-amber-950'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <span className="text-[11px]">{day.short}</span>
                      {isSelected && <Check size={10} className="stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duration Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Rentang Waktu Pembuatan
                </label>
                <select
                  value={durationWeeks}
                  onChange={(e) => setDurationWeeks(Number(e.target.value))}
                  className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  <option value={2}>2 Minggu ke Depan</option>
                  <option value={4}>1 Bulan (4 Minggu ke Depan)</option>
                  <option value={8}>2 Bulan (8 Minggu ke Depan)</option>
                  <option value={12}>1 Triwulan (12 Minggu ke Depan)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Nama Dasar Sesi
                </label>
                <input
                  type="text"
                  required
                  value={autoSessionBaseName}
                  onChange={(e) => setAutoSessionBaseName(e.target.value)}
                  placeholder="Contoh: Latihan Rutin Korps"
                  className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Time & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Jam / Waktu Latihan
                </label>
                <input
                  type="text"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  placeholder="15:30 - 17:30 WIB"
                  className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Lokasi Latihan
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Lapangan Utama PGT"
                  className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Target Section */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Sasaran Section Unit
              </label>
              <select
                value={targetSection}
                onChange={(e) => setTargetSection(e.target.value)}
                className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
              >
                <option value="All">Semua Unit (Seluruh Korps)</option>
                {sectionOptions.filter(s => s !== 'All').map(sec => (
                  <option key={sec} value={sec}>Khusus Section {sec}</option>
                ))}
              </select>
            </div>

            {/* Preview of Generated Dates */}
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <CalendarCheck size={14} className="text-emerald-400" />
                  Pratinjau Sesi Otomatis ({previewDates.length} Sesi Terjadwal):
                </span>
                <span className="text-[11px] text-amber-300 font-semibold">{durationWeeks} Minggu</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                {previewDates.map(d => (
                  <span key={d} className="px-2 py-0.5 rounded-lg bg-purple-950/80 border border-purple-700/60 text-purple-200 text-[10px] font-bold">
                    📅 {d}
                  </span>
                ))}
              </div>
            </div>

            {/* Auto Announce Checkbox */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2.5">
              <input
                type="checkbox"
                id="autoAnnounceBatch"
                checked={autoPublishAnnouncement}
                onChange={(e) => setAutoPublishAnnouncement(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="autoAnnounceBatch" className="text-xs text-slate-300 font-semibold cursor-pointer flex items-center gap-1.5">
                <Megaphone size={14} className="text-amber-400 shrink-0" />
                <span>Kirimkan ringkasan jadwal otomatis ke Papan Pengumuman</span>
              </label>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={previewDates.length === 0}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-950 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Zap size={15} />
                <span>⚡ Buat {previewDates.length} Sesi Otomatis</span>
              </button>
            </div>
          </form>
        ) : (
          /* SINGLE SESSION FORM */
          <form onSubmit={handleSubmitSingle} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Tanggal Latihan <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                />
              </div>

              {/* Time Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Jam / Waktu Latihan
                </label>
                <input
                  type="text"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  placeholder="Contoh: 15:30 - 17:30 WIB"
                  className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Session Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Nama Sesi / Kegiatan Latihan <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="Contoh: Latihan Rutin, Gladi Bersih, Latihan Tiup..."
                className="w-full text-xs font-bold px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Lokasi Latihan
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Contoh: Lapangan Utama / Hall PGT"
                  className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Target Section */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Sasaran Section Unit
                </label>
                <select
                  value={targetSection}
                  onChange={(e) => setTargetSection(e.target.value)}
                  className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  <option value="All">Semua Unit (Seluruh Korps)</option>
                  {sectionOptions.filter(s => s !== 'All').map(sec => (
                    <option key={sec} value={sec}>Khusus Section {sec}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Instruksi / Catatan Latihan (Opsional)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tuliskan catatan arahan latihan..."
                className="w-full text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed resize-none"
              />
            </div>

            {/* Auto Publish Announcement Checkbox */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2.5">
              <input
                type="checkbox"
                id="autoAnnounce"
                checked={autoPublishAnnouncement}
                onChange={(e) => setAutoPublishAnnouncement(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="autoAnnounce" className="text-xs text-slate-300 font-semibold cursor-pointer flex items-center gap-1.5">
                <Megaphone size={14} className="text-amber-400 shrink-0" />
                <span>Kirimkan juga ke Papan Pengumuman</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-800">
              {editingSession && onDeleteSchedule ? (
                <button
                  type="button"
                  onClick={async () => {
                    if (editingSession.id || editingSession.date) {
                      await onDeleteSchedule(editingSession.id || `sesi-${editingSession.date}`);
                      onClose();
                    }
                  }}
                  className="px-3.5 py-2.5 rounded-xl border border-rose-900/50 hover:bg-rose-950/60 text-rose-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 size={14} />
                  <span>Hapus Jadwal</span>
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-950 flex items-center gap-1.5 cursor-pointer"
                >
                  <Save size={15} />
                  <span>Simpan Jadwal</span>
                </button>
              </div>
            </div>

          </form>
        )}
      </div>
    </div>
  );
};
