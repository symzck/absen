import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  RotateCcw, 
  Plus, 
  Trash2, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  HelpCircle,
  Sparkles,
  ClipboardList,
  Filter
} from 'lucide-react';
import { Student } from '../App';

interface PaperAttendanceSheetModalProps {
  isOpen: boolean;
  students: Student[];
  onClose: () => void;
  onSaveAll: (updatedStudents: Student[]) => void;
  onRestoreDefaults?: () => void;
  triggerToast: (msg: string, type?: 'success' | 'warning' | 'info') => void;
}

const SECTION_OPTIONS = ['Brass', 'Cologuard', 'Battery', 'Pit'];
const ASRAMA_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'Luar'];
const COMMON_CLASSES = [
  '1A', '1B', '1C', '1D', '1E', '1F', '1G', '1H', '1US', '1LSA',
  '2A', '2B', '2C', '2D', '2E', '2F', '2G', '2H', '2US', '2LSA',
  '3A', '3B', '3C', '3D', '3E', '3F', '3G', '3H', '3US', '3LSA',
  '4A', '4B', '4C', '4D', '4E', '4F', '4G', '4H', '4US', '4LSA',
  '5A', '5B', '5C', '5D', '5E', '5F', '5G', '5H', '5US', '5LSA',
  '6A', '6B', '6C', '6D', '6E', '6F', '6G', '6H', '6US', '6LSA'
];

export const PaperAttendanceSheetModal: React.FC<PaperAttendanceSheetModalProps> = ({
  isOpen,
  students,
  onClose,
  onSaveAll,
  onRestoreDefaults,
  triggerToast
}) => {
  const [localStudents, setLocalStudents] = useState<Student[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'table' | 'bulk_text'>('table');
  const [bulkText, setBulkText] = useState('');
  const [bulkParseError, setBulkParseError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync internal state when modal opens
  useEffect(() => {
    if (isOpen) {
      // Sort primarily by section order (Brass, CG, Battery, Pit) then ID
      const sectionOrder: Record<string, number> = { Brass: 1, Cologuard: 2, Battery: 3, Pit: 4 };
      const sorted = [...students].sort((a, b) => {
        const orderA = sectionOrder[a.section] || 99;
        const orderB = sectionOrder[b.section] || 99;
        if (orderA !== orderB) return orderA - orderB;
        return a.id - b.id;
      });
      setLocalStudents(sorted);
      setHasChanges(false);

      // Generate initial bulk text (Format: Nama, Kelas, Asrama, Section)
      const text = sorted
        .map(s => `${s.name}, ${s.kelas}, ${s.asrama}, ${s.section}`)
        .join('\n');
      setBulkText(text);
      setBulkParseError(null);
    }
  }, [isOpen, students]);

  if (!isOpen) return null;

  const handleFieldChange = (id: number, field: keyof Student, value: string | number) => {
    setLocalStudents(prev => 
      prev.map(s => s.id === id ? { ...s, [field]: value } : s)
    );
    setHasChanges(true);
  };

  const handleAddNewRow = () => {
    const newId = Date.now();
    const defaultSection = selectedSection !== 'All' ? selectedSection : 'Brass';
    const newStudent: Student = {
      id: newId,
      name: '',
      kelas: '2F',
      asrama: 'A',
      section: defaultSection
    };
    setLocalStudents(prev => [...prev, newStudent]);
    setHasChanges(true);
    triggerToast('Baris baru ditambahkan ke tabel presensi kertas.', 'info');
  };

  const handleDeleteRow = (id: number) => {
    setLocalStudents(prev => prev.filter(s => s.id !== id));
    setHasChanges(true);
  };

  const handleSave = () => {
    // Validate that no names are empty
    const emptyRows = localStudents.filter(s => !s.name.trim());
    if (emptyRows.length > 0) {
      triggerToast('Terdapat baris nama yang masih kosong. Mohon lengkapi atau hapus baris tersebut.', 'warning');
      return;
    }

    const cleaned = localStudents.map((s, idx) => ({
      ...s,
      id: s.id || (idx + 1),
      name: s.name.trim(),
      kelas: s.kelas.trim() || '1A',
      asrama: s.asrama.trim() || 'A',
      section: s.section.trim() || 'Brass'
    }));

    onSaveAll(cleaned);
    setHasChanges(false);
    onClose();
  };

  // Bulk Text Parser
  const handleApplyBulkText = () => {
    setBulkParseError(null);
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      setBulkParseError('Teks input kosong. Masukkan minimal 1 baris data.');
      return;
    }

    const parsed: Student[] = [];
    const validSections = ['brass', 'cologuard', 'battery', 'pit'];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Support comma, tab, or semicolon separated
      const parts = line.split(/[,;\t]+/).map(p => p.trim());
      if (parts.length < 4) {
        setBulkParseError(`Format baris ke-${i + 1} tidak valid: "${line}". Format yang benar: Nama, Kelas, Asrama, Section`);
        return;
      }

      const [name, kelas, asrama, rawSection] = parts;
      if (!name) {
        setBulkParseError(`Nama pada baris ke-${i + 1} tidak boleh kosong.`);
        return;
      }

      // Match section
      let section = 'Brass';
      const cleanSec = rawSection.toLowerCase();
      if (cleanSec.includes('col') || cleanSec.includes('cg')) section = 'Cologuard';
      else if (cleanSec.includes('bat') || cleanSec.includes('drum')) section = 'Battery';
      else if (cleanSec.includes('pit')) section = 'Pit';
      else if (cleanSec.includes('bra')) section = 'Brass';
      else if (validSections.includes(cleanSec)) {
        section = rawSection.charAt(0).toUpperCase() + rawSection.slice(1);
      }

      parsed.push({
        id: Date.now() + i,
        name,
        kelas: kelas || '1A',
        asrama: asrama.toUpperCase() || 'A',
        section
      });
    }

    setLocalStudents(parsed);
    setHasChanges(true);
    setActiveTab('table');
    triggerToast(`Berhasil memuat ${parsed.length} anggota dari teks. Periksa tabel lalu klik Simpan.`, 'success');
  };

  // Filtered rows
  const filteredStudents = localStudents.filter(s => {
    const matchSec = selectedSection === 'All' || s.section === selectedSection;
    const query = searchQuery.toLowerCase().trim();
    const matchQuery = !query || 
      s.name.toLowerCase().includes(query) || 
      s.kelas.toLowerCase().includes(query) || 
      s.asrama.toLowerCase().includes(query) || 
      s.section.toLowerCase().includes(query);
    return matchSec && matchQuery;
  });

  // Section breakdown counts
  const sectionCounts = {
    Brass: localStudents.filter(s => s.section === 'Brass').length,
    Cologuard: localStudents.filter(s => s.section === 'Cologuard').length,
    Battery: localStudents.filter(s => s.section === 'Battery').length,
    Pit: localStudents.filter(s => s.section === 'Pit').length
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-5xl w-full h-[92vh] max-h-[900px] flex flex-col shadow-2xl overflow-hidden text-left">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-slate-950/80 border-b border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 bg-purple-500/20 text-purple-300 rounded-2xl border border-purple-500/30">
              <ClipboardList size={22} className="text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-900/60 text-purple-300 border border-purple-700/40 text-[11px] font-semibold mb-0.5">
                <Sparkles size={11} className="text-amber-300" />
                Lembar Presensi Kertas (Input & Penyesuaian Massal)
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Input Ulang Nama, Asrama, Kelas & Section
              </h2>
              <p className="text-xs text-slate-400">
                Sesuaikan urutan data persis seperti daftar presensi kertas lapangan. Rekapitulasi & leaderboard akan otomatis diperbarui.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {hasChanges && (
              <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl animate-pulse">
                ● Ada Perubahan Belum Disimpan
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Tutup"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Sub-header Controls */}
        <div className="px-4 sm:px-6 py-3 bg-slate-900 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          {/* View Modes */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'table'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📊 Tabel Baris Presensi ({localStudents.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bulk_text')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'bulk_text'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📋 Tempel / Edit Teks Massal
            </button>
          </div>

          {/* Section Summary Chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-slate-400 font-medium mr-1">Rincian:</span>
            <span className="px-2 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold rounded-lg">
              Brass: {sectionCounts.Brass}
            </span>
            <span className="px-2 py-0.5 bg-purple-500/15 border border-purple-500/30 text-purple-300 font-bold rounded-lg">
              CG: {sectionCounts.Cologuard}
            </span>
            <span className="px-2 py-0.5 bg-sky-500/15 border border-sky-500/30 text-sky-300 font-bold rounded-lg">
              Battery: {sectionCounts.Battery}
            </span>
            <span className="px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold rounded-lg">
              Pit: {sectionCounts.Pit}
            </span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {activeTab === 'table' ? (
            <>
              {/* Filter and Action Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <span className="text-xs text-slate-500 font-semibold px-1">Filter:</span>
                  {['All', ...SECTION_OPTIONS].map(sec => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setSelectedSection(sec)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        selectedSection === sec
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {sec === 'All' ? `Semua (${localStudents.length})` : `${sec} (${localStudents.filter(s => s.section === sec).length})`}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:w-60">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Cari nama, kelas, atau asrama..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddNewRow}
                    className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 transition-colors shadow-sm cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Tambah Baris</span>
                  </button>
                </div>
              </div>

              {/* Editable Table */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/40">
                <div className="overflow-x-auto max-h-[50vh]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold text-[10px] sticky top-0 z-10 border-b border-slate-800 shadow-sm">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">No</th>
                        <th className="py-2.5 px-3 min-w-[200px]">Nama Lengkap Siswa</th>
                        <th className="py-2.5 px-3 w-28">Kelas</th>
                        <th className="py-2.5 px-3 w-28">Asrama</th>
                        <th className="py-2.5 px-3 w-36">Section</th>
                        <th className="py-2.5 px-3 w-14 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                            Tidak ada anggota yang sesuai dengan filter atau pencarian.
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map((student, idx) => (
                          <tr key={student.id} className="hover:bg-slate-850/50 transition-colors">
                            <td className="py-2 px-3 text-center text-slate-500 font-semibold">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-3 font-sans">
                              <input
                                type="text"
                                value={student.name}
                                onChange={(e) => handleFieldChange(student.id, 'name', e.target.value)}
                                placeholder="Ketik nama siswa..."
                                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-white font-medium text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={student.kelas}
                                onChange={(e) => handleFieldChange(student.id, 'kelas', e.target.value)}
                                placeholder="Misal: 2H"
                                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-white font-mono text-xs uppercase focus:outline-none focus:ring-1 focus:ring-purple-500"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <select
                                value={student.asrama}
                                onChange={(e) => handleFieldChange(student.id, 'asrama', e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-amber-300 font-bold text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                              >
                                {ASRAMA_OPTIONS.map(a => (
                                  <option key={a} value={a}>Asrama {a}</option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-3">
                              <select
                                value={student.section}
                                onChange={(e) => handleFieldChange(student.id, 'section', e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-purple-300 font-bold text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                              >
                                {SECTION_OPTIONS.map(sec => (
                                  <option key={sec} value={sec}>{sec}</option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteRow(student.id)}
                                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                                title="Hapus baris ini"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            /* Bulk Text Mode */
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                  <FileText size={15} />
                  <span>Mode Tempel Teks Massal (Format Cepat)</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Anda dapat menyalin daftar siswa dari Excel, Word, atau catatan presensi kertas Anda lalu tempel ke bawah.
                  Gunakan format pemisah koma atau tab: <code className="text-amber-300 bg-slate-900 px-1.5 py-0.5 rounded">Nama Lengkap, Kelas, Asrama, Section</code> per baris.
                </p>
                <div className="text-[11px] text-slate-500 font-mono">
                  Contoh baris:<br />
                  Rajendra Arya Abiyyu, 2H, C, Brass<br />
                  Ahmad Mumtaz D. El Haq, 1C, D, Cologuard
                </div>
              </div>

              {bulkParseError && (
                <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-200 flex items-start gap-2 animate-in fade-in">
                  <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                  <span>{bulkParseError}</span>
                </div>
              )}

              <div>
                <textarea
                  rows={14}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="Tempel baris data siswa di sini..."
                  className="w-full font-mono text-xs px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleApplyBulkText}
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  <Sparkles size={14} />
                  <span>Terapkan Teks ke Tabel Presensi</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {onRestoreDefaults && (
              <button
                type="button"
                onClick={onRestoreDefaults}
                className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Pulihkan ke daftar resmi 43 anggota bawaan"
              >
                <RotateCcw size={14} />
                <span>Pulihkan 43 Anggota Bawaan</span>
              </button>
            )}
            <span className="text-xs text-slate-500 hidden sm:inline">
              Total {localStudents.length} anggota siap disinkronkan ke rekap & cloud.
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all active:scale-95 cursor-pointer"
            >
              <Save size={16} />
              <span>Simpan & Terapkan ke Rekapitulasi</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
