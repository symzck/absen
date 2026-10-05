import React from 'react';
import { sortSessionsByClosest } from './OfficerSubmissionGuide';
import { 
  ClipboardList, 
  Edit3, 
  Users, 
  BarChart3, 
  FileSpreadsheet, 
  Shield, 
  Megaphone, 
  Trophy, 
  Sparkles, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Pin,
  MapPin,
  Plus,
  Music,
  ChevronRight,
  Lock,
  Unlock,
  Timer
} from 'lucide-react';
import { Student, DailyAttendance, SystemUser } from '../App';
import { Announcement } from '../services/db';
import { calculateSessionCountdown } from './OfficerSubmissionGuide';

interface HomeDashboardTabProps {
  currentUser: SystemUser;
  students: Student[];
  attendances: DailyAttendance[];
  announcements: Announcement[];
  selectedDate: string;
  currentSessionName: string;
  onNavigateTab: (tab: string) => void;
  onSelectAnnouncement?: (ann: Announcement) => void;
  onOpenAddMember?: () => void;
  onOpenAddAnnouncement?: () => void;
  onOpenScheduleModal?: (session?: DailyAttendance) => void;
  onSelectDate?: (date: string) => void;
  triggerToast: (msg: string, type?: 'success' | 'warning' | 'info') => void;
}

export const HomeDashboardTab: React.FC<HomeDashboardTabProps> = ({
  currentUser,
  students,
  attendances,
  announcements,
  selectedDate,
  currentSessionName,
  onNavigateTab,
  onSelectAnnouncement,
  onOpenAddMember,
  onOpenAddAnnouncement,
  onOpenScheduleModal,
  onSelectDate,
  triggerToast
}) => {
  const isAdmin = currentUser.role === 'admin';
  const todayStr = new Date().toISOString().split('T')[0];

  // Format today date nicely in Indonesian
  const formattedDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Scheduled practice sessions list:
  // Sort by closest date/time first (today/closest upcoming session #1)
  const scheduledSessions = sortSessionsByClosest(attendances);
  const isTodayPracticeDay = attendances.some(a => a.date === todayStr);

  // Current session calculations
  const todaySession = attendances.find(a => a.date === selectedDate);
  const totalStudents = students.length;
  const records = todaySession?.records || [];
  const presentCount = records.filter(r => r.status === 'Hadir').length;
  const recordedCount = records.filter(r => Boolean(r.status)).length;
  const presentRate = recordedCount > 0 ? Math.round((presentCount / recordedCount) * 100) : 0;

  // Section breakdown
  const sections = ['Brass', 'Cologuard', 'Battery', 'Pit'];
  const sectionStats = sections.map(sec => {
    const secStudents = students.filter(s => s.section === sec);
    const secStudentIds = new Set(secStudents.map(s => s.id));
    const secRecords = records.filter(r => secStudentIds.has(r.studentId));
    const secPresent = secRecords.filter(r => r.status === 'Hadir').length;
    const secRecorded = secRecords.filter(r => Boolean(r.status)).length;
    const rate = secRecorded > 0 ? Math.round((secPresent / secRecorded) * 100) : 0;
    return {
      section: sec,
      count: secStudents.length,
      present: secPresent,
      rate
    };
  });

  // Announcements to display (pinned first, max 3)
  const displayAnnouncements = [...announcements]
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.createdAt.localeCompare(a.createdAt);
    })
    .slice(0, 3);

  // Top Section by attendance
  const topSection = [...sectionStats].sort((a, b) => b.rate - a.rate)[0];

  const handleSelectSessionDate = (dateStr: string) => {
    if (onSelectDate) onSelectDate(dateStr);
    onNavigateTab('attendance');
    triggerToast(`Sesi latihan tanggal ${dateStr} dipilih.`, 'info');
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8 text-left">
      {/* 1. HERO WELCOME BANNER */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-purple-950/80 to-slate-900 border border-purple-800/40 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/60 border border-purple-600/40 text-purple-200 text-xs font-semibold">
              <Sparkles size={14} className="text-amber-400" />
              <span>Portal Terpadu Marching Band PGT Mu'allimin</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Selamat Bertugas, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">{currentUser.fullName}</span>! 👋
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Pantau kedisiplinan <strong>{totalStudents} pemain</strong>, jadwalkan sesi latihan korps, dan catat presensi lapangan secara otomatis dan fleksibel.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Calendar size={14} className="text-purple-400" />
                {formattedDate}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Clock size={14} className="text-amber-400" />
                {isTodayPracticeDay ? (
                  <strong className="text-emerald-400">Hari Ini Ada Jadwal Latihan!</strong>
                ) : (
                  <span>Bukan Hari Latihan Reguler</span>
                )}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Music size={14} className="text-amber-400" />
                Sesi: <strong className="text-amber-300">{currentSessionName || 'Latihan Rutin'}</strong>
              </span>
            </div>
          </div>

          {/* Quick Session Status Capsule & Action */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto shrink-0">
            <div className={`p-4 rounded-2xl border backdrop-blur-sm shadow-lg ${
              isTodayPracticeDay 
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200' 
                : 'bg-amber-950/60 border-amber-500/50 text-amber-200'
            }`}>
              <div className="flex items-center gap-2.5">
                {isTodayPracticeDay ? (
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle size={18} className="text-amber-400 shrink-0" />
                )}
                <div>
                  <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Status Jadwal Hari Ini</div>
                  <div className="text-sm font-extrabold text-white">
                    {isTodayPracticeDay ? 'Jadwal Latihan Resmi Aktif' : 'Bukan Jadwal Latihan Harian'}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('attendance')}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-950/50 transition-all active:scale-95 cursor-pointer"
            >
              <ClipboardList size={16} />
              <span>Buka Presensi Hari Ini</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. STATS ROW (4 METRICS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-md hover:border-purple-600/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Anggota Aktif</span>
            <Users size={16} className="text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-1 tabular-nums">
            {totalStudents}
          </div>
          <div className="text-[11px] text-purple-300 mt-1 font-medium flex items-center gap-1">
            <span>4 Section Instrumen</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-md hover:border-emerald-600/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Kehadiran Sesi Ini</span>
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1 tabular-nums">
            {presentRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            <strong className="text-white">{presentCount}</strong> hadir dari {totalStudents} pemain
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-md hover:border-amber-600/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Top Section Hari Ini</span>
            <Trophy size={16} className="text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-300 mt-1 truncate">
            {topSection ? topSection.section : '-'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {topSection && topSection.count > 0 ? `${topSection.present}/${topSection.count} Pemain Hadir (${topSection.rate}%)` : 'Belum ada data'}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-md hover:border-indigo-600/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Pengumuman Aktif</span>
            <Megaphone size={16} className="text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-1 tabular-nums">
            {announcements.length}
          </div>
          <div className="text-[11px] text-indigo-300 mt-1 font-medium flex items-center gap-1">
            <span>{announcements.filter(a => a.pinned).length} Pesan Disematkan</span>
          </div>
        </div>
      </div>

      {/* 3. JADWAL & SESI LATIHAN KORPS (DIATUR ADMIN) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-900/40 text-amber-300 border border-amber-700/40 text-[11px] font-semibold mb-1">
              <Calendar size={12} className="text-amber-400" /> Sesi Latihan Resmi (Diatur Admin)
            </div>
            <h2 className="text-lg font-black text-white tracking-tight">Jadwal & Agenda Latihan Korps</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Latihan tidak dilaksanakan setiap hari. Admin mengatur tanggal & waktu sesi latihan resmi.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && onOpenScheduleModal && (
              <button
                type="button"
                onClick={() => onOpenScheduleModal()}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <Plus size={15} />
                <span>+ Jadwalkan Sesi Latihan</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigateTab('sessions')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Semua Sesi ({scheduledSessions.length})</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {scheduledSessions.length === 0 ? (
          <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 text-slate-400 text-xs space-y-3">
            <Calendar size={28} className="mx-auto text-slate-600" />
            <p className="font-semibold text-slate-300">Belum ada sesi latihan yang dijadwalkan oleh Admin.</p>
            {isAdmin && onOpenScheduleModal && (
              <button
                type="button"
                onClick={() => onOpenScheduleModal()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>Buat Jadwal Latihan Pertama</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {scheduledSessions.slice(0, 3).map((session) => {
              const isSubmitted = session.isSubmitted !== false;
              const isClosed = session.isClosed === true;
              const isExpired = session.date < todayStr && !isClosed;
              const isToday = session.date === todayStr;
              const countdown = calculateSessionCountdown(session.date, session.scheduledTime);
              const isUpcoming = countdown.isUpcoming;

              return (
                <div
                  key={session.id || session.date}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 shadow-md ${
                    isClosed
                      ? 'bg-slate-950/80 border-slate-800 opacity-80'
                      : isExpired
                      ? 'bg-rose-950/20 border-rose-800/40'
                      : isUpcoming && !isAdmin
                      ? 'bg-amber-950/20 border-amber-500/40 shadow-amber-950/20'
                      : isToday
                      ? 'bg-purple-950/40 border-purple-500 hover:border-purple-400'
                      : 'bg-slate-950 border-slate-800 hover:border-purple-600/50'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-purple-900/40 text-purple-300 border-purple-700/50 flex items-center gap-1">
                        <Calendar size={11} /> {session.date} {isToday ? '(Hari Ini)' : ''}
                      </span>

                      {isClosed ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                          <Lock size={10} className="text-amber-400" /> Selesai / Ditutup
                        </span>
                      ) : isUpcoming ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                          <Timer size={10} /> {countdown.formatted}
                        </span>
                      ) : isExpired ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                          <Clock size={10} /> Expired
                        </span>
                      ) : isSubmitted ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <CheckCircle2 size={10} /> Ter-submit
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Draf Aktif
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm text-white line-clamp-1">
                      {session.sessionName || 'Latihan Rutin'}
                    </h3>

                    <div className="space-y-1 text-xs text-slate-400">
                      {session.scheduledTime && (
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="text-purple-400 shrink-0" />
                          <span>{session.scheduledTime}</span>
                        </div>
                      )}
                      {session.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin size={12} className="text-amber-400 shrink-0" />
                          <span className="truncate">{session.location}</span>
                        </div>
                      )}
                      {session.targetSection && session.targetSection !== 'All' && (
                        <div className="text-[11px] text-purple-300 font-medium">
                          Unit: Section {session.targetSection}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectSessionDate(session.date)}
                      className="flex-1 py-1.5 px-3 bg-purple-700/30 hover:bg-purple-700/50 border border-purple-600/40 text-purple-200 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>{isClosed ? 'Lihat Presensi' : isUpcoming && !isAdmin ? '⏳ Buka Sesi (Countdown)' : 'Presensi Sesi Ini'}</span>
                      <ArrowRight size={13} />
                    </button>

                    {isAdmin && onOpenScheduleModal && (
                      <button
                        type="button"
                        onClick={() => onOpenScheduleModal(session)}
                        className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                        title="Edit jadwal sesi ini"
                      >
                        <Edit3 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3.5 ARAHAN & PANDUAN KERJA PRESENSI SESI LATIHAN */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-600/40 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 text-[11px] font-bold mb-1">
              <Sparkles size={12} className="text-amber-400" /> Panduan & Alur Kerja Latihan
            </div>
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
              Alur Kerja Presensi Sesi Latihan Marching Band
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              {scheduledSessions.length > 0
                ? `Tersedia ${scheduledSessions.length} sesi latihan korps. Ikuti alur pelaksanaan presensi berikut:`
                : 'Ikuti tahapan berikut setiap kali ada sesi latihan korps yang dijadwalkan:'}
            </p>
          </div>

          {scheduledSessions.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const targetDate = scheduledSessions[0]?.date || todayStr;
                handleSelectSessionDate(targetDate);
              }}
              className="px-4 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer shrink-0"
            >
              <span>Buka Sesi Terdekat ({scheduledSessions[0]?.date})</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-xl bg-purple-950 border border-purple-700 text-purple-300 text-xs font-black flex items-center justify-center">1</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Pilih Sesi</span>
            </div>
            <h4 className="font-extrabold text-sm text-white">Buka Sesi Latihan</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pilih tanggal sesi latihan resmi dari daftar jadwal atau klik <em>"Presensi Sesi Ini"</em> untuk mulai mendata.
            </p>
          </div>

          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-xl bg-purple-950 border border-purple-700 text-purple-300 text-xs font-black flex items-center justify-center">2</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Isi Kehadiran</span>
            </div>
            <h4 className="font-extrabold text-sm text-white">Tandai Status Pemain</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tandai status kehadiran pemain (Hadir, Sakit, Izin, Alfa). Gunakan tombol <em>"Hadir Semua"</em> atau <em>"Mode Presensi Kertas"</em>.
            </p>
          </div>

          <div className="p-4 bg-emerald-950/20 border border-emerald-800/60 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="w-6 h-6 rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-300 text-xs font-black flex items-center justify-center">3</span>
              <span className="text-[10px] font-bold text-emerald-400 uppercase">Submit Laporan</span>
            </div>
            <h4 className="font-extrabold text-sm text-emerald-300">Finalisasi & Submit</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Klik <strong>"Finalisasi Presensi"</strong> setelah seluruh anggota diabsen. Data langsung tersinkron ke Rekapitulasi & Leaderboard.
            </p>
          </div>
        </div>
      </div>

      {/* 4. QUICK NAVIGATION TILES (MENU PINTAS UTAMA - SAMA UNTUK SEMUA PENGGUNA) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Sparkles size={18} className="text-amber-400" />
              Menu Pintas Utama
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Akses cepat seluruh fitur aplikasi dalam satu sentuhan (Tersedia untuk Admin dan Petugas).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Tile 1: Presensi Latihan */}
          <button
            type="button"
            onClick={() => onNavigateTab('attendance')}
            className="p-4 rounded-2xl bg-purple-950/30 hover:bg-purple-900/40 border border-purple-500/30 hover:border-purple-400 text-left transition-all group flex flex-col justify-between cursor-pointer shadow-md"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 group-hover:scale-110 flex items-center justify-center transition-transform shadow-lg">
                <ClipboardList size={20} />
              </div>
              <ArrowRight size={14} className="text-slate-600 group-hover:text-purple-400 transition-colors" />
            </div>
            <div>
              <div className="font-bold text-sm text-white group-hover:text-purple-300 transition-colors">
                Presensi Latihan
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Input & monitoring presensi
              </div>
            </div>
          </button>

          {/* Tile 2: Jadwal & Sesi Latihan */}
          <button
            type="button"
            onClick={() => onNavigateTab('sessions')}
            className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-600/60 text-left transition-all group flex flex-col justify-between cursor-pointer shadow-md"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 group-hover:scale-110 flex items-center justify-center transition-transform">
                <Calendar size={20} />
              </div>
              <ArrowRight size={14} className="text-slate-600 group-hover:text-purple-400 transition-colors" />
            </div>
            <div>
              <div className="font-bold text-sm text-white group-hover:text-purple-300 transition-colors">
                Jadwal & Sesi Latihan
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {attendances.length} sesi terdaftar
              </div>
            </div>
          </button>

          {/* Tile 3: Papan Pengumuman */}
          <button
            type="button"
            onClick={() => onNavigateTab('announcements')}
            className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-sky-600/60 text-left transition-all group flex flex-col justify-between cursor-pointer shadow-md"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-sky-600/20 text-sky-400 group-hover:scale-110 flex items-center justify-center transition-transform">
                <Megaphone size={20} />
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-950 border border-sky-800 text-sky-300 font-bold">
                {announcements.length} Info
              </span>
            </div>
            <div>
              <div className="font-bold text-sm text-white group-hover:text-sky-300 transition-colors">
                Papan Pengumuman
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Arahan resmi & info terbaru
              </div>
            </div>
          </button>

          {/* Tile 4: Database Pemain */}
          <button
            type="button"
            onClick={() => onNavigateTab('members')}
            className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-600/60 text-left transition-all group flex flex-col justify-between cursor-pointer shadow-md"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 group-hover:scale-110 flex items-center justify-center transition-transform">
                <Users size={20} />
              </div>
              <ArrowRight size={14} className="text-slate-600 group-hover:text-emerald-400 transition-colors" />
            </div>
            <div>
              <div className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
                Database Pemain
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {students.length} pemain terdaftar
              </div>
            </div>
          </button>

          {/* Tile 5: Rekapitulasi & Leaderboard */}
          <button
            type="button"
            onClick={() => onNavigateTab('recap')}
            className="p-4 rounded-2xl bg-amber-950/20 hover:bg-amber-900/30 border border-amber-500/20 hover:border-amber-400/50 text-left transition-all group flex flex-col justify-between cursor-pointer shadow-md"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 group-hover:scale-110 flex items-center justify-center transition-transform shadow-lg">
                <BarChart3 size={20} />
              </div>
              <ArrowRight size={14} className="text-slate-600 group-hover:text-amber-400 transition-colors" />
            </div>
            <div>
              <div className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">
                Rekap & Leaderboard
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Ranking disiplin section
              </div>
            </div>
          </button>

          {/* Tile 6: Google Sheets Sync */}
          <button
            type="button"
            onClick={() => onNavigateTab('google_sheets')}
            className="p-4 rounded-2xl bg-emerald-950/20 hover:bg-emerald-900/30 border border-emerald-500/20 hover:border-emerald-500/50 text-left transition-all group flex flex-col justify-between cursor-pointer shadow-md"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                <FileSpreadsheet size={20} />
              </div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Cloud</span>
            </div>
            <div>
              <div className="font-bold text-sm text-white">Google Sheets</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Sinkron & ekspor spreadsheet</div>
            </div>
          </button>

          {/* Tile 7: Kelola / Direktori Petugas */}
          <button
            type="button"
            onClick={() => onNavigateTab('manage_users')}
            className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 text-left transition-all group flex flex-col justify-between cursor-pointer shadow-md"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
                <Shield size={20} />
              </div>
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Tim</span>
            </div>
            <div>
              <div className="font-bold text-sm text-white">Kelola & Kontak Petugas</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Daftar akun & pengurus korps</div>
            </div>
          </button>

          {/* Tile 8: Ringkasan Sesi */}
          <button
            type="button"
            onClick={() => onNavigateTab('my_history')}
            className="p-4 rounded-2xl bg-indigo-950/20 hover:bg-indigo-900/30 border border-indigo-500/20 hover:border-indigo-400/50 text-left transition-all group flex flex-col justify-between cursor-pointer shadow-md"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                <Clock size={20} />
              </div>
              <ArrowRight size={14} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
            </div>
            <div>
              <div className="font-bold text-sm text-white">Ringkasan Sesi</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Statistik & log latihan</div>
            </div>
          </button>
        </div>
      </div>

      {/* 5. PAPAN INFORMASI & PENGUMUMAN TERBARU (LIVE CARDS) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-sky-900/40 text-sky-300 border border-sky-700/40 text-[11px] font-semibold mb-1">
              <Megaphone size={12} className="text-amber-400" /> Informasi Resmi Korps
            </div>
            <h2 className="text-lg font-black text-white tracking-tight">Papan Pengumuman & Arahan Pelatih</h2>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && onOpenAddAnnouncement && (
              <button
                type="button"
                onClick={onOpenAddAnnouncement}
                className="px-3.5 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-purple-950 transition-all cursor-pointer"
              >
                <span>+ Buat Pengumuman</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onNavigateTab('announcements')}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Lihat Semua ({announcements.length})</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {displayAnnouncements.length === 0 ? (
          <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 text-slate-400 text-xs">
            Belum ada pengumuman yang dipublikasikan.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {displayAnnouncements.map((ann) => {
              const isUrgent = ann.category === 'urgent';
              const isSchedule = ann.category === 'schedule';
              const isPraise = ann.category === 'praise';

              const badgeColor = isUrgent 
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                : isSchedule 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : isPraise
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-sky-500/20 text-sky-300 border-sky-500/40';

              const badgeLabel = isUrgent ? 'Mendesak' : isSchedule ? 'Jadwal' : isPraise ? 'Apresiasi' : 'Info';

              return (
                <div
                  key={ann.id}
                  onClick={() => onNavigateTab('announcements')}
                  className="bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-purple-600/50 p-4 rounded-2xl transition-all cursor-pointer flex flex-col justify-between space-y-3 group shadow-md"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                        {badgeLabel}
                      </span>
                      {ann.pinned && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400">
                          <Pin size={11} className="fill-amber-400" />
                          <span>Pinned</span>
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm text-white group-hover:text-purple-300 transition-colors line-clamp-2 leading-snug">
                      {ann.title}
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                      {ann.content}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="truncate">{ann.author}</span>
                    <span>{ann.createdAt}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. STATISTIK PER SECTION INSTRUMEN */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Music size={18} className="text-amber-400" />
              Kehadiran & Kekuatan Section Latihan Hari Ini
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Rincian kehadiran 4 unit instrumen marching band PGT Mu'allimin.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {sectionStats.map(stat => (
            <div key={stat.section} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-sm text-white">{stat.section}</span>
                <span className="text-xs font-mono font-bold text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded-lg border border-purple-800/50">
                  {stat.count} Pemain
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-black text-emerald-400 tabular-nums">
                  {stat.present} <span className="text-xs text-slate-500 font-normal">Hadir</span>
                </div>
                <div className="text-sm font-black text-amber-300">
                  {stat.rate}%
                </div>
              </div>

              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    stat.rate >= 80 ? 'bg-emerald-500' : stat.rate >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${stat.rate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
