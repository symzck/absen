import React, { useState, useMemo } from 'react';
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  Edit2, 
  Pin, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Info, 
  Trophy, 
  Search, 
  X, 
  Save, 
  Check, 
  Sparkles,
  Users,
  Send,
  Filter,
  Share2,
  Copy,
  FileText,
  CheckCircle2,
  Printer,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { Announcement } from '../services/db';
import { SystemUser, Student } from '../App';
import { ConfirmModal } from './ConfirmModal';

interface AnnouncementsTabProps {
  announcements: Announcement[];
  currentUser: SystemUser;
  students?: Student[];
  onSaveAnnouncement: (announcement: Announcement) => Promise<void>;
  onDeleteAnnouncement: (announcementId: string) => Promise<void>;
  triggerToast: (msg: string, type?: 'success' | 'warning' | 'info') => void;
}

export const AnnouncementsTab: React.FC<AnnouncementsTabProps> = ({
  announcements,
  currentUser,
  students = [],
  onSaveAnnouncement,
  onDeleteAnnouncement,
  triggerToast
}) => {
  const isAdmin = currentUser.role === 'admin';
  const isOfficer = currentUser.role === 'petugas';

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAudience, setSelectedAudience] = useState<string>('All');

  // Read Acknowledgements Tracking
  const [readAnnouncements, setReadAnnouncements] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('pgt_read_announcements');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState<'urgent' | 'info' | 'schedule' | 'praise'>('info');
  const [formAudience, setFormAudience] = useState<string>('All');
  const [isCustomAudience, setIsCustomAudience] = useState(false);
  const [customAudienceText, setCustomAudienceText] = useState('');
  const [formPinned, setFormPinned] = useState(false);

  // In-app Delete Confirmation Modal
  const [annToDelete, setAnnToDelete] = useState<Announcement | null>(null);

  // Dynamic Section Audiences derived from students list
  const sectionOptions = useMemo(() => {
    const base = ['All', 'Brass', 'Cologuard', 'Battery', 'Pit'];
    const custom = students.map(s => s.section).filter(Boolean);
    return Array.from(new Set([...base, ...custom]));
  }, [students]);

  const handleToggleRead = (id: string) => {
    setReadAnnouncements(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        triggerToast('Tanda dibaca dicabut.');
      } else {
        next.add(id);
        triggerToast('Pengumuman ditandai telah dibaca & dipahami.', 'success');
      }
      localStorage.setItem('pgt_read_announcements', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormTitle('');
    setFormContent('');
    setFormCategory('info');
    
    // Default audience for petugas is their assigned section
    const defaultAud = isOfficer && currentUser.assignedSection !== 'All' 
      ? currentUser.assignedSection 
      : 'All';
      
    setFormAudience(defaultAud);
    setIsCustomAudience(false);
    setCustomAudienceText('');
    setFormPinned(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ann: Announcement) => {
    setEditingId(ann.id);
    setFormTitle(ann.title);
    setFormContent(ann.content);
    setFormCategory(ann.category);

    const isStandard = sectionOptions.includes(ann.targetAudience);
    if (isStandard) {
      setFormAudience(ann.targetAudience);
      setIsCustomAudience(false);
      setCustomAudienceText('');
    } else {
      setFormAudience('Custom');
      setIsCustomAudience(true);
      setCustomAudienceText(ann.targetAudience);
    }

    setFormPinned(Boolean(ann.pinned));
    setIsModalOpen(true);
  };

  // Quick Template Fillers
  const applyTemplate = (type: 'schedule' | 'urgent' | 'praise' | 'general') => {
    const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (type === 'schedule') {
      setFormTitle('📅 Jadwal Gladi & Latihan Rutin Korps');
      setFormCategory('schedule');
      setFormContent(
`📅 HARI & TANGGAL: ${today}
⏰ WAKTU LATIHAN: 15.30 - 17.30 WIB
📍 LOKASI: Lapangan Utama / Hall Marching Band
👔 SERAGAM / PAKAIAN: Kaos Latihan Resmi + Sepatu Kets
🎺 INSTRUMEN & PERALATAN:
1. Instrumen masing-masing (Cek kebersihan valve & slide)
2. Binder partitur & pensil
3. Botol air minum pribadi

📌 CATATAN PETUGAS:
Dimohon hadir 15 menit sebelum waktu latihan dimulai untuk pemanasan section.`
      );
    } else if (type === 'urgent') {
      setFormTitle('🚨 PEMBERITAHUAN MENDESAK DARI PELATIH / ADMIN');
      setFormCategory('urgent');
      setFormContent(
`🚨 PERHATIAN PENTING KEPADA SELURUH ANGGOTA:

Diberitahukan bahwa terdapat penyesuaian jadwal / instruksi penting sebagai berikut:
1. ...
2. ...

Harap seluruh anggota segera mengonfirmasi KETERBACAN pesan ini dan mematuhi arahan di atas. Terima kasih!`
      );
    } else if (type === 'praise') {
      setFormTitle('🏆 APRESIASI KEDISIPLINAN & KEKOMPAKAN LATIHAN');
      setFormCategory('praise');
      setFormContent(
`🏆 APRESIASI & PENGHARGAAN KORPS PGT MU'ALLIMIN:

Selamat dan apresiasi setinggi-tingginya kepada seluruh anggota yang telah mencatatkan persentase kehadiran dan kedisiplinan terbaik pada sesi latihan pekan ini!

Pertahankan kekompakan, konsistensi ritme, dan semangat kebersamaan korps kita!`
      );
    } else {
      setFormTitle('📢 Informasi Umum Latihan Korps');
      setFormCategory('info');
      setFormContent('Tuliskan isi pengumuman atau instruksi umum di sini...');
    }
    triggerToast('Template pengumuman berhasil dimuat!', 'info');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      triggerToast('Judul dan isi pengumuman tidak boleh kosong!', 'warning');
      return;
    }

    const finalAudience = isCustomAudience 
      ? (customAudienceText.trim() || 'All') 
      : formAudience;

    const item: Announcement = {
      id: editingId || `ann-${Date.now()}`,
      title: formTitle.trim(),
      content: formContent.trim(),
      category: formCategory,
      targetAudience: finalAudience as any,
      author: currentUser.fullName || currentUser.username || 'Petugas PGT',
      authorRole: isAdmin 
        ? 'Administrator Utama' 
        : `Petugas Section (${currentUser.assignedSection || 'Lapangan'})`,
      createdAt: new Date().toISOString().split('T')[0],
      pinned: formPinned
    };

    await onSaveAnnouncement(item);
    setIsModalOpen(false);
    triggerToast(editingId ? 'Pengumuman berhasil diperbarui!' : 'Pengumuman baru berhasil disiarkan!');
  };

  const handleTogglePin = async (ann: Announcement) => {
    const updated = { ...ann, pinned: !ann.pinned };
    await onSaveAnnouncement(updated);
    triggerToast(updated.pinned ? 'Pengumuman disematkan di posisi paling atas.' : 'Sematan pengumuman dicabut.');
  };

  const handleConfirmDelete = async () => {
    if (!annToDelete) return;
    const targetTitle = annToDelete.title;
    const targetId = annToDelete.id;
    setAnnToDelete(null);
    await onDeleteAnnouncement(targetId);
    triggerToast(`Pengumuman "${targetTitle}" berhasil dihapus.`);
  };

  // Copy text handler
  const handleCopyAnnouncement = (ann: Announcement) => {
    const fullText = `📢 *${ann.title.toUpperCase()}*\n📅 Diterbitkan: ${ann.createdAt} | Oleh: ${ann.author} (${ann.authorRole})\n🎯 Target: ${ann.targetAudience}\n\n${ann.content}\n\n--- PGT Mu'allimin Sistem Absensi Terpadu ---`;
    navigator.clipboard.writeText(fullText);
    triggerToast('Teks pengumuman berhasil disalin ke clipboard!', 'success');
  };

  // WhatsApp share handler
  const handleShareWhatsApp = (ann: Announcement) => {
    const fullText = `📢 *${ann.title.toUpperCase()}*\n📅 Diterbitkan: ${ann.createdAt} | Oleh: ${ann.author} (${ann.authorRole})\n🎯 Target: ${ann.targetAudience}\n\n${ann.content}\n\n--- *PGT Mu'allimin Marching Band* ---`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullText)}`;
    window.open(url, '_blank');
  };

  // Filtered announcements
  const filtered = announcements.filter(ann => {
    const matchSearch = ann.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        ann.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        ann.author.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchSearch) return false;

    if (selectedCategory !== 'all' && ann.category !== selectedCategory) return false;
    if (selectedAudience !== 'All' && ann.targetAudience !== 'All' && ann.targetAudience !== selectedAudience) return false;

    return true;
  });

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[11px] font-semibold mb-2">
            <Megaphone size={12} className="text-amber-400 animate-pulse" /> Papan Pengumuman & Arahan Latihan (Fleksibel & Terpadu)
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Pusat Informasi & Penyiaran Arahan ({announcements.length} Pesan)
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Dapat dibuat, diubah, disematkan, serta disebarkan langsung ke grup WhatsApp oleh Pelatih, Administrator, maupun Petugas Section.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Cetak atau simpan pengumuman untuk papan fisik"
          >
            <Printer size={14} />
            <span>Cetak Pengumuman</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-purple-950 transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            <span>Buat Pengumuman Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-lg space-y-3.5">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Cari pengumuman, arahan, jadwal, nama pembuat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'Semua Kategori' },
              { id: 'urgent', label: '🚨 Mendesak' },
              { id: 'schedule', label: '📅 Jadwal' },
              { id: 'info', label: '📢 Umum' },
              { id: 'praise', label: '🏆 Apresiasi' }
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Audience / Section Filter Pills */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-500 font-semibold text-[11px] shrink-0">Filter Sasaran Unit:</span>
          {sectionOptions.map(sec => (
            <button
              key={sec}
              type="button"
              onClick={() => setSelectedAudience(sec)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedAudience === sec
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-slate-800/60'
              }`}
            >
              {sec === 'All' ? 'Semua Unit' : `Section ${sec}`}
            </button>
          ))}
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-3">
            <Megaphone size={40} className="mx-auto text-slate-600 mb-1" />
            <div className="text-base font-bold text-slate-300">Belum Ada Pengumuman Cocok</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Tidak ada pengumuman yang sesuai dengan kata kunci atau filter sasaran unit yang Anda pilih.
            </p>
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setSelectedAudience('All'); }}
              className="px-4 py-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-800/50 text-purple-300 text-xs font-bold transition-all cursor-pointer"
            >
              Reset Semua Filter
            </button>
          </div>
        ) : (
          filtered.map(ann => {
            const isUrgent = ann.category === 'urgent';
            const isSchedule = ann.category === 'schedule';
            const isPraise = ann.category === 'praise';
            const isRead = readAnnouncements.has(ann.id);

            // Permission: Admin OR Author can edit/delete
            const canManage = isAdmin || (ann.author && ann.author === (currentUser.fullName || currentUser.username));

            const badgeColor = isUrgent 
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
              : isSchedule 
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : isPraise
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-sky-500/20 text-sky-300 border-sky-500/40';

            const badgeLabel = isUrgent ? 'Mendesak / Prioritas' : isSchedule ? 'Jadwal Latihan' : isPraise ? 'Apresiasi & Prestasi' : 'Informasi Umum';

            return (
              <div 
                key={ann.id}
                className={`bg-slate-900 border rounded-3xl p-5 sm:p-6 shadow-xl transition-all relative overflow-hidden ${
                  ann.pinned 
                    ? 'border-amber-500/50 bg-gradient-to-r from-slate-900 via-amber-950/15 to-slate-900' 
                    : isRead 
                    ? 'border-slate-800/70 opacity-90' 
                    : 'border-slate-800 hover:border-purple-600/40'
                }`}
              >
                {ann.pinned && (
                  <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
                )}

                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
                        {badgeLabel}
                      </span>

                      {ann.targetAudience !== 'All' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-800">
                          Khusus {ann.targetAudience}
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 border border-slate-800">
                          Seluruh Korps
                        </span>
                      )}

                      {ann.isAuto && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-400 bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 rounded-md">
                          <Sparkles size={11} className="text-blue-400" />
                          <span>BOT SISTEM</span>
                        </span>
                      )}

                      {ann.pinned && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md">
                          <Pin size={11} className="fill-amber-400" />
                          <span>Disematkan</span>
                        </span>
                      )}

                      {isRead && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-md">
                          <CheckCircle2 size={11} />
                          <span>Sudah Dibaca</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-white leading-snug pt-1">
                      {ann.title}
                    </h3>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto bg-slate-950/80 p-1 rounded-2xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleToggleRead(ann.id)}
                      className={`p-2 rounded-xl transition-colors cursor-pointer ${
                        isRead 
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                      title={isRead ? 'Tandai belum dibaca' : 'Tandai sudah dibaca & dipahami'}
                    >
                      <CheckCircle2 size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyAnnouncement(ann)}
                      className="p-2 text-slate-400 hover:text-purple-300 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                      title="Salin teks pengumuman lengkap"
                    >
                      <Copy size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleShareWhatsApp(ann)}
                      className="p-2 text-emerald-400 hover:bg-emerald-950/50 rounded-xl transition-colors cursor-pointer"
                      title="Bagikan ke WhatsApp Group Marching Band"
                    >
                      <MessageSquare size={15} />
                    </button>

                    {canManage && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleTogglePin(ann)}
                          className={`p-2 rounded-xl transition-colors cursor-pointer ${
                            ann.pinned 
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                              : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
                          }`}
                          title={ann.pinned ? 'Lepas sematan' : 'Sematkan ke paling atas'}
                        >
                          <Pin size={15} className={ann.pinned ? 'fill-amber-300' : ''} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(ann)}
                          className="p-2 text-slate-400 hover:text-purple-300 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                          title="Edit Pengumuman"
                        >
                          <Edit2 size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() => setAnnToDelete(ann)}
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                          title="Hapus Pengumuman"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-3.5 text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line bg-slate-950/80 p-4 sm:p-5 rounded-2xl border border-slate-800/80 font-normal">
                  {ann.content}
                </div>

                <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-300">{ann.author}</span>
                    <span>·</span>
                    <span className="text-[11px] text-purple-300 font-semibold">{ann.authorRole}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Clock size={12} className="text-slate-500" />
                    <span>Diterbitkan: {ann.createdAt}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: ADD / EDIT ANNOUNCEMENT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 text-slate-100 rounded-3xl p-5 sm:p-7 w-full max-w-2xl shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-950 text-purple-300 text-[10px] font-bold uppercase mb-0.5">
                  <Sparkles size={10} className="text-amber-400" /> Penyiaran Pesan Korps
                </div>
                <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <Megaphone size={18} className="text-amber-400" />
                  {editingId ? 'Edit Pengumuman / Arahan' : 'Buat Pengumuman Baru'}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick Template Picker */}
            {!editingId && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <FileText size={12} className="text-amber-400" />
                  <span>Isi Otomatis dengan Template Cepat:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyTemplate('schedule')}
                    className="px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    📅 Template Jadwal Latihan
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('urgent')}
                    className="px-2.5 py-1 bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500/25 text-rose-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    🚨 Template Peringatan Mendesak
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('praise')}
                    className="px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 text-emerald-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    🏆 Template Apresiasi
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  Judul Pengumuman
                </label>
                <input 
                  type="text" 
                  required 
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Contoh: Gladi Bersih Lapangan Korps Sabtu Ini" 
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                    Kategori Pesan
                  </label>
                  <select 
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                  >
                    <option value="info">📢 Informasi Umum</option>
                    <option value="schedule">📅 Jadwal Latihan / Acara</option>
                    <option value="urgent">🚨 Mendesak / Penting</option>
                    <option value="praise">🏆 Apresiasi & Motivasi</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Sasaran Unit / Section
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomAudience(!isCustomAudience)}
                      className="text-[11px] text-purple-400 hover:underline"
                    >
                      {isCustomAudience ? 'Gunakan pilihan standar' : '+ Target Kustom'}
                    </button>
                  </div>

                  {isCustomAudience ? (
                    <input
                      type="text"
                      required
                      value={customAudienceText}
                      onChange={(e) => setCustomAudienceText(e.target.value)}
                      placeholder="Mis: Khusus Alumni, Khusus Field Commander"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                    />
                  ) : (
                    <select 
                      value={formAudience}
                      onChange={(e) => setFormAudience(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                    >
                      <option value="All">Semua Unit (Seluruh Korps)</option>
                      {sectionOptions.filter(s => s !== 'All').map(sec => (
                        <option key={sec} value={sec}>Khusus Section {sec}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Isi Arahan / Pengumuman Lengkap
                  </label>
                  <span className="text-[11px] text-slate-500">{formContent.length} Karakter</span>
                </div>
                <textarea 
                  required 
                  rows={7}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Tuliskan arahan, instruksi seragam, tata tertib, atau informasi latihan di sini..." 
                  className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none leading-relaxed font-sans"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800">
                <input
                  type="checkbox"
                  id="pinToggle"
                  checked={formPinned}
                  onChange={(e) => setFormPinned(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="pinToggle" className="text-xs text-slate-300 font-semibold cursor-pointer flex items-center gap-1.5">
                  <Pin size={13} className="text-amber-400" />
                  Sematkan pengumuman ini di posisi paling atas (Pinned)
                </label>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send size={14} />
                  <span>{editingId ? 'Simpan Perubahan' : 'Siarkan Pengumuman'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={Boolean(annToDelete)}
        title="Hapus Pengumuman Ini?"
        message={`Apakah Anda yakin ingin menghapus pengumuman "${annToDelete?.title || ''}"? Tindakan ini akan menghapus informasi ini dari dashboard seluruh petugas dan admin.`}
        confirmText="Ya, Hapus Pengumuman"
        cancelText="Batal"
        isDanger={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setAnnToDelete(null)}
      />
    </div>
  );
};
