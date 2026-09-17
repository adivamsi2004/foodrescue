import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDanger?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isDanger = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in" id="confirm-modal">
      <div className="bg-white rounded-xl max-w-md w-full border border-stone-200 overflow-hidden shadow-xl animate-scale-up">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-full ${isDanger ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 leading-tight">{title}</h3>
          </div>
          <p className="text-sm text-stone-500 leading-relaxed">{message}</p>
        </div>
        <div className="bg-stone-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-stone-100">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
            id="confirm-cancel-btn"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all cursor-pointer shadow-xs ${
              isDanger 
                ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800' 
                : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
            }`}
            id="confirm-approve-btn"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
