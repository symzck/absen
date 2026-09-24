import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  details?: string[];
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  details,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  isDanger = false,
  isLoading = false,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-left">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-4 mb-4">
          <div className={`p-3 rounded-2xl shrink-0 ${isDanger ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'}`}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white leading-snug">{title}</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        {details && details.length > 0 && (
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 mb-5 space-y-1 text-xs text-slate-300">
            {details.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                <span>{d}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl text-white shadow-lg transition-all active:scale-95 flex items-center gap-2 ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-950'
                : 'bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 shadow-purple-950'
            }`}
          >
            {isLoading && (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
