import React from 'react';
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
  TrendingUp,
  UserCheck,
  Music,
  Flame,
  ChevronRight
} from 'lucide-react';
import { Student, DailyAttendance, SystemUser } from '../App';
import { Announcement } from '../services/db';

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
  triggerToast
}) => {
  const isAdmin = currentUser.role === 'admin';

  // Format today date nicely in Indonesian
  const formattedDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Current session calculations
  const todaySession = attendances.find(a => a.date === selectedDate);
  const totalStudents = students.length;
  const records = todaySession?.records || [];
  const presentCount = records.filter(r => r.status === 'Hadir').length;
  const sickCount = records.filter(r => r.status === 'Sakit').length;
  const permitCount = records.filter(r => r.status === 'Izin').length;
  const absentCount = records.filter(r => r.status === 'Alfa').length;
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

  return (
    <div className="space-y-6 pb-24 md:pb-8">
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
              Pantau kedisiplinan <strong>43 pemain</strong>, umumkan informasi latihan terbaru, dan catat presensi lapangan dengan cepat serta tersinkronisasi.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Calendar size={14} className="text-purple-400" />
                {formattedDate}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Music size={14} className="text-amber-400" />
                Sesi: <strong className="text-amber-300">{currentSessionName || 'Latihan Rutin'}</strong>
              </span>
            </div>
          </div>

          {/* Quick Session Status Capsule */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto shrink-0">
            <div className={`p-4 rounded-2xl border backdrop-blur-sm shadow-lg ${
              todaySession?.isSubmitted 
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200' 
                : 'bg-amber-950/60 border-amber-500/50 text-amber-200'
            }`}>
              <div className="flex items-center gap-2.5">
                {todaySession?.isSubmitted ? (
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle size={18} className="text-amber-400 shrink-0" />
                )}
                <div>
                  <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Status Presensi Hari Ini</div>
                  <div className="text-sm font-extrabold text-white">
                    {todaySession?.isSubmitted ? 'Resmi Ter-submit' : 'Masih Draf (Siap Diisi)'}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab(isAdmin ? 'admin_dashboard' : 'petugas_absen')}
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

      {/* 3. QUICK NAVIGATION TILES (PINTAS CEPAT) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Sparkles size={18} className="text-amber-400" />
              Menu Pintas Utama
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Akses cepat seluruh fitur aplikasi dalam satu sentuhan.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Card 1: Presensi Seluruh Sesi */}
          <button
            type="button"
            onClick={() => onNavigateTab(isAdmin ? 'admin_dashboard' : 'petugas_absen')}
            className="p-4 rounded-2xl bg-slate-950/70 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-600/60 text-left transition-all group flex flex-col justify-between cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 group-hover:scale-110 flex items-center justify-center transition-transform">
                <ClipboardList size={20} />
              </div>
              <ArrowRight size={14} className="text-slate-600 group-hover:text-purple-400 transition-colors" />
            </div>
            <div>
              <div className="font-bold text-sm text-white group-hover:text-purple-300 transition-colors">
                Presensi Sesi
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Isi & submit daftar hadir
              </div>
            </div>
          </button>

          {/* Card 2: Edit Data Absen */}
          <button
            type="button"
            onClick={() => onNavigateTab(isAdmin ? 'edit_absensi' : 'my_history')}
            className="p-4 rounded-2xl bg-slate-950/70 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-600/60 text-left transition-all group flex flex-col justify-between cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 group-hover:scale-110 flex items-center justify-center transition-transform">
                <Edit3 size={20} />
              </div>
              <ArrowRight size={14} className="text-slate-600 group-hover:text-amber-400 transition-colors" />
            </div>
            <div>
              <div className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">
                {isAdmin ? 'Edit Data Absen' : 'Riwayat Absensi'}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {attendances.length} sesi tersimpan
              </div>
            </div>
          </button>

          {/* Card 3: Papan Informasi & Pengumuman (NEW FEATURE) */}
          <button
            type="button"
            onClick={() => onNavigateTab('announcements')}
            className="p-4 rounded-2xl bg-slate-950/70 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-600/60 text-left transition-all group flex flex-col justify-between cursor-pointer"
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
                Informasi & arahan admin
              </div>
            </div>
          </button>

          {/* Card 4: Database Pemain */}
          {isAdmin ? (
            <button
              type="button"
              onClick={() => onNavigateTab('members')}
              className="p-4 rounded-2xl bg-slate-950/70 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-600/60 text-left transition-all group flex flex-col justify-between cursor-pointer"
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
                  {students.length} anggota marching band
                </div>
              </div>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigateTab('recap')}
              className="p-4 rounded-2xl bg-slate-950/70 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-600/60 text-left transition-all group flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 group-hover:scale-110 flex items-center justify-center transition-transform">
                  <Trophy size={20} />
                </div>
                <ArrowRight size={14} className="text-slate-600 group-hover:text-amber-400 transition-colors" />
              </div>
              <div>
                <div className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">
                  Leaderboard Section
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Peringkat disiplin korps
                </div>
              </div>
            </button>
          )}

          {/* Card 5: Rekapitulasi & Leaderboard (Admin) */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => onNavigateTab('recap')}
              className="p-4 rounded-2xl bg-slate-950/70 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-600/60 text-left transition-all group flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 group-hover:scale-110 flex items-center justify-center transition-transform">
                  <BarChart3 size={20} />
                </div>
                <ArrowRight size={14} className="text-slate-600 group-hover:text-amber-400 transition-colors" />
              </div>
              <div>
                <div className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">
                  Rekap & Ranking
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Evaluasi & export Excel
                </div>
              </div>
            </button>
          )}

          {/* Card 6: Google Sheets Sync (Admin) */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => onNavigateTab('google_sheets')}
              className="p-4 rounded-2xl bg-slate-950/70 hover:bg-emerald-950/30 border border-slate-800 hover:border-emerald-500/50 text-left transition-all group flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 group-hover:scale-110 flex items-center justify-center transition-transform">
                  <FileSpreadsheet size={20} />
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold">
                  Sheets
                </span>
              </div>
              <div>
                <div className="font-bold text-sm text-white group-hover:text-emerald-300 transition-colors">
                  Google Sheets
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Ekspor otomatis ke Spreadsheet
                </div>
              </div>
            </button>
          )}

          {/* Card 7: Kelola Akun & Petugas (Admin) */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => onNavigateTab('manage_users')}
              className="p-4 rounded-2xl bg-slate-950/70 hover:bg-indigo-950/30 border border-slate-800 hover:border-indigo-500/50 text-left transition-all group flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 group-hover:scale-110 flex items-center justify-center transition-transform">
                  <Shield size={20} />
                </div>
                <ArrowRight size={14} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
              </div>
              <div>
                <div className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors">
                  Kelola Petugas
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Akun & hak akses lapangan
                </div>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* 4. PAPAN INFORMASI & PENGUMUMAN TERBARU (LIVE CARDS) */}
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

      {/* 5. STATISTIK PER SECTION INSTRUMEN */}
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
