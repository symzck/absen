import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Save, 
  RotateCcw, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Sparkles, 
  ClipboardList, 
  Image as ImageIcon,
  Camera,
  ZoomIn,
  ZoomOut,
  Upload,
  Eye,
  Columns,
  RefreshCw,
  FileText
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
  const [activeTab, setActiveTab] = useState<'table' | 'bulk_text' | 'image_scanner'>('table');
  const [bulkText, setBulkText] = useState('');
  const [bulkParseError, setBulkParseError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Image Inspector / Scanner state
  const [uploadedImage, setUploadedImage] = useState<string | null>(() => {
    return localStorage.getItem('pgt_paper_sheet_img') || null;
  });
  const [imageZoom, setImageZoom] = useState<number>(1);
  const [showSplitView, setShowSplitView] = useState(false);
  const [ocrTextResult, setOcrTextResult] = useState('');
  const [isScanningImage, setIsScanningImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync internal state when modal opens
  useEffect(() => {
    if (isOpen) {
      const sectionOrder: Record<string, number> = { Brass: 1, Cologuard: 2, Battery: 3, Pit: 4 };
      const sorted = [...students].sort((a, b) => {
        const orderA = sectionOrder[a.section] || 99;
        const orderB = sectionOrder[b.section] || 99;
        if (orderA !== orderB) return orderA - orderB;
        return a.id - b.id;
      });
      setLocalStudents(sorted);
      setHasChanges(false);

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

  const handleAddMultipleRows = (count: number) => {
    const defaultSection = selectedSection !== 'All' ? selectedSection : 'Brass';
    const newRows: Student[] = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      name: '',
      kelas: '',
      asrama: 'A',
      section: defaultSection
    }));
    setLocalStudents(prev => [...prev, ...newRows]);
    setHasChanges(true);
    triggerToast(`${count} baris baru berhasil ditambahkan.`, 'info');
  };

  const handleClearAllRows = () => {
    if (localStudents.length === 0) return;
    setShowClearConfirm(true);
  };

  const executeClearAllRows = () => {
    setLocalStudents([]);
    setBulkText('');
    setHasChanges(true);
    setShowClearConfirm(false);
    triggerToast('Seluruh baris telah dikosongkan. Anda dapat mulai menginput daftar baru.', 'info');
  };

  const handleDeleteRow = (id: number) => {
    setLocalStudents(prev => prev.filter(s => s.id !== id));
    setHasChanges(true);
  };

  const handleSave = () => {
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

  // Image Upload Handler
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      triggerToast('Mohon pilih file gambar (JPG, PNG, atau WEBP).', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setUploadedImage(dataUrl);
      try {
        localStorage.setItem('pgt_paper_sheet_img', dataUrl);
      } catch (err) {
        console.warn("Storage quota exceeded for image", err);
      }
      triggerToast('Foto presensi kertas berhasil dimuat!', 'success');
      setShowSplitView(true);
    };
    reader.readAsDataURL(file);
  };

  // Flexible Text Parser (supports comma, tab, dash, colon, bullet points)
  const parseLinesToStudents = (rawInputText: string, mode: 'replace' | 'append' = 'replace') => {
    setBulkParseError(null);
    const rawLines = rawInputText.split('\n').map(l => l.trim()).filter(Boolean);
    if (rawLines.length === 0) {
      setBulkParseError('Teks input kosong. Masukkan minimal 1 baris data.');
      return;
    }

    const parsed: Student[] = [];
    const validSections = ['brass', 'cologuard', 'battery', 'pit'];

    for (let i = 0; i < rawLines.length; i++) {
      let line = rawLines[i];
      // Remove leading numbers like "1.", "1)", "#1", etc.
      line = line.replace(/^\s*\d+[\.\)\-\:\s]+\s*/, '');

      // Try splitting by comma, tab, semicolon, pipe, or dash
      let parts: string[] = [];
      if (line.includes('\t')) parts = line.split('\t');
      else if (line.includes(',')) parts = line.split(',');
      else if (line.includes(';')) parts = line.split(';');
      else if (line.includes('|')) parts = line.split('|');
      else if (line.includes(' - ')) parts = line.split(' - ');
      else {
        // Fallback: split by multiple spaces
        parts = line.split(/\s{2,}/);
      }

      parts = parts.map(p => p.trim()).filter(Boolean);

      if (parts.length < 2) {
        // If single space separated, try extracting class and section from end
        const words = line.split(/\s+/);
        if (words.length >= 3) {
          const lastWord = words[words.length - 1];
          const secondLast = words[words.length - 2];
          const thirdLast = words.length >= 4 ? words[words.length - 3] : 'A';
          const namePart = words.slice(0, words.length - 3).join(' ') || words.slice(0, words.length - 2).join(' ');
          parts = [namePart, thirdLast, secondLast, lastWord];
        } else {
          setBulkParseError(`Format baris ke-${i + 1} tidak lengkap: "${line}". Format yang disarankan: Nama, Kelas, Asrama, Section`);
          return;
        }
      }

      const name = parts[0];
      const kelas = parts[1] || '2F';
      const asrama = parts[2] ? parts[2].replace(/^asrama\s*/i, '').trim().toUpperCase() : 'A';
      const rawSection = parts[3] || 'Brass';

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
        kelas: kelas.toUpperCase(),
        asrama: asrama.charAt(0).toUpperCase(),
        section
      });
    }

    if (mode === 'replace') {
      setLocalStudents(parsed);
      triggerToast(`Berhasil mengganti seluruh tabel dengan ${parsed.length} pemain baru! Silakan periksa lalu Simpan.`, 'success');
    } else {
      setLocalStudents(prev => [...prev, ...parsed]);
      triggerToast(`Berhasil menambahkan ${parsed.length} pemain baru ke tabel. Silakan periksa lalu Simpan.`, 'success');
    }
    setHasChanges(true);
    setActiveTab('table');
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
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-6xl w-full h-[94vh] max-h-[920px] flex flex-col shadow-2xl overflow-hidden text-left">
        
        {/* Hidden File Input for Image */}
        <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*" 
          className="hidden" 
          onChange={handleImageFileChange} 
        />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-950/80 border-b border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 bg-purple-500/20 text-purple-300 rounded-2xl border border-purple-500/30">
              <ClipboardList size={22} className="text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-900/60 text-purple-300 border border-purple-700/40 text-[11px] font-semibold mb-0.5">
                <Sparkles size={11} className="text-amber-300" />
                Lembar Presensi Kertas · Sinkronisasi Real-Time
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Sesuaikan Nama, Asrama, Kelas & Section Sesuai Kertas
              </h2>
              <p className="text-xs text-slate-400">
                Pembaruan data langsung merefleksikan nama dan peringkat disiplin di rekapitulasi secara otomatis.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {uploadedImage && (
              <button
                type="button"
                onClick={() => setShowSplitView(!showSplitView)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                  showSplitView 
                    ? 'bg-purple-600 text-white border-purple-400' 
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
                title="Tampilkan foto lembar presensi berdampingan dengan tabel input"
              >
                <Columns size={14} />
                <span>{showSplitView ? 'Tutup Belah Layar' : 'Buka Split View Foto'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-700 hover:to-indigo-700 text-white border border-purple-600/50 shadow-sm transition-all cursor-pointer"
              title="Unggah foto lembar presensi kertas dari HP/komputer"
            >
              <Camera size={14} className="text-amber-400" />
              <span>{uploadedImage ? 'Ganti Foto Kertas' : 'Unggah Foto Presensi'}</span>
            </button>

            {hasChanges && (
              <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl animate-pulse">
                ● Belum Disimpan
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
        <div className="px-4 sm:px-6 py-2.5 bg-slate-900 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
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
            <button
              type="button"
              onClick={() => setActiveTab('image_scanner')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'image_scanner'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon size={13} className={uploadedImage ? 'text-amber-400' : ''} />
              <span>Inspektur Foto Presensi</span>
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

        {/* Content Area with optional Split View */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Left Side: Split View Image Inspector if active */}
          {showSplitView && uploadedImage && activeTab !== 'image_scanner' && (
            <div className="w-full md:w-5/12 border-b md:border-b-0 md:border-r border-slate-800 bg-black flex flex-col shrink-0 overflow-hidden">
              <div className="p-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <ImageIcon size={14} className="text-amber-400" />
                  Foto Lembar Presensi Kertas
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setImageZoom(z => Math.max(0.5, z - 0.25))}
                    className="p-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded"
                    title="Zoom Out"
                  >
                    <ZoomOut size={13} />
                  </button>
                  <span className="px-1 text-[10px] font-mono text-slate-400">{Math.round(imageZoom * 100)}%</span>
                  <button
                    type="button"
                    onClick={() => setImageZoom(z => Math.min(3, z + 0.25))}
                    className="p-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded"
                    title="Zoom In"
                  >
                    <ZoomIn size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageZoom(1)}
                    className="p-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded ml-1"
                    title="Reset Zoom"
                  >
                    <RotateCcw size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSplitView(false)}
                    className="p-1 text-slate-400 hover:text-white rounded ml-1"
                    title="Tutup Panel Foto"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-2 flex items-start justify-center bg-black/95">
                <img 
                  src={uploadedImage} 
                  alt="Presensi Kertas" 
                  style={{ transform: `scale(${imageZoom})`, transformOrigin: 'top center' }}
                  className="max-w-full transition-transform duration-100 rounded-lg shadow-2xl"
                />
              </div>
            </div>
          )}

          {/* Right Side / Main Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            
            {showClearConfirm && (
              <div className="p-4 bg-rose-950/80 border border-rose-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-2.5">
                  <AlertCircle size={20} className="text-rose-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white">Kosongkan seluruh baris tabel presensi kertas?</div>
                    <div className="text-[11px] text-rose-200">Tindakan ini akan menghapus baris tabel di layar agar Anda bisa menginput atau menempel daftar pemain baru dari awal tanpa terpatok pemain lama.</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={executeClearAllRows}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                  >
                    Ya, Kosongkan Tabel
                  </button>
                </div>
              </div>
            )}
            
            {activeTab === 'table' && (
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
                    <div className="relative flex-1 sm:w-56">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Cari nama, kelas, asrama..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleAddNewRow}
                      className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      <Plus size={14} />
                      <span>+ 1 Baris</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddMultipleRows(5)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                      title="Tambah 5 baris kosong sekaligus"
                    >
                      <span>+ 5 Baris</span>
                    </button>

                    {localStudents.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllRows}
                        className="px-2.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                        title="Kosongkan seluruh baris tabel agar tidak terpatok pemain lama"
                      >
                        <Trash2 size={13} />
                        <span>Kosongkan Tabel</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Table Data */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-inner">
                  <div className="overflow-x-auto max-h-[500px]">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <tr>
                          <th className="py-2.5 px-3 w-12 text-center">No</th>
                          <th className="py-2.5 px-3">Nama Pemain (Sesuai Kertas)</th>
                          <th className="py-2.5 px-3 w-28">Kelas</th>
                          <th className="py-2.5 px-3 w-28">Asrama</th>
                          <th className="py-2.5 px-3 w-36">Section Instrumen</th>
                          <th className="py-2.5 px-3 w-16 text-center">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-xs">
                        {filteredStudents.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-500">
                              Tidak ada anggota yang cocok dengan filter atau pencarian ini.
                            </td>
                          </tr>
                        ) : (
                          filteredStudents.map((student, idx) => (
                            <tr key={student.id} className="hover:bg-slate-900/50 transition-colors">
                              <td className="py-2 px-3 text-center text-slate-500 font-mono">
                                {idx + 1}
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={student.name}
                                  onChange={(e) => handleFieldChange(student.id, 'name', e.target.value)}
                                  placeholder="Ketik nama lengkap..."
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  value={student.kelas}
                                  onChange={(e) => handleFieldChange(student.id, 'kelas', e.target.value)}
                                  placeholder="Mis: 2F, 3B"
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-center font-bold focus:outline-none focus:ring-1 focus:ring-purple-500 uppercase"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <select
                                  value={student.asrama}
                                  onChange={(e) => handleFieldChange(student.id, 'asrama', e.target.value)}
                                  className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-center font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500"
                                >
                                  {ASRAMA_OPTIONS.map(asr => (
                                    <option key={asr} value={asr}>Asrama {asr}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-2 px-3">
                                <select
                                  value={student.section}
                                  onChange={(e) => handleFieldChange(student.id, 'section', e.target.value)}
                                  className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500"
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
                                  className="p-1.5 text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
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
            )}

            {activeTab === 'bulk_text' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-xs text-slate-300">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <FileText size={15} className="text-amber-400" />
                    <span>Format Masukan Teks Massal (Bebas / Copy-Paste)</span>
                  </div>
                  <p>
                    Anda dapat menempelkan daftar langsung dari catatan, WhatsApp, atau Excel.
                    Pemisah baris dapat berupa koma (<code className="text-purple-300">,</code>), tab, titik dua, atau strip (<code className="text-purple-300">-</code>).
                  </p>
                  <div className="p-2.5 bg-slate-900 rounded-xl font-mono text-[11px] text-amber-200/90 leading-relaxed border border-slate-800">
                    Contoh 1: Rajendra Arya Abiyyu, 2H, C, Brass<br />
                    Contoh 2: 1. Ahmad Arkan Sya'bani - 3A - Asrama A - Brass<br />
                    Contoh 3: Ahmad Mumtaz D. El Haq, 1C, D, Cologuard<br />
                    Contoh 4: Ahmad Zufaril, 1C, D, Battery
                  </div>
                </div>

                {bulkParseError && (
                  <div className="p-3 bg-rose-950/60 border border-rose-800/60 text-rose-200 rounded-xl text-xs flex items-start gap-2">
                    <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                    <span>{bulkParseError}</span>
                  </div>
                )}

                <div>
                  <textarea
                    rows={12}
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder="Tempel baris data anggota di sini..."
                    className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed placeholder-slate-600"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const text = localStudents
                          .map(s => `${s.name}, ${s.kelas}, ${s.asrama}, ${s.section}`)
                          .join('\n');
                        setBulkText(text);
                        triggerToast('Format teks diekstrak dari tabel saat ini.', 'info');
                      }}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Salin dari Tabel Saat Ini
                    </button>
                    {bulkText && (
                      <button
                        type="button"
                        onClick={() => setBulkText('')}
                        className="px-3 py-2 text-xs text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                      >
                        Bersihkan Teks
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => parseLinesToStudents(bulkText, 'append')}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-purple-200 border border-purple-600/40 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      title="Tambahkan data teks ini ke bawah tabel yang sudah ada"
                    >
                      <span>➕ Tambahkan ke Tabel yang Ada</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => parseLinesToStudents(bulkText, 'replace')}
                      className="px-5 py-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                      title="Gantikan seluruh tabel dengan daftar teks baru ini"
                    >
                      <CheckCircle2 size={15} />
                      <span>🚀 Ganti Seluruh Tabel dengan Teks Ini</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'image_scanner' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <ImageIcon size={16} className="text-amber-400" />
                      Inspektur & Pindai Foto Lembar Presensi Kertas
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Lihat foto fisik lembar presensi secara jelas atau unggah foto baru dari kamera/file.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Upload size={14} />
                      <span>{uploadedImage ? 'Ganti Foto' : 'Pilih File Foto'}</span>
                    </button>
                    {uploadedImage && (
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedImage(null);
                          localStorage.removeItem('pgt_paper_sheet_img');
                          triggerToast('Foto presensi telah dihapus.', 'info');
                        }}
                        className="p-2 text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                        title="Hapus Foto"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>

                {!uploadedImage ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 hover:border-purple-500/70 rounded-3xl p-10 text-center cursor-pointer transition-colors bg-slate-950/40 space-y-3"
                  >
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-950/60 border border-purple-800/60 text-purple-300 flex items-center justify-center">
                      <Camera size={26} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Klik untuk Memilih Foto Lembar Presensi Kertas</div>
                      <div className="text-xs text-slate-400 mt-1">Mendukung format JPG, PNG, atau foto langsung dari kamera HP</div>
                    </div>
                    <div className="inline-block px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-[11px] text-purple-300 font-medium">
                      💡 Foto akan ditampilkan berdampingan dengan tabel input agar mudah diperiksa
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
                      <span className="text-slate-400">Kontrol Tampilan:</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setImageZoom(z => Math.max(0.5, z - 0.25))}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <ZoomOut size={13} /> Zoom Out
                        </button>
                        <span className="font-mono text-purple-300">{Math.round(imageZoom * 100)}%</span>
                        <button
                          type="button"
                          onClick={() => setImageZoom(z => Math.min(3, z + 0.25))}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <ZoomIn size={13} /> Zoom In
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageZoom(1)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Reset
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowSplitView(true);
                            setActiveTab('table');
                            triggerToast('Split View aktif: Anda dapat memeriksa tabel sembari melihat foto.', 'info');
                          }}
                          className="px-3 py-1 bg-purple-700 hover:bg-purple-600 text-white rounded-lg font-bold cursor-pointer ml-2"
                        >
                          Buka di Belah Layar (Split View)
                        </button>
                      </div>
                    </div>

                    <div className="bg-black rounded-2xl border border-slate-800 overflow-auto max-h-[520px] p-4 flex justify-center">
                      <img 
                        src={uploadedImage} 
                        alt="Lembar Presensi Kertas" 
                        style={{ transform: `scale(${imageZoom})`, transformOrigin: 'top center' }}
                        className="max-w-full transition-transform duration-100 rounded-xl shadow-2xl"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {onRestoreDefaults && (
              <button
                type="button"
                onClick={onRestoreDefaults}
                className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Muat contoh template data bawaan jika dibutuhkan"
              >
                <RotateCcw size={14} />
                <span>Muat Template Contoh Bawaan</span>
              </button>
            )}
            <span className="text-xs text-slate-400 hidden sm:inline">
              Total {localStudents.length} pemain siap disinkronkan ke rekap & cloud. Bebas diubah tanpa terpatok pemain lama.
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
