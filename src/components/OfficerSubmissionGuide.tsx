import React, { useState, useEffect } from 'react';
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
  Timer,
  AlertTriangle,
  Hourglass
} from 'lucide-react';

export interface CountdownInfo {
  isUpcoming: boolean;
  totalSeconds: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
}

export function calculateSessionCountdown(dateStr: string, timeStr?: string): CountdownInfo {
  let startHour = 8;
  let startMinute = 0;

  if (timeStr) {
    const match = timeStr.match(/(\d{1,2})[:.](\d{2})/);
    if (match) {
      startHour = parseInt(match[1], 10);
      startMinute = parseInt(match[2], 10);
    }
  }

  const [y, m, d] = dateStr.split('-').map(Number);
  const targetDate = new Date(y, m - 1, d, startHour, startMinute, 0);
  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return {
      isUpcoming: false,
      totalSeconds: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      formatted: 'Sesi Telah Dimulai'
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / (24 * 3600));
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} Hari`);
  parts.push(`${hours.toString().padStart(2, '0')} Jam`);
  parts.push(`${minutes.toString().padStart(2, '0')} Menit`);
  parts.push(`${seconds.toString().padStart(2, '0')} Detik`);

  return {
    isUpcoming: true,
    totalSeconds,
    days,
    hours,
    minutes,
    seconds,
    formatted: parts.join(' ')
  };
}

export function sortSessionsByClosest<T extends { date: string; scheduledTime?: string }>(sessions: T[]): T[] {
  const todayStr = new Date().toISOString().split('T')[0];

  const parseSessionTime = (s: T): number => {
    let startHour = 8;
    let startMinute = 0;
    if (s.scheduledTime) {
      const match = s.scheduledTime.match(/(\d{1,2})[:.](\d{2})/);
      if (match) {
        startHour = parseInt(match[1], 10);
        startMinute = parseInt(match[2], 10);
      }
    }
    const parts = s.date.split('-').map(Number);
    if (parts.length < 3) return 0;
    const [y, m, d] = parts;
    return new Date(y, m - 1, d, startHour, startMinute, 0).getTime();
  };

  return [...sessions].sort((a, b) => {
    const isAUpcoming = a.date >= todayStr;
    const isBUpcoming = b.date >= todayStr;

    if (isAUpcoming && !isBUpcoming) return -1;
    if (!isAUpcoming && isBUpcoming) return 1;

    const timeA = parseSessionTime(a);
    const timeB = parseSessionTime(b);

    if (isAUpcoming && isBUpcoming) {
      return timeA - timeB;
    } else {
      return timeB - timeA;
    }
  });
}

interface OfficerSubmissionGuideProps {
  sessionName: string;
  selectedDate: string;
  isSubmitted: boolean;
  isClosed?: boolean;
  isExpired?: boolean;
  isAdmin?: boolean;
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
  isAdmin = false,
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
  const [countdown, setCountdown] = useState<CountdownInfo>(() => 
    calculateSessionCountdown(selectedDate, scheduledTime)
  );

  // Live timer countdown every 1 second
  useEffect(() => {
    const updateTimer = () => {
      setCountdown(calculateSessionCountdown(selectedDate, scheduledTime));
    };
    updateTimer();
    const timerId = setInterval(updateTimer, 1000);
    return () => clearInterval(timerId);
  }, [selectedDate, scheduledTime]);

  const isComplete = recordedCount >= totalStudents && totalStudents > 0;
  const progressPercent = totalStudents > 0 ? Math.round((recordedCount / totalStudents) * 100) : 0;
  const isUpcoming = countdown.isUpcoming;

  return (
    <div className={`border rounded-3xl p-5 shadow-xl space-y-4 text-left transition-all ${
      isClosed
        ? 'bg-slate-950 border-slate-800'
        : isUpcoming && !isAdmin
        ? 'bg-gradient-to-br from-slate-900 via-amber-950/30 to-slate-900 border-amber-500/50 shadow-amber-950/20'
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
              : isUpcoming && !isAdmin
              ? 'bg-gradient-to-tr from-amber-600 to-amber-500 text-slate-950 shadow-amber-950'
              : isSubmitted
              ? 'bg-emerald-600 text-white shadow-emerald-950'
              : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-purple-950'
          }`}>
            {isClosed ? (
              <Lock size={20} />
            ) : isUpcoming && !isAdmin ? (
              <Hourglass size={20} className="animate-spin duration-3000" />
            ) : isSubmitted ? (
              <ShieldCheck size={20} />
            ) : (
              <ClipboardCheck size={20} />
            )}
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-900/60 text-purple-200 border border-purple-700/50 text-[10px] font-bold uppercase mb-0.5">
              <Sparkles size={11} className="text-amber-400" /> 
              {isAdmin ? 'Panel Kontrol Administrator' : 'Panduan Petugas Lapangan'}
            </div>
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex flex-wrap items-center gap-2">
              <span>Sesi: <strong className="text-amber-300">{sessionName || 'Latihan Rutin'}</strong></span>
              
              {isClosed ? (
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold inline-flex items-center gap-1">
                  <Lock size={10} className="text-amber-400" /> Sesi Terkunci / Ditutup
                </span>
              ) : isUpcoming ? (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold inline-flex items-center gap-1">
                  <Timer size={10} /> Belum Mulai (Countdown)
                </span>
              ) : isExpired ? (
                <span className="px-2 py-0.5 rounded-md bg-rose-900/60 text-rose-300 border border-rose-700/50 text-[10px] font-bold inline-flex items-center gap-1">
                  <Clock size={10} /> Tanggal Lewat
                </span>
              ) : null}
            </h3>

            {/* Sub-details (Time, Location, Section) */}
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400">
              <span className="flex items-center gap-1 text-purple-300 font-semibold">
                <Calendar size={12} className="text-purple-400" /> {selectedDate}
              </span>
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

      {/* COUNTDOWN BANNER (IF UPCOMING / NOT STARTED YET) */}
      {isUpcoming && !isClosed && (
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
          isAdmin
            ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
            : 'bg-gradient-to-r from-amber-950/80 via-slate-950 to-amber-950/80 border-amber-500/60 text-amber-200 shadow-lg'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
              <Timer size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                ⏳ Sesi Latihan Belum Dimulai
              </div>
              <div className="text-sm sm:text-base font-black text-white font-mono tracking-wide">
                {countdown.formatted}
              </div>
              {!isAdmin && (
                <p className="text-[11px] text-amber-300/80 mt-0.5">
                  Input presensi dinonaktifkan otomatis sampai sesi latihan dimulai agar kehadiran tidak diisi mendahului waktu.
                </p>
              )}
            </div>
          </div>

          {isAdmin && (
            <div className="px-3 py-1.5 rounded-xl bg-purple-950 border border-purple-700/60 text-purple-300 text-[11px] font-bold shrink-0">
              🔓 Hak Akses Admin (Dapat Mengisi Lebih Awal)
            </div>
          )}
        </div>
      )}

      {/* LOCKED BANNER FOR NON-ADMIN */}
      {isClosed && !isAdmin && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3 text-xs text-slate-300">
          <Lock size={18} className="text-amber-400 shrink-0" />
          <div>
            <strong className="text-white">Sesi Ini Telah Terkunci & Selesai.</strong>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Hanya Administrator yang memiliki wewenang untuk membuka kunci atau mengubah data pada sesi yang telah ditutup.
            </p>
          </div>
        </div>
      )}

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
              ) : isUpcoming && !isAdmin ? (
                <span className="text-amber-300">
                  ⏳ Menunggu Waktu Sesi Dimulai
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
          {/* Only Admin can unlock/toggle close session */}
          {isAdmin && onToggleCloseSession && (
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

          {/* Submit button: enabled only if session is not closed and (admin or session has started) */}
          {!isClosed && !isSubmitted && (isAdmin || !isUpcoming) && (
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
      {isExpanded && (!isClosed || isAdmin) && (
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
              Klik <strong>Hadir (H)</strong>, <strong>Sakit (S)</strong>, <strong>Izin (I)</strong>, atau <strong>Alfa (A)</strong> pada setiap nama saat sesi dimulai.
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
              Tekan tombol <strong>"Submit Presensi Sesi Ini"</strong> agar data resmi masuk ke Rekapitulasi & Leaderboard Disiplin Korps.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
