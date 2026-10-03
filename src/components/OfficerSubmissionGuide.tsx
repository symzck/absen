import React, { useState } from 'react';
import { 
  ClipboardCheck, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Calendar, 
  Users, 
  ArrowRight,
  ShieldCheck,
  Lock,
  Unlock,
  Clock,
  MapPin,
  CheckSquare
} from 'lucide-react';

interface OfficerSubmissionGuideProps {
  sessionName: string;
  selectedDate: string;
  isSubmitted: boolean;
  isClosed?: boolean;
  isExpired?: boolean;
  scheduledTime?: string;
  location?: string;
  targetSection?: string;
  recordedCount: number;
  totalStudents: number;
  presentCount: number;
  officerName: string;
  assignedSection?: string;
  onOpenSubmitModal: () => void;
  onToggleCloseSession?: () => void;
}

export const OfficerSubmissionGuide: React.FC<OfficerSubmissionGuideProps> = ({
  sessionName,
  selectedDate,
  isSubmitted,
  isClosed = false,
  isExpired = false,
  scheduledTime,
  location,
  targetSection = 'All',
  recordedCount,
  totalStudents,
  presentCount,
  officerName,
  assignedSection = 'All',
  onOpenSubmitModal,
  onToggleCloseSession
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const isComplete = recordedCount >= totalStudents && totalStudents > 0;
  const progressPercent = totalStudents > 0 ? Math.round((recordedCount / totalStudents) * 100) : 0;

  return (
    <div className={`border rounded-3xl p-5 shadow-xl space-y-4 text-left transition-all ${
      isClosed
        ? 'bg-slate-950 border-slate-800'
        : isExpired && !isSubmitted
        ? 'bg-gradient-to-br from-slate-900 via-rose-950/30 to-slate-900 border-rose-500/40'
        : 'bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border-indigo-500/40'
    }`}>
      {/* Header Banner */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
            isClosed
              ? 'bg-slate-800 text-amber-400'
              : isSubmitted
              ? 'bg-emerald-600 text-white shadow-emerald-950'
              : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-purple-950'
          }`}>
            {isClosed ? <Lock size={20} /> : isSubmitted ? <ShieldCheck size={20} /> : <ClipboardCheck size={20} />}
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-900/60 text-purple-200 border border-purple-700/50 text-[10px] font-bold uppercase mb-0.5">
              <Sparkles size={11} className="text-amber-400" /> Panduan & Arahan Petugas Lapangan
            </div>
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex flex-wrap items-center gap-2">
              <span>Alur Submit Sesi: <strong className="text-amber-300">{sessionName || 'Latihan Rutin'}</strong></span>
              {isClosed ? (
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold inline-flex items-center gap-1">
                  <Lock size={10} className="text-amber-400" /> Sesi Ditutup / Selesai
                </span>
              ) : isExpired ? (
                <span className="px-2 py-0.5 rounded-md bg-rose-900/60 text-rose-300 border border-rose-700/50 text-[10px] font-bold inline-flex items-center gap-1">
                  <Clock size={10} /> Tanggal Lewat / Expired
                </span>
              ) : null}
            </h3>

            {/* Sub-details (Time, Location, Section) */}
            {(scheduledTime || location || (targetSection && targetSection !== 'All')) && (
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400">
                {scheduledTime && (
                  <span className="flex items-center gap-1 text-slate-300">
                    <Clock size={12} className="text-purple-400" /> {scheduledTime}
                  </span>
                )}
                {location && (
                  <span className="flex items-center gap-1 text-slate-300">
                    <MapPin size={12} className="text-amber-400" /> {location}
                  </span>
                )}
                {targetSection && targetSection !== 'All' && (
                  <span className="px-2 py-0.5 rounded bg-purple-950 border border-purple-800/80 text-[11px] text-purple-300 font-semibold">
                    Unit: Section {targetSection}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          title={isExpanded ? 'Sembunyikan Arahan' : 'Buka Arahan'}
        >
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Quick Status Bar */}
      <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3.5 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${
            isClosed
              ? 'bg-slate-900 text-slate-400 border-slate-800'
              : isSubmitted
              ? 'bg-emerald-950 text-emerald-400 border-emerald-800/60'
              : isComplete
              ? 'bg-amber-950 text-amber-300 border-amber-800/60 animate-pulse'
              : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}>
            {isClosed ? <Lock size={18} className="text-amber-400" /> : isSubmitted ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400">Status Sesi ({selectedDate})</div>
            <div className="text-xs sm:text-sm font-extrabold text-white">
              {isClosed ? (
                <span className="text-slate-300 flex items-center gap-1">
                  🔒 Sesi Resmi Ditutup & Terkunci — Laporan Telah Difinalisasi
                </span>
              ) : isSubmitted ? (
                <span className="text-emerald-300 flex items-center gap-1">
                  ✓ Resmi Ter-submit ke Rekapitulasi & Cloud Firestore
                </span>
              ) : isComplete ? (
                <span className="text-amber-300">
                  ⚡ Seluruh {recordedCount} Pemain Terisi — Siap Di-submit!
                </span>
              ) : (
                <span className="text-slate-200">
                  {recordedCount} dari {totalStudents} pemain terdata ({progressPercent}%)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onToggleCloseSession && (
            <button
              type="button"
              onClick={onToggleCloseSession}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                isClosed
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
            >
              {isClosed ? <Unlock size={13} /> : <Lock size={13} />}
              <span>{isClosed ? 'Buka Kunci Sesi' : 'Tutup Sesi Ini'}</span>
            </button>
          )}

          {!isClosed && !isSubmitted && (
            <button
              type="button"
              onClick={onOpenSubmitModal}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <Send size={14} />
              <span>Submit Presensi Sesi Ini</span>
            </button>
          )}
        </div>
      </div>

      {/* Detailed Step-by-Step Guide (Expandable) */}
      {isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-800/80">
          {/* Step 1 */}
          <div className="p-3.5 bg-slate-950/60 border border-slate-800/70 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-purple-900/80 text-purple-300 font-black text-[10px] flex items-center justify-center border border-purple-700">
                1
              </span>
              <span className="text-[10px] font-bold text-slate-400">Pencatatan</span>
            </div>
            <h4 className="font-bold text-xs text-white">Tandai Kehadiran Pemain</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Klik <strong>Hadir (H)</strong>, <strong>Sakit (S)</strong>, <strong>Izin (I)</strong>, atau <strong>Alfa (A)</strong> pada setiap nama. Gunakan <em>"Hadir Semua"</em> untuk efisiensi di lapangan.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-3.5 bg-slate-950/60 border border-slate-800/70 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-purple-900/80 text-purple-300 font-black text-[10px] flex items-center justify-center border border-purple-700">
                2
              </span>
              <span className="text-[10px] font-bold text-slate-400">Verifikasi</span>
            </div>
            <h4 className="font-bold text-xs text-white">Periksa Keterangan Izin</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Isi kolom catatan jika pemain izin/sakit. Gunakan <em>"Mode Presensi Kertas"</em> bila menyalin dari lembar presensi fisik.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-3.5 bg-emerald-950/20 border border-emerald-800/60 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="w-5 h-5 rounded-full bg-emerald-900/80 text-emerald-300 font-black text-[10px] flex items-center justify-center border border-emerald-700">
                3
              </span>
              <span className="text-[10px] font-bold text-emerald-400">Finalisasi</span>
            </div>
            <h4 className="font-bold text-xs text-emerald-300">Klik Submit & Konfirmasi</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Tekan tombol <strong>"Submit Presensi Sesi Ini"</strong> agar data resmi tersinkronisasi ke Rekapitulasi & Leaderboard Section Korps.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
