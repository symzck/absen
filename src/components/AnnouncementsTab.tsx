import React, { useState } from 'react';
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
  Filter
} from 'lucide-react';
import { Announcement } from '../services/db';
import { SystemUser } from '../App';
import { ConfirmModal } from './ConfirmModal';

interface AnnouncementsTabProps {
  announcements: Announcement[];
  currentUser: SystemUser;
  onSaveAnnouncement: (announcement: Announcement) => Promise<void>;
  onDeleteAnnouncement: (announcementId: string) => Promise<void>;
  triggerToast: (msg: string, type?: 'success' | 'warning' | 'info') => void;
}

export const AnnouncementsTab: React.FC<AnnouncementsTabProps> = ({
  announcements,
  currentUser,
  onSaveAnnouncement,
  onDeleteAnnouncement,
  triggerToast
}) => {
  const isAdmin = currentUser.role === 'admin';

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAudience, setSelectedAudience] = useState<string>('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState<'urgent' | 'info' | 'schedule' | 'praise'>('info');
  const [formAudience, setFormAudience] = useState<'All' | 'Brass' | 'Cologuard' | 'Battery' | 'Pit'>('All');
  const [formPinned, setFormPinned] = useState(false);

  // In-app Delete Confirmation Modal
  const [annToDelete, setAnnToDelete] = useState<Announcement | null>(null);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormTitle('');
    setFormContent('');
    setFormCategory('info');
    setFormAudience('All');
    setFormPinned(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ann: Announcement) => {
    setEditingId(ann.id);
    setFormTitle(ann.title);
    setFormContent(ann.content);
    setFormCategory(ann.category);
    setFormAudience(ann.targetAudience);
    setFormPinned(Boolean(ann.pinned));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      triggerToast('Judul dan isi pengumuman tidak boleh kosong!', 'warning');
      return;
    }

    const item: Announcement = {
      id: editingId || `ann-${Date.now()}`,
      title: formTitle.trim(),
      content: formContent.trim(),
      category: formCategory,
      targetAudience: formAudience,
      author: currentUser.fullName || 'Admin PGT',
      authorRole: isAdmin ? 'Administrator' : 'Petugas Lapangan',
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
    triggerToast(updated.pinned ? 'Pengumuman disematkan di atas.' : 'Sematkan pengumuman dicabut.');
  };

  const handleConfirmDelete = async () => {
    if (!annToDelete) return;
    const targetTitle = annToDelete.title;
    const targetId = annToDelete.id;
    setAnnToDelete(null);
    await onDeleteAnnouncement(targetId);
    triggerToast(`Pengumuman "${targetTitle}" berhasil dihapus.`);
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
            <Megaphone size={12} className="text-amber-400" /> Papan Pengumuman & Informasi Korps
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Pusat Informasi & Arahan Latihan
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Pengumuman jadwal, instruksi peralatan, dan informasi penting dari pelatih & administrator marching band.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-purple-950 transition-all active:scale-95 cursor-pointer self-start sm:self-auto shrink-0"
          >
            <Plus size={16} />
            <span>Buat Pengumuman Baru</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-lg space-y-3.5">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Cari pengumuman, arahan, jadwal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
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

        {/* Audience / Section Filter Pills */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-500 font-semibold text-[11px] shrink-0">Sasaran Section:</span>
          {['All', 'Brass', 'Cologuard', 'Battery', 'Pit'].map(sec => (
            <button
              key={sec}
              onClick={() => setSelectedAudience(sec)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                selectedAudience === sec
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
              }`}
            >
              {sec === 'All' ? 'Semua Unit' : `Section ${sec}`}
            </button>
          ))}
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-3.5">
        {filtered.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-2">
            <Megaphone size={36} className="mx-auto text-slate-600 mb-2" />
            <div className="text-base font-bold text-slate-300">Belum Ada Pengumuman</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Tidak ada pengumuman yang sesuai dengan filter pencarian Anda.
            </p>
          </div>
        ) : (
          filtered.map(ann => {
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

            const badgeLabel = isUrgent ? 'Mendesak / Prioritas' : isSchedule ? 'Jadwal Latihan' : isPraise ? 'Apresiasi & Prestasi' : 'Informasi Umum';

            return (
              <div 
                key={ann.id}
                className={`bg-slate-900 border rounded-3xl p-5 sm:p-6 shadow-xl transition-all relative overflow-hidden ${
                  ann.pinned ? 'border-amber-500/40 bg-gradient-to-r from-slate-900 via-amber-950/10 to-slate-900' : 'border-slate-800'
                }`}
              >
                {ann.pinned && (
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
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

                      {ann.pinned && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md">
                          <Pin size={11} className="fill-amber-400" />
                          <span>Disematkan</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-white leading-snug pt-1">
                      {ann.title}
                    </h3>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleTogglePin(ann)}
                        className={`p-2 rounded-xl transition-colors cursor-pointer ${
                          ann.pinned 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                            : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
                        }`}
                        title={ann.pinned ? 'Lepas sematan' : 'Sematkan ke atas'}
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
                    </div>
                  )}
                </div>

                <div className="mt-3.5 text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                  {ann.content}
                </div>

                <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-300">{ann.author}</span>
                    <span>·</span>
                    <span className="text-[11px] text-purple-400 font-medium">{ann.authorRole}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <Clock size={12} className="text-slate-400" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Megaphone size={20} className="text-amber-400" />
                {editingId ? 'Edit Pengumuman' : 'Buat Pengumuman / Informasi Baru'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

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
                  placeholder="Contoh: Gladi Lapangan Korps Sabtu Ini" 
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                    Kategori Pesan
                  </label>
                  <select 
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="info">📢 Informasi Umum</option>
                    <option value="schedule">📅 Jadwal Latihan / Acara</option>
                    <option value="urgent">🚨 Mendesak / Penting</option>
                    <option value="praise">🏆 Apresiasi & Motivasi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                    Sasaran Unit / Section
                  </label>
                  <select 
                    value={formAudience}
                    onChange={(e) => setFormAudience(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="All">Semua Unit (Seluruh Korps)</option>
                    <option value="Brass">Khusus Section Brass</option>
                    <option value="Cologuard">Khusus Section Cologuard</option>
                    <option value="Battery">Khusus Section Battery</option>
                    <option value="Pit">Khusus Section Pit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                  Isi Arahan / Pengumuman
                </label>
                <textarea 
                  required 
                  rows={5}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Tuliskan arahan, instruksi seragam, tata tertib, atau informasi latihan..." 
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none leading-relaxed"
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

              <div className="flex gap-2.5 pt-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white text-xs font-bold transition-all shadow-md"
                >
                  {editingId ? 'Simpan Perubahan' : 'Siarkan Pengumuman'}
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
