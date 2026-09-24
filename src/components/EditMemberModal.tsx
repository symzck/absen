import React, { useState, useEffect } from 'react';
import { X, Save, Edit3, ShieldAlert } from 'lucide-react';

export interface Student {
  id: number;
  name: string;
  kelas: string;
  asrama: string;
  section: string;
}

interface EditMemberModalProps {
  isOpen: boolean;
  student: Student | null;
  onClose: () => void;
  onSave: (updated: Student) => void;
}

const SECTION_OPTIONS = ['Brass', 'Battery', 'Cologuard', 'Pit'];
const ASRAMA_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'Luar'];
const KELAS_OPTIONS = [
  '1A', '1B', '1C', '1D', '1E', '1F', '1G', '1H', '1US', '1LSA',
  '2A', '2B', '2C', '2D', '2E', '2F', '2G', '2H', '2US', '2LSA',
  '3A', '3B', '3C', '3D', '3E', '3F', '3G', '3H', '3US', '3LSA',
  '4A', '4B', '4C', '4D', '4E', '4F', '4G', '4H', '4US', '4LSA',
  '5A', '5B', '5C', '5D', '5E', '5F', '5G', '5H', '5US', '5LSA',
  '6A', '6B', '6C', '6D', '6E', '6F', '6G', '6H', '6US', '6LSA'
];

export const EditMemberModal: React.FC<EditMemberModalProps> = ({
  isOpen,
  student,
  onClose,
  onSave
}) => {
  const [name, setName] = useState('');
  const [kelas, setKelas] = useState('');
  const [asrama, setAsrama] = useState('A');
  const [section, setSection] = useState('Brass');
  const [customKelas, setCustomKelas] = useState(false);

  useEffect(() => {
    if (student) {
      setName(student.name);
      setKelas(student.kelas);
      setAsrama(student.asrama);
      setSection(student.section);
      setCustomKelas(!KELAS_OPTIONS.includes(student.kelas));
    }
  }, [student]);

  if (!isOpen || !student) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      ...student,
      name: name.trim(),
      kelas: kelas.trim(),
      asrama: asrama.trim(),
      section
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative text-left">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-2xl border border-purple-500/20">
            <Edit3 size={22} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">Edit Data Anggota</h3>
            <p className="text-xs text-slate-400">ID Anggota: #{student.id} · PGT Mu'allimin</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nama Lengkap Pemain
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama lengkap siswa..."
              className="w-full text-sm px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">Kelas</label>
                <button
                  type="button"
                  onClick={() => setCustomKelas(!customKelas)}
                  className="text-[11px] text-purple-400 hover:underline"
                >
                  {customKelas ? 'Pilih dari list' : 'Tulis manual'}
                </button>
              </div>

              {customKelas ? (
                <input
                  type="text"
                  required
                  value={kelas}
                  onChange={(e) => setKelas(e.target.value)}
                  placeholder="Contoh: 3A, 2H, dll"
                  className="w-full text-sm px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              ) : (
                <select
                  value={kelas}
                  onChange={(e) => setKelas(e.target.value)}
                  className="w-full text-sm px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {KELAS_OPTIONS.map((k) => (
                    <option key={k} value={k}>
                      Kelas {k}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Asrama
              </label>
              <select
                value={asrama}
                onChange={(e) => setAsrama(e.target.value)}
                className="w-full text-sm px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {ASRAMA_OPTIONS.map((a) => (
                  <option key={a} value={a}>
                    Asrama {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Section Marching Band
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SECTION_OPTIONS.map((sec) => (
                <button
                  type="button"
                  key={sec}
                  onClick={() => setSection(sec)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                    section === sec
                      ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-950'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-purple-950 transition-all active:scale-95"
            >
              <Save size={16} />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
