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
  Trash2
} from 'lucide-react';
import { DailyAttendance, Student } from '../App';

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
  onDeleteSchedule?: (sessionId: string) => Promise<void>;
  triggerToast: (msg: string, type?: 'success' | 'warning' | 'info') => void;
}

export const ScheduleSessionModal: React.FC<ScheduleSessionModalProps> = ({
  isOpen,
  editingSession,
  students = [],
  onClose,
  onSaveSchedule,
  onDeleteSchedule,
  triggerToast
}) => {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [sessionName, setSessionName] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [location, setLocation] = useState('');
  const [targetSection, setTargetSection] = useState('All');
  const [description, setDescription] = useState('');
  const [autoPublishAnnouncement, setAutoPublishAnnouncement] = useState(false);

  // Sync internal state when editing or opening
  useEffect(() => {
    if (isOpen) {
      if (editingSession) {
        setDate(editingSession.date);
        setSessionName(editingSession.sessionName || '');
        setScheduledTime(editingSession.scheduledTime || '');
        setLocation(editingSession.location || '');
        setTargetSection(editingSession.targetSection || 'All');
        setDescription(editingSession.description || '');
        setAutoPublishAnnouncement(false);
      } else {
        const todayStr = new Date().toISOString().split('T')[0];
        setDate(todayStr);
        setSessionName('');
        setScheduledTime('');
        setLocation('');
        setTargetSection('All');
        setDescription('');
        setAutoPublishAnnouncement(false);
      }
    }
  }, [isOpen, editingSession]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
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
      location: location.trim() || 'Lapangan PGT',
      targetSection: targetSection || 'All',
      description: description.trim(),
      autoPublishAnnouncement
    });

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
                {editingSession ? 'Edit Jadwal Sesi Latihan' : 'Jadwalkan Sesi Latihan Baru'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
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
      </div>
    </div>
  );
};
