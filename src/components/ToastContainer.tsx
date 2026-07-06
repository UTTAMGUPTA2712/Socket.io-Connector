import React from 'react';
import { Check, AlertCircle, Radio, X } from 'lucide-react';
import { Toast } from '../types/socket';

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-1.5 z-50">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-3 py-2 rounded-lg shadow-lg flex items-center justify-between gap-3 text-sm animate-slide-in ${
            toast.type === 'success'
              ? 'bg-emerald-500/90 text-white'
              : toast.type === 'error'
              ? 'bg-red-500/90 text-white'
              : 'bg-blue-500/90 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' && <Check className="w-3.5 h-3.5" />}
            {toast.type === 'error' && <AlertCircle className="w-3.5 h-3.5" />}
            {toast.type === 'info' && <Radio className="w-3.5 h-3.5" />}
            <span className="font-medium">{toast.message}</span>
          </div>
          <button
            onClick={() => onClose(toast.id)}
            className="p-0.5 hover:bg-white/20 rounded transition-colors text-white/80 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
