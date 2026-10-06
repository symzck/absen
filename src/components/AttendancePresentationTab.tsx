import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Award, 
  Users, 
  Calendar, 
  Shield, 
  Star, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  Maximize2, 
  Minimize2, 
  FileText, 
  Filter,
  Flame,
  Crown,
  PieChart,
  Music,
  Download
} from 'lucide-react';
import { Student, DailyAttendance, SystemUser } from '../App';

interface AttendancePresentationTabProps {
  currentUser: SystemUser;
  students: Student[];
  attendances: DailyAttendance[];
  onNavigateTab: (tab: string) => void;
  triggerToast: (msg: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
}

export const AttendancePresentationTab: React.FC<AttendancePresentationTabProps> = ({
  currentUser,
  students,
  attendances,
  onNavigateTab,
  triggerToast
}) => {
  const [isFullscreenMode, setIsFullscreenMode] = useState(false);
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('All');

  // Filtered active students
  const activeStudents = useMemo(() => {
    return students.filter(s => s && s.name && s.name.trim() !== '');
  }, [students]);

  // Submitted / Active practice sessions
  // Hanya sesi yang sudah selesai dilaksanakan / memiliki data presensi
  const sessions = useMemo(() => {
    return attendances.filter(a => 
      a.isSubmitted === true || 
      (a.records && a.records.length > 0 && a.records.some(r => Boolean(r.status)))
    );
  }, [attendances]);

  const totalSessionsCount = sessions.length;
  const wajibSessions = sessions.filter(s => (s.sessionType || 'wajib') !== 'sunnah' && !s.sessionName?.toLowerCase().includes('sunnah'));
  const sunnahSessions = sessions.filter(s => s.sessionType === 'sunnah' || s.sessionName?.toLowerCase().includes('sunnah'));

  // Compute comprehensive stats per student
  const studentStats = useMemo(() => {
    return activeStudents.map(student => {
      let hadirCount = 0;
      let wajibHadirCount = 0;
      let sunnahHadirCount = 0;
      let izinCount = 0;
      let sakitCount = 0;
      let alfaCount = 0;

      const reasonsBreakdown: Record<string, number> = {
        'Pulang': 0,
        'Organisasi': 0,
        'Acara Sekolah': 0,
        'Acara Keluarga': 0,
        'Sakit': 0,
        'Lainnya': 0
      };

      sessions.forEach(sess => {
        const isSunnah = sess.sessionType === 'sunnah' || sess.sessionName?.toLowerCase().includes('sunnah');
        const rec = sess.records.find(r => r.studentId === student.id);
        if (rec) {
          if (rec.status === 'Hadir') {
            hadirCount++;
            if (isSunnah) sunnahHadirCount++;
            else wajibHadirCount++;
          } else if (rec.status === 'Izin') {
            izinCount++;
            const note = rec.note?.trim();
            if (note === 'Pulang') reasonsBreakdown['Pulang']++;
            else if (note === 'Organisasi') reasonsBreakdown['Organisasi']++;
            else if (note === 'Acara Sekolah') reasonsBreakdown['Acara Sekolah']++;
            else if (note === 'Acara Keluarga') reasonsBreakdown['Acara Keluarga']++;
            else reasonsBreakdown['Lainnya']++;
          } else if (rec.status === 'Sakit') {
            sakitCount++;
            reasonsBreakdown['Sakit']++;
          } else if (rec.status === 'Alfa') {
            alfaCount++;
          }
        }
      });

      const totalRecorded = hadirCount + izinCount + sakitCount + alfaCount;
      const rate = totalSessionsCount > 0 ? Math.round((hadirCount / totalSessionsCount) * 100) : 100;
      const wajibRate = wajibSessions.length > 0 ? Math.round((wajibHadirCount / wajibSessions.length) * 100) : rate;
      const totalScore = wajibRate + (sunnahHadirCount * 10);

      return {
        ...student,
        hadirCount,
        wajibHadirCount,
        sunnahHadirCount,
        izinCount,
        sakitCount,
        alfaCount,
        totalRecorded,
        rate,
        wajibRate,
        totalScore,
        reasonsBreakdown
      };
    });
  }, [activeStudents, sessions, totalSessionsCount, wajibSessions.length]);

  // Overall Corp Attendance Metrics
  const overallMetrics = useMemo(() => {
    if (studentStats.length === 0) {
      return {
        avgRate: 0,
        avgWajibRate: 0,
        totalPresent: 0,
        totalIzin: 0,
        totalSakit: 0,
        totalAlfa: 0,
        totalSunnahParticipants: 0,
        alasanCounts: {
          'Pulang': 0,
          'Organisasi': 0,
          'Acara Sekolah': 0,
          'Acara Keluarga': 0,
          'Sakit': 0,
          'Lainnya': 0
        }
      };
    }

    const totalRate = studentStats.reduce((acc, s) => acc + s.rate, 0);
    const totalWajibRate = studentStats.reduce((acc, s) => acc + s.wajibRate, 0);
    const totalPresent = studentStats.reduce((acc, s) => acc + s.hadirCount, 0);
    const totalIzin = studentStats.reduce((acc, s) => acc + s.izinCount, 0);
    const totalSakit = studentStats.reduce((acc, s) => acc + s.sakitCount, 0);
    const totalAlfa = studentStats.reduce((acc, s) => acc + s.alfaCount, 0);
    const totalSunnahParticipants = studentStats.filter(s => s.sunnahHadirCount > 0).length;

    const alasanCounts = {
      'Pulang': 0,
      'Organisasi': 0,
      'Acara Sekolah': 0,
      'Acara Keluarga': 0,
      'Sakit': 0,
      'Lainnya': 0
    };

    studentStats.forEach(s => {
      alasanCounts['Pulang'] += s.reasonsBreakdown['Pulang'];
      alasanCounts['Organisasi'] += s.reasonsBreakdown['Organisasi'];
      alasanCounts['Acara Sekolah'] += s.reasonsBreakdown['Acara Sekolah'];
      alasanCounts['Acara Keluarga'] += s.reasonsBreakdown['Acara Keluarga'];
      alasanCounts['Sakit'] += s.reasonsBreakdown['Sakit'];
      alasanCounts['Lainnya'] += s.reasonsBreakdown['Lainnya'];
    });

    return {
      avgRate: Math.round(totalRate / studentStats.length),
      avgWajibRate: Math.round(totalWajibRate / studentStats.length),
      totalPresent,
      totalIzin,
      totalSakit,
      totalAlfa,
      totalSunnahParticipants,
      alasanCounts
    };
  }, [studentStats]);

  // Section Comparison Metrics
  const sectionMetrics = useMemo(() => {
    const list = ['Brass', 'Battery', 'Cologuard', 'Pit'];
    return list.map(sec => {
      const secStudents = studentStats.filter(s => s.section === sec);
      const count = secStudents.length;
      if (count === 0) {
        return {
          section: sec,
          count: 0,
          avgRate: 0,
          hadir: 0,
          izin: 0,
          sakit: 0,
          alfa: 0,
          status: 'Belum Ada Pemain'
        };
      }
      const avgRate = Math.round(secStudents.reduce((acc, s) => acc + s.rate, 0) / count);
      const hadir = secStudents.reduce((acc, s) => acc + s.hadirCount, 0);
      const izin = secStudents.reduce((acc, s) => acc + s.izinCount, 0);
      const sakit = secStudents.reduce((acc, s) => acc + s.sakitCount, 0);
      const alfa = secStudents.reduce((acc, s) => acc + s.alfaCount, 0);

      let status = 'Sangat Disiplin';
      if (avgRate < 75) status = 'Perlu Binaan Khusus';
      else if (avgRate < 85) status = 'Cukup Disiplin';

      return {
        section: sec,
        count,
        avgRate,
        hadir,
        izin,
        sakit,
        alfa,
        status
      };
    }).sort((a, b) => b.avgRate - a.avgRate);
  }, [studentStats]);

  // Top 5 Star Performers
  const topPerformers = useMemo(() => {
    return [...studentStats]
      .sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        if (b.sunnahHadirCount !== a.sunnahHadirCount) return b.sunnahHadirCount - a.sunnahHadirCount;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 5);
  }, [studentStats]);

  // Print presentation report
  const handlePrint = () => {
    window.print();
  };

  const totalAbsences = overallMetrics.totalIzin + overallMetrics.totalSakit + overallMetrics.totalAlfa;

  return (
    <div className={`space-y-6 pb-20 text-left transition-all ${isFullscreenMode ? 'p-6 bg-slate-950 min-h-screen text-slate-100' : ''}`}>
      {/* 1. PRESENTATION HEADER & TOOLBAR */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-800/40 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 text-xs font-bold mb-2">
              <PieChart size={14} className="text-indigo-400" />
              <span>PRESENTASI EKSEKUTIF KEHADIRAN KORPS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Presentasi & Evaluasi Kehadiran PGT</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                Resmi
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Laporan visual menyeluruh tingkat kehadiran, kedisiplinan 4 unit section, dan evaluasi ketidakhadiran ({totalSessionsCount} Sesi Latihan Resmi · {activeStudents.length} Pemain).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsFullscreenMode(!isFullscreenMode)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Toggle Mode Layar Penuh"
            >
              {isFullscreenMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              <span>{isFullscreenMode ? 'Tampilan Normal' : 'Mode Layar Penuh'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-950/40 transition-all cursor-pointer"
            >
              <Printer size={14} />
              <span>Cetak / Cetak PDF</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('recap_reasons')}
              className="px-3.5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-950/40 transition-all cursor-pointer"
            >
              <FileText size={14} />
              <span>Buka Rekap Alasan</span>
            </button>
          </div>
        </div>

        {/* Quick Session Type Pills */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
          <span className="flex items-center gap-1.5">
            <Calendar size={13} className="text-purple-400" />
            Total: <strong>{totalSessionsCount} Sesi</strong>
          </span>
          <span>·</span>
          <span className="flex items-center gap-1.5">
            <Shield size={13} className="text-indigo-400" />
            Latihan Wajib: <strong>{wajibSessions.length} Sesi</strong>
          </span>
          <span>·</span>
          <span className="flex items-center gap-1.5">
            <Star size={13} className="text-amber-400" />
            Latihan Sunnah: <strong>{sunnahSessions.length} Sesi (+Bonus Poin)</strong>
          </span>
          <span>·</span>
          <span className="flex items-center gap-1.5">
            <Users size={13} className="text-emerald-400" />
            Pemain: <strong>{activeStudents.length} Anggota Terdaftar</strong>
          </span>
        </div>
      </div>

      {/* 2. EXECUTIVE KEY METRICS (KARTU STATISTIK BESAR) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Rata-Rata Kehadiran Keseluruhan */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Persentase Kehadiran</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-400 tabular-nums">
              {overallMetrics.avgRate}%
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Rata-rata kehadiran seluruh anggota korps
            </p>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-700" 
              style={{ width: `${overallMetrics.avgRate}%` }}
            ></div>
          </div>
        </div>

        {/* Metric 2: Kehadiran Sesi Wajib */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Latihan Wajib</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Shield size={16} />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-purple-300 tabular-nums">
              {overallMetrics.avgWajibRate}%
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Kedisiplinan pada {wajibSessions.length} sesi wajib
            </p>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div 
              className="bg-purple-500 h-full rounded-full transition-all duration-700" 
              style={{ width: `${overallMetrics.avgWajibRate}%` }}
            ></div>
          </div>
        </div>

        {/* Metric 3: Partisipasi Sesi Sunnah */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-amber-500/30 shadow-xl flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={12} className="text-amber-400" /> Sesi Sunnah
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Star size={16} />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-amber-300 tabular-nums">
              {overallMetrics.totalSunnahParticipants}
              <span className="text-sm font-bold text-slate-400 ml-1.5">Pemain</span>
            </div>
            <p className="text-[11px] text-amber-200/80 mt-1">
              Aktif hadir latihan sunnah (+10 poin bonus)
            </p>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div 
              className="bg-amber-400 h-full rounded-full transition-all duration-700" 
              style={{ width: `${activeStudents.length > 0 ? (overallMetrics.totalSunnahParticipants / activeStudents.length) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        {/* Metric 4: Total Izin & Halangan */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Izin / Halangan</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <AlertCircle size={16} />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-blue-300 tabular-nums">
              {totalAbsences}
              <span className="text-xs font-normal text-slate-400 ml-1.5">Catatan</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {overallMetrics.totalIzin} Izin · {overallMetrics.totalSakit} Sakit · {overallMetrics.totalAlfa} Alfa
            </p>
          </div>
          <div className="flex gap-1 h-2 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-full" style={{ width: `${totalAbsences > 0 ? (overallMetrics.totalIzin / totalAbsences) * 100 : 33}%` }} title="Izin"></div>
            <div className="bg-amber-500 h-full" style={{ width: `${totalAbsences > 0 ? (overallMetrics.totalSakit / totalAbsences) * 100 : 33}%` }} title="Sakit"></div>
            <div className="bg-rose-500 h-full" style={{ width: `${totalAbsences > 0 ? (overallMetrics.totalAlfa / totalAbsences) * 100 : 34}%` }} title="Alfa"></div>
          </div>
        </div>
      </div>

      {/* 3. SECTION DISCIPLINE COMPARISON (KOMPARASI 4 UNIT SECTION) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Music size={18} className="text-purple-400" />
              <span>Komparasi Kedisiplinan 4 Unit Section Marching Band</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tingkat kehadiran rata-rata per divisi instrumen untuk bahan evaluasi pelatih.
            </p>
          </div>

          <div className="text-xs font-bold text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            Peringkat Berdasarkan Persentase
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sectionMetrics.map((sec, idx) => {
            const isLeader = idx === 0;
            return (
              <div 
                key={sec.section}
                className={`p-5 rounded-2xl border transition-all ${
                  isLeader 
                    ? 'bg-gradient-to-br from-purple-950/60 to-slate-950 border-purple-500/50 shadow-lg shadow-purple-950/30' 
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center ${
                      idx === 0 
                        ? 'bg-amber-400 text-slate-950' 
                        : idx === 1 
                        ? 'bg-slate-700 text-white' 
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="font-extrabold text-white text-base flex items-center gap-2">
                        <span>Section {sec.section}</span>
                        {isLeader && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            👑 Terdisiplin
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">{sec.count} Pemain Terdaftar</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-black text-amber-300 tabular-nums">
                      {sec.avgRate}%
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      sec.avgRate >= 85 
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                        : sec.avgRate >= 75 
                        ? 'bg-blue-950 text-blue-300 border border-blue-800' 
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}>
                      {sec.status}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ${
                        isLeader 
                          ? 'bg-gradient-to-r from-purple-500 to-amber-400' 
                          : 'bg-purple-600'
                      }`}
                      style={{ width: `${sec.avgRate}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                    <span>Hadir: <strong className="text-emerald-400">{sec.hadir}</strong></span>
                    <span>Izin: <strong className="text-sky-400">{sec.izin}</strong></span>
                    <span>Sakit: <strong className="text-amber-400">{sec.sakit}</strong></span>
                    <span>Alfa: <strong className="text-rose-400">{sec.alfa}</strong></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. BREAKDOWN ALASAN KETIDAKHADIRAN (ALASAN RESMI IZIN & SAKIT) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold mb-1">
            <PieChart size={13} className="text-blue-400" />
            <span>ANALISIS KETIDAKHADIRAN RESMI</span>
          </div>
          <h2 className="text-lg font-black text-white">
            Distribusi Alasan Izin & Sakit Anggota
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Rincian 4 kategori resmi izin (Pulang, Organisasi, Acara Sekolah, Acara Keluarga) dan sakit pemain.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Pulang */}
          <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/30 space-y-1">
            <div className="text-[11px] font-bold text-blue-300 uppercase">Izin: Pulang</div>
            <div className="text-2xl font-black text-blue-200 tabular-nums">
              {overallMetrics.alasanCounts['Pulang']}
            </div>
            <div className="text-[10px] text-slate-400">Pulang ke rumah / asrama</div>
          </div>

          {/* 2. Organisasi */}
          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-1">
            <div className="text-[11px] font-bold text-indigo-300 uppercase">Izin: Organisasi</div>
            <div className="text-2xl font-black text-indigo-200 tabular-nums">
              {overallMetrics.alasanCounts['Organisasi']}
            </div>
            <div className="text-[10px] text-slate-400">Rapat / tugas organisasi</div>
          </div>

          {/* 3. Acara Sekolah */}
          <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 space-y-1">
            <div className="text-[11px] font-bold text-cyan-300 uppercase">Izin: Acara Sekolah</div>
            <div className="text-2xl font-black text-cyan-200 tabular-nums">
              {overallMetrics.alasanCounts['Acara Sekolah']}
            </div>
            <div className="text-[10px] text-slate-400">Dispensasi agenda madrasah</div>
          </div>

          {/* 4. Acara Keluarga */}
          <div className="p-4 rounded-2xl bg-sky-950/30 border border-sky-500/30 space-y-1">
            <div className="text-[11px] font-bold text-sky-300 uppercase">Izin: Acara Keluarga</div>
            <div className="text-2xl font-black text-sky-200 tabular-nums">
              {overallMetrics.alasanCounts['Acara Keluarga']}
            </div>
            <div className="text-[10px] text-slate-400">Keperluan wali/keluarga</div>
          </div>

          {/* 5. Sakit */}
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-1">
            <div className="text-[11px] font-bold text-amber-300 uppercase">Sakit</div>
            <div className="text-2xl font-black text-amber-200 tabular-nums">
              {overallMetrics.totalSakit}
            </div>
            <div className="text-[10px] text-slate-400">UKS / Rawat / Demam</div>
          </div>

          {/* 6. Alfa */}
          <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 space-y-1">
            <div className="text-[11px] font-bold text-rose-300 uppercase">Alfa (Tanpa Kabar)</div>
            <div className="text-2xl font-black text-rose-200 tabular-nums">
              {overallMetrics.totalAlfa}
            </div>
            <div className="text-[10px] text-slate-400">Tanpa konfirmasi</div>
          </div>
        </div>
      </div>

      {/* 5. TOP 5 PLAYERS OF THE CORP (PEMAIN TELADAN) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Award size={18} className="text-amber-400" />
              <span>Top 5 Pemain Paling Teladan & Disiplin</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Peringkat tertinggi berdasarkan skor kehadiran latihan wajib dan bonus latihan sunnah.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('recap')}
            className="text-xs text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1 cursor-pointer"
          >
            Lihat Semua Peringkat (Leaderboard Lengkap) →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {topPerformers.map((player, idx) => {
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
            return (
              <div 
                key={player.id} 
                className={`p-4 rounded-2xl border flex flex-col justify-between space-y-2.5 ${
                  idx === 0 
                    ? 'bg-amber-950/30 border-amber-500/50 shadow-md' 
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">{medal}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-800/60">
                    {player.section}
                  </span>
                </div>

                <div>
                  <div className="font-extrabold text-white text-xs line-clamp-1">{player.name}</div>
                  <div className="text-[10px] text-slate-400">Kls {player.kelas} · Asr {player.asrama}</div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Total Skor:</span>
                  <span className="font-black text-sm text-amber-300">{player.totalScore} Pts</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
