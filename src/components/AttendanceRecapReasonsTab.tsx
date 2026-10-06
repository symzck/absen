import React, { useState, useMemo } from 'react';
import { 
  FileSpreadsheet, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Calendar, 
  Users, 
  Shield, 
  Star, 
  Sparkles, 
  FileText, 
  ChevronRight, 
  X, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Eye,
  Tag,
  Building,
  Home,
  School,
  GraduationCap,
  PieChart
} from 'lucide-react';
import { Student, DailyAttendance, SystemUser } from '../App';

export interface AbsenceRecord {
  date: string;
  sessionName: string;
  status: 'Izin' | 'Sakit' | 'Alfa';
  reason: string;
}

export interface StudentRecapItem extends Student {
  hadirCount: number;
  wajibHadirCount: number;
  sunnahHadirCount: number;
  izinCount: number;
  sakitCount: number;
  alfaCount: number;
  totalRecorded: number;
  percentage: number;
  wajibPercentage: number;
  totalScore: number;
  absenceRecords: AbsenceRecord[];
  notesString: string;
  reasonsSummary: {
    pulang: number;
    organisasi: number;
    acaraSekolah: number;
    acaraKeluarga: number;
    sakit: number;
    alfa: number;
    lainnya: number;
  };
}

interface AttendanceRecapReasonsTabProps {
  currentUser: SystemUser;
  students: Student[];
  attendances: DailyAttendance[];
  onNavigateTab: (tab: string) => void;
  triggerToast: (msg: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
}

export const AttendanceRecapReasonsTab: React.FC<AttendanceRecapReasonsTabProps> = ({
  currentUser,
  students,
  attendances,
  onNavigateTab,
  triggerToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState('All');
  const [selectedReasonFilter, setSelectedReasonFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'members' | 'sessions_log'>('members');
  const [selectedSessionDate, setSelectedSessionDate] = useState<string>('all');
  
  // Modal detail for single student's complete reasons history
  const [inspectingStudent, setInspectingStudent] = useState<StudentRecapItem | null>(null);

  // Active registered students
  const activeStudents = useMemo(() => {
    return students.filter(s => s && s.name && s.name.trim() !== '');
  }, [students]);

  // Submitted / Active practice sessions
  const sessions = useMemo(() => {
    return attendances.filter(a => a.isSubmitted !== false);
  }, [attendances]);

  const totalSessionsCount = sessions.length;
  const wajibSessions = sessions.filter(s => (s.sessionType || 'wajib') !== 'sunnah' && !s.sessionName?.toLowerCase().includes('sunnah'));
  const sunnahSessions = sessions.filter(s => s.sessionType === 'sunnah' || s.sessionName?.toLowerCase().includes('sunnah'));

  // Compile full recap per student with detailed reasons list
  const fullRecapData: StudentRecapItem[] = useMemo(() => {
    return activeStudents.map(student => {
      let hadirCount = 0;
      let wajibHadirCount = 0;
      let sunnahHadirCount = 0;
      let izinCount = 0;
      let sakitCount = 0;
      let alfaCount = 0;

      const absenceRecords: AbsenceRecord[] = [];
      const reasonsSummary = {
        pulang: 0,
        organisasi: 0,
        acaraSekolah: 0,
        acaraKeluarga: 0,
        sakit: 0,
        alfa: 0,
        lainnya: 0
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
            const reason = rec.note?.trim() || 'Izin';
            absenceRecords.push({
              date: sess.date,
              sessionName: sess.sessionName || 'Latihan Korps',
              status: 'Izin',
              reason
            });

            if (reason === 'Pulang') reasonsSummary.pulang++;
            else if (reason === 'Organisasi') reasonsSummary.organisasi++;
            else if (reason === 'Acara Sekolah') reasonsSummary.acaraSekolah++;
            else if (reason === 'Acara Keluarga') reasonsSummary.acaraKeluarga++;
            else reasonsSummary.lainnya++;
          } else if (rec.status === 'Sakit') {
            sakitCount++;
            const reason = rec.note?.trim() || 'Sakit';
            absenceRecords.push({
              date: sess.date,
              sessionName: sess.sessionName || 'Latihan Korps',
              status: 'Sakit',
              reason
            });
            reasonsSummary.sakit++;
          } else if (rec.status === 'Alfa') {
            alfaCount++;
            const reason = rec.note?.trim() || 'Tanpa Keterangan';
            absenceRecords.push({
              date: sess.date,
              sessionName: sess.sessionName || 'Latihan Korps',
              status: 'Alfa',
              reason
            });
            reasonsSummary.alfa++;
          }
        }
      });

      const totalRecorded = hadirCount + izinCount + sakitCount + alfaCount;
      const percentage = totalSessionsCount > 0 ? Math.round((hadirCount / totalSessionsCount) * 100) : 100;
      const wajibPercentage = wajibSessions.length > 0 ? Math.round((wajibHadirCount / wajibSessions.length) * 100) : percentage;
      const totalScore = wajibPercentage + (sunnahHadirCount * 10);

      const notesString = absenceRecords.map(a => `(${a.date}: ${a.status} - ${a.reason})`).join('; ') || 'Tidak ada catatan';

      return {
        ...student,
        hadirCount,
        wajibHadirCount,
        sunnahHadirCount,
        izinCount,
        sakitCount,
        alfaCount,
        totalRecorded,
        percentage,
        wajibPercentage,
        totalScore,
        absenceRecords,
        notesString,
        reasonsSummary
      };
    });
  }, [activeStudents, sessions, totalSessionsCount, wajibSessions.length]);

  // Overall count of each reason
  const totals = useMemo(() => {
    let pulang = 0;
    let organisasi = 0;
    let acaraSekolah = 0;
    let acaraKeluarga = 0;
    let sakit = 0;
    let alfa = 0;
    let totalAbsences = 0;

    fullRecapData.forEach(item => {
      pulang += item.reasonsSummary.pulang;
      organisasi += item.reasonsSummary.organisasi;
      acaraSekolah += item.reasonsSummary.acaraSekolah;
      acaraKeluarga += item.reasonsSummary.acaraKeluarga;
      sakit += item.reasonsSummary.sakit;
      alfa += item.reasonsSummary.alfa;
      totalAbsences += item.absenceRecords.length;
    });

    return {
      pulang,
      organisasi,
      acaraSekolah,
      acaraKeluarga,
      sakit,
      alfa,
      totalAbsences
    };
  }, [fullRecapData]);

  // Filtered students for table view
  const filteredStudents = useMemo(() => {
    return fullRecapData.filter(student => {
      // 1. Section Filter
      if (selectedSection !== 'All' && student.section !== selectedSection) {
        return false;
      }

      // 2. Reason Filter
      if (selectedReasonFilter === 'pulang' && student.reasonsSummary.pulang === 0) return false;
      if (selectedReasonFilter === 'organisasi' && student.reasonsSummary.organisasi === 0) return false;
      if (selectedReasonFilter === 'acaraSekolah' && student.reasonsSummary.acaraSekolah === 0) return false;
      if (selectedReasonFilter === 'acaraKeluarga' && student.reasonsSummary.acaraKeluarga === 0) return false;
      if (selectedReasonFilter === 'sakit' && student.reasonsSummary.sakit === 0) return false;
      if (selectedReasonFilter === 'alfa' && student.reasonsSummary.alfa === 0) return false;
      if (selectedReasonFilter === 'perfect' && student.absenceRecords.length > 0) return false;
      if (selectedReasonFilter === 'has_absence' && student.absenceRecords.length === 0) return false;

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = student.name.toLowerCase().includes(q);
        const matchKelas = (student.kelas || '').toLowerCase().includes(q);
        const matchAsrama = (student.asrama || '').toLowerCase().includes(q);
        const matchSection = (student.section || '').toLowerCase().includes(q);
        const matchNotes = student.notesString.toLowerCase().includes(q);
        if (!matchName && !matchKelas && !matchAsrama && !matchSection && !matchNotes) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      // Default: sort by attendance rate descending, then name
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      return a.name.localeCompare(b.name);
    });
  }, [fullRecapData, selectedSection, selectedReasonFilter, searchQuery]);

  // Chronological Log of Absences across sessions
  const chronologicalLog = useMemo(() => {
    const list: Array<{
      date: string;
      sessionName: string;
      studentId: number;
      studentName: string;
      section: string;
      kelas: string;
      status: 'Izin' | 'Sakit' | 'Alfa';
      reason: string;
    }> = [];

    sessions.forEach(sess => {
      if (selectedSessionDate !== 'all' && sess.date !== selectedSessionDate) return;

      sess.records.forEach(rec => {
        if (rec.status === 'Izin' || rec.status === 'Sakit' || rec.status === 'Alfa') {
          const student = activeStudents.find(s => s.id === rec.studentId);
          if (student) {
            // Apply section filter if any
            if (selectedSection !== 'All' && student.section !== selectedSection) return;
            // Apply search query
            if (searchQuery.trim()) {
              const q = searchQuery.toLowerCase();
              const match = student.name.toLowerCase().includes(q) || (rec.note || '').toLowerCase().includes(q);
              if (!match) return;
            }

            list.push({
              date: sess.date,
              sessionName: sess.sessionName || 'Latihan Korps',
              studentId: student.id,
              studentName: student.name,
              section: student.section,
              kelas: student.kelas,
              status: rec.status,
              reason: rec.note?.trim() || rec.status
            });
          }
        }
      });
    });

    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [sessions, selectedSessionDate, activeStudents, selectedSection, searchQuery]);

  // Export to CSV Function with full reasons and notes
  const exportFullReasonsCSV = () => {
    let csv = "data:text/csv;charset=utf-8,";
    csv += "No,Nama Anggota,Kelas,Asrama,Section,Total Sesi,Hadir,Izin,Sakit,Alfa,Persentase,Skor Prestasi,Izin Pulang,Izin Organisasi,Izin Acara Sekolah,Izin Acara Keluarga,Keterangan Sakit / Alasan Lengkap\n";

    filteredStudents.forEach((student, index) => {
      const cleanNotes = student.notesString.replace(/,/g, ' ').replace(/"/g, '""');
      const row = [
        index + 1,
        `"${student.name}"`,
        student.kelas,
        student.asrama,
        student.section,
        totalSessionsCount,
        student.hadirCount,
        student.izinCount,
        student.sakitCount,
        student.alfaCount,
        `${student.wajibPercentage}%`,
        student.totalScore,
        student.reasonsSummary.pulang,
        student.reasonsSummary.organisasi,
        student.reasonsSummary.acaraSekolah,
        student.reasonsSummary.acaraKeluarga,
        `"${cleanNotes}"`
      ].join(',');

      csv += row + "\n";
    });

    const encodedUri = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_Kehadiran_Dan_Alasan_PGT_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast("Rekapan kehadiran dan alasan berhasil diunduh (CSV/Excel)!", "success");
  };

  const sectionsList = ['All', 'Brass', 'Battery', 'Cologuard', 'Pit'];

  return (
    <div className="space-y-6 pb-24 text-left">
      {/* 1. HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950/70 to-slate-900 border border-blue-800/40 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-bold mb-2">
              <FileSpreadsheet size={14} className="text-blue-400" />
              <span>REKAPITULASI RESMI & ARSIP ALASAN</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>Rekapan Kehadiran Beserta Alasannya</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Daftar rekapitulasi kehadiran lengkap setiap anggota beserta catatan dan rincian 4 alasan izin resmi (Pulang, Organisasi, Acara Sekolah, Acara Keluarga), sakit, serta alfa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={exportFullReasonsCSV}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer active:scale-95 transition-all"
            >
              <Download size={15} />
              <span>Export CSV / Excel Lengkap</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('presentation')}
              className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md"
            >
              <PieChart size={15} />
              <span>Presentasi Kehadiran</span>
            </button>
          </div>
        </div>

        {/* 2. REASON COUNTER PILLS (KARTU HITUNGAN ALASAN) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2">
          {/* Pulang */}
          <button
            type="button"
            onClick={() => setSelectedReasonFilter(selectedReasonFilter === 'pulang' ? 'all' : 'pulang')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              selectedReasonFilter === 'pulang' 
                ? 'bg-blue-600 border-blue-400 text-white shadow-lg ring-2 ring-blue-400/40' 
                : 'bg-slate-950/80 border-slate-800 hover:border-blue-500/40'
            }`}
          >
            <div className="text-[10px] font-bold text-blue-300 uppercase flex items-center gap-1">
              <Home size={11} /> Pulang
            </div>
            <div className="text-xl font-black text-white mt-0.5 tabular-nums">
              {totals.pulang} <span className="text-[10px] font-normal text-slate-400">kali</span>
            </div>
          </button>

          {/* Organisasi */}
          <button
            type="button"
            onClick={() => setSelectedReasonFilter(selectedReasonFilter === 'organisasi' ? 'all' : 'organisasi')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              selectedReasonFilter === 'organisasi' 
                ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg ring-2 ring-indigo-400/40' 
                : 'bg-slate-950/80 border-slate-800 hover:border-indigo-500/40'
            }`}
          >
            <div className="text-[10px] font-bold text-indigo-300 uppercase flex items-center gap-1">
              <Building size={11} /> Organisasi
            </div>
            <div className="text-xl font-black text-white mt-0.5 tabular-nums">
              {totals.organisasi} <span className="text-[10px] font-normal text-slate-400">kali</span>
            </div>
          </button>

          {/* Acara Sekolah */}
          <button
            type="button"
            onClick={() => setSelectedReasonFilter(selectedReasonFilter === 'acaraSekolah' ? 'all' : 'acaraSekolah')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              selectedReasonFilter === 'acaraSekolah' 
                ? 'bg-cyan-600 border-cyan-400 text-white shadow-lg ring-2 ring-cyan-400/40' 
                : 'bg-slate-950/80 border-slate-800 hover:border-cyan-500/40'
            }`}
          >
            <div className="text-[10px] font-bold text-cyan-300 uppercase flex items-center gap-1">
              <School size={11} /> Acara Sekolah
            </div>
            <div className="text-xl font-black text-white mt-0.5 tabular-nums">
              {totals.acaraSekolah} <span className="text-[10px] font-normal text-slate-400">kali</span>
            </div>
          </button>

          {/* Acara Keluarga */}
          <button
            type="button"
            onClick={() => setSelectedReasonFilter(selectedReasonFilter === 'acaraKeluarga' ? 'all' : 'acaraKeluarga')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              selectedReasonFilter === 'acaraKeluarga' 
                ? 'bg-sky-600 border-sky-400 text-white shadow-lg ring-2 ring-sky-400/40' 
                : 'bg-slate-950/80 border-slate-800 hover:border-sky-500/40'
            }`}
          >
            <div className="text-[10px] font-bold text-sky-300 uppercase flex items-center gap-1">
              <Users size={11} /> Acara Keluarga
            </div>
            <div className="text-xl font-black text-white mt-0.5 tabular-nums">
              {totals.acaraKeluarga} <span className="text-[10px] font-normal text-slate-400">kali</span>
            </div>
          </button>

          {/* Sakit */}
          <button
            type="button"
            onClick={() => setSelectedReasonFilter(selectedReasonFilter === 'sakit' ? 'all' : 'sakit')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              selectedReasonFilter === 'sakit' 
                ? 'bg-amber-600 border-amber-400 text-white shadow-lg ring-2 ring-amber-400/40' 
                : 'bg-slate-950/80 border-slate-800 hover:border-amber-500/40'
            }`}
          >
            <div className="text-[10px] font-bold text-amber-300 uppercase flex items-center gap-1">
              <AlertCircle size={11} /> Sakit
            </div>
            <div className="text-xl font-black text-white mt-0.5 tabular-nums">
              {totals.sakit} <span className="text-[10px] font-normal text-slate-400">kali</span>
            </div>
          </button>

          {/* Alfa */}
          <button
            type="button"
            onClick={() => setSelectedReasonFilter(selectedReasonFilter === 'alfa' ? 'all' : 'alfa')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              selectedReasonFilter === 'alfa' 
                ? 'bg-rose-600 border-rose-400 text-white shadow-lg ring-2 ring-rose-400/40' 
                : 'bg-slate-950/80 border-slate-800 hover:border-rose-500/40'
            }`}
          >
            <div className="text-[10px] font-bold text-rose-300 uppercase flex items-center gap-1">
              <X size={11} /> Alfa
            </div>
            <div className="text-xl font-black text-white mt-0.5 tabular-nums">
              {totals.alfa} <span className="text-[10px] font-normal text-slate-400">kali</span>
            </div>
          </button>
        </div>
      </div>

      {/* 3. TOOLBAR: VIEW SWITCHER + SEARCH & FILTERS */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          {/* Dual View Switcher */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('members')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'members' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users size={14} />
              <span>Tabel Per Anggota ({filteredStudents.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('sessions_log')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'sessions_log' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock size={14} />
              <span>Log Alasan Per Sesi ({chronologicalLog.length})</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, alasan, kelas..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Filters bar: Section pills + Reason chips */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          {/* Section filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Filter size={12} /> Unit:
            </span>
            {sectionsList.map(sec => (
              <button
                key={sec}
                type="button"
                onClick={() => setSelectedSection(sec)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedSection === sec
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {sec}
              </button>
            ))}
          </div>

          {/* Quick reason category pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setSelectedReasonFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedReasonFilter === 'all'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              Semua Status
            </button>

            <button
              type="button"
              onClick={() => setSelectedReasonFilter('has_absence')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedReasonFilter === 'has_absence'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-slate-950 text-amber-300 border border-amber-500/30 hover:text-white'
              }`}
            >
              Hanya Yang Ada Alasan ({fullRecapData.filter(s => s.absenceRecords.length > 0).length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedReasonFilter('perfect')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedReasonFilter === 'perfect'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-950 text-emerald-300 border border-emerald-500/30 hover:text-white'
              }`}
            >
              100% Hadir Nihil Alasan ({fullRecapData.filter(s => s.absenceRecords.length === 0).length})
            </button>
          </div>
        </div>
      </div>

      {/* 4. CONTENT VIEW: TABEL PER ANGGOTA vs LOG PER SESI */}
      {viewMode === 'members' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-3 text-center w-12">No</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Nama Anggota</th>
                  <th className="py-3.5 px-3 text-center">Unit</th>
                  <th className="py-3.5 px-3 text-center">Kelas / Asrama</th>
                  <th className="py-3.5 px-2 text-center text-emerald-400">Hadir</th>
                  <th className="py-3.5 px-2 text-center text-amber-400">Sakit</th>
                  <th className="py-3.5 px-2 text-center text-sky-400">Izin</th>
                  <th className="py-3.5 px-2 text-center text-rose-400">Alfa</th>
                  <th className="py-3.5 px-3 text-center">Persentase</th>
                  <th className="py-3.5 px-4 min-w-[280px]">Rincian Alasan & Catatan Lengkap</th>
                  <th className="py-3.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-10 text-center text-slate-500 text-xs">
                      Tidak ada data anggota yang sesuai dengan filter atau kata kunci.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, idx) => {
                    const hasAbsences = student.absenceRecords.length > 0;
                    return (
                      <tr 
                        key={student.id}
                        className="hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-3 text-center text-slate-500 font-mono">
                          {idx + 1}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-extrabold text-white">
                            {student.name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            ID: #{student.id}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-purple-950 text-purple-300 border border-purple-800/60">
                            {student.section}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center text-slate-300 font-mono text-[11px]">
                          Kls {student.kelas} · Asr {student.asrama}
                        </td>

                        <td className="py-3 px-2 text-center text-emerald-400 font-bold tabular-nums">
                          {student.hadirCount}
                        </td>

                        <td className="py-3 px-2 text-center text-amber-400 tabular-nums">
                          {student.sakitCount}
                        </td>

                        <td className="py-3 px-2 text-center text-sky-400 tabular-nums">
                          {student.izinCount}
                        </td>

                        <td className="py-3 px-2 text-center text-rose-400 tabular-nums">
                          {student.alfaCount}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            student.wajibPercentage >= 80 
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}>
                            {student.wajibPercentage}%
                          </span>
                        </td>

                        {/* Rincian Alasan Kolom - Lengkap dan Elegan */}
                        <td className="py-3 px-4 min-w-[280px]">
                          {hasAbsences ? (
                            <div className="space-y-1.5">
                              {/* Reason summary badges */}
                              <div className="flex flex-wrap gap-1">
                                {student.reasonsSummary.pulang > 0 && (
                                  <span className="text-[9.5px] px-2 py-0.5 rounded-md bg-blue-950 border border-blue-500/50 text-blue-200 font-semibold flex items-center gap-1">
                                    <Home size={10} /> Pulang ({student.reasonsSummary.pulang}x)
                                  </span>
                                )}
                                {student.reasonsSummary.organisasi > 0 && (
                                  <span className="text-[9.5px] px-2 py-0.5 rounded-md bg-indigo-950 border border-indigo-500/50 text-indigo-200 font-semibold flex items-center gap-1">
                                    <Building size={10} /> Organisasi ({student.reasonsSummary.organisasi}x)
                                  </span>
                                )}
                                {student.reasonsSummary.acaraSekolah > 0 && (
                                  <span className="text-[9.5px] px-2 py-0.5 rounded-md bg-cyan-950 border border-cyan-500/50 text-cyan-200 font-semibold flex items-center gap-1">
                                    <School size={10} /> Acara Sekolah ({student.reasonsSummary.acaraSekolah}x)
                                  </span>
                                )}
                                {student.reasonsSummary.acaraKeluarga > 0 && (
                                  <span className="text-[9.5px] px-2 py-0.5 rounded-md bg-sky-950 border border-sky-500/50 text-sky-200 font-semibold flex items-center gap-1">
                                    <Users size={10} /> Acara Keluarga ({student.reasonsSummary.acaraKeluarga}x)
                                  </span>
                                )}
                                {student.reasonsSummary.sakit > 0 && (
                                  <span className="text-[9.5px] px-2 py-0.5 rounded-md bg-amber-950 border border-amber-500/50 text-amber-200 font-semibold flex items-center gap-1">
                                    <AlertCircle size={10} /> Sakit ({student.reasonsSummary.sakit}x)
                                  </span>
                                )}
                                {student.reasonsSummary.alfa > 0 && (
                                  <span className="text-[9.5px] px-2 py-0.5 rounded-md bg-rose-950 border border-rose-500/50 text-rose-200 font-semibold flex items-center gap-1">
                                    <X size={10} /> Alfa ({student.reasonsSummary.alfa}x)
                                  </span>
                                )}
                              </div>

                              {/* Text log snippet */}
                              <div className="text-[10px] text-slate-300 font-mono bg-slate-950 p-2 rounded-xl border border-slate-800 line-clamp-2">
                                {student.absenceRecords.map(r => `${r.date}: ${r.status} (${r.reason})`).join(' · ')}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                              <CheckCircle2 size={13} /> Selalu Hadir (Nihil Halangan)
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setInspectingStudent(student)}
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition-all cursor-pointer"
                            title="Lihat Rincian Riwayat Anggota"
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* MODE 2: LOG ALASAN PER SESI (CHRONOLOGICAL LOG) */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Clock size={16} className="text-blue-400" />
                <span>Log Catatan Alasan Per Sesi Latihan</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Daftar kejadian izin, sakit, dan alfa terurut dari sesi terbaru.
              </p>
            </div>

            {/* Filter Sesi Spesifik */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Pilih Sesi:</span>
              <select
                value={selectedSessionDate}
                onChange={(e) => setSelectedSessionDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              >
                <option value="all">Semua Sesi ({sessions.length})</option>
                {sessions.map(s => (
                  <option key={s.date} value={s.date}>
                    {s.date} - {s.sessionName || 'Latihan Korps'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4 w-32">Tanggal Sesi</th>
                  <th className="py-3.5 px-4">Nama Anggota</th>
                  <th className="py-3.5 px-3 text-center">Unit</th>
                  <th className="py-3.5 px-3 text-center">Kelas</th>
                  <th className="py-3.5 px-3 text-center">Status</th>
                  <th className="py-3.5 px-5">Alasan / Keterangan Resmi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {chronologicalLog.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500 text-xs">
                      Tidak ada catatan izin atau ketidakhadiran pada sesi yang dipilih.
                    </td>
                  </tr>
                ) : (
                  chronologicalLog.map((log, index) => {
                    const isPulang = log.reason === 'Pulang';
                    const isOrganisasi = log.reason === 'Organisasi';
                    const isAcaraSekolah = log.reason === 'Acara Sekolah';
                    const isAcaraKeluarga = log.reason === 'Acara Keluarga';

                    return (
                      <tr key={`${log.date}-${log.studentId}-${index}`} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-300 font-semibold whitespace-nowrap">
                          {log.date}
                        </td>

                        <td className="py-3 px-4 font-bold text-white">
                          {log.studentName}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-purple-950 text-purple-300 border border-purple-800/60">
                            {log.section}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center text-slate-400 font-mono">
                          {log.kelas}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            log.status === 'Izin' 
                              ? 'bg-blue-950 text-blue-300 border border-blue-800' 
                              : log.status === 'Sakit'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}>
                            {log.status}
                          </span>
                        </td>

                        <td className="py-3 px-5">
                          <div className="flex items-center gap-2">
                            {isPulang ? (
                              <span className="px-2.5 py-1 rounded-lg bg-blue-950 border border-blue-500/50 text-blue-200 font-bold text-xs flex items-center gap-1.5 shadow-sm">
                                <Home size={12} className="text-blue-400" /> Pulang
                              </span>
                            ) : isOrganisasi ? (
                              <span className="px-2.5 py-1 rounded-lg bg-indigo-950 border border-indigo-500/50 text-indigo-200 font-bold text-xs flex items-center gap-1.5 shadow-sm">
                                <Building size={12} className="text-indigo-400" /> Organisasi
                              </span>
                            ) : isAcaraSekolah ? (
                              <span className="px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-500/50 text-cyan-200 font-bold text-xs flex items-center gap-1.5 shadow-sm">
                                <School size={12} className="text-cyan-400" /> Acara Sekolah
                              </span>
                            ) : isAcaraKeluarga ? (
                              <span className="px-2.5 py-1 rounded-lg bg-sky-950 border border-sky-500/50 text-sky-200 font-bold text-xs flex items-center gap-1.5 shadow-sm">
                                <Users size={12} className="text-sky-400" /> Acara Keluarga
                              </span>
                            ) : log.status === 'Sakit' ? (
                              <span className="px-2.5 py-1 rounded-lg bg-amber-950 border border-amber-500/50 text-amber-200 font-bold text-xs flex items-center gap-1.5 shadow-sm">
                                <AlertCircle size={12} className="text-amber-400" /> Sakit: {log.reason}
                              </span>
                            ) : (
                              <span className="text-slate-300 font-mono text-xs">
                                {log.reason}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. MODAL DETAIL RIWAYAT ALASAN ANGGOTA */}
      {inspectingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-3xl p-6 sm:p-7 w-full max-w-xl shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                  <FileText size={12} /> Detail Riwayat Kehadiran Pemain
                </div>
                <h3 className="text-xl font-extrabold text-white">
                  {inspectingStudent.name}
                </h3>
                <div className="text-xs text-slate-400 mt-0.5">
                  Section <strong className="text-purple-300">{inspectingStudent.section}</strong> · Kelas {inspectingStudent.kelas} · Asrama {inspectingStudent.asrama}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectingStudent(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Score & Attendance Summary Cards */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Hadir</div>
                <div className="text-lg font-black text-emerald-400 mt-0.5">{inspectingStudent.hadirCount}</div>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Izin</div>
                <div className="text-lg font-black text-sky-400 mt-0.5">{inspectingStudent.izinCount}</div>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Sakit</div>
                <div className="text-lg font-black text-amber-400 mt-0.5">{inspectingStudent.sakitCount}</div>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase">Alfa</div>
                <div className="text-lg font-black text-rose-400 mt-0.5">{inspectingStudent.alfaCount}</div>
              </div>
            </div>

            {/* Log of all absence records */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Catatan Alasan Berhalangan ({inspectingStudent.absenceRecords.length}):
              </div>

              {inspectingStudent.absenceRecords.length === 0 ? (
                <div className="p-6 text-center text-xs text-emerald-300 bg-emerald-950/30 rounded-2xl border border-emerald-800/40 flex flex-col items-center gap-2">
                  <CheckCircle2 size={24} className="text-emerald-400" />
                  <span>Anggota ini memiliki catatan sempurna dan tidak pernah izin atau berhalangan hadir.</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {inspectingStudent.absenceRecords.map((rec, i) => (
                    <div 
                      key={i}
                      className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          rec.status === 'Izin' 
                            ? 'bg-blue-950 text-blue-300 border border-blue-800' 
                            : rec.status === 'Sakit'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}>
                          {rec.status}
                        </span>
                        <div>
                          <div className="font-bold text-white">{rec.reason}</div>
                          <div className="text-[10px] text-slate-500">{rec.sessionName}</div>
                        </div>
                      </div>

                      <div className="font-mono text-slate-400 text-[11px] shrink-0">
                        {rec.date}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectingStudent(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
