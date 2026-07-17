import React from 'react';
import { X, Copy, Check } from 'lucide-react';
import { LogEntry } from '../types/socket';

interface LogDetailModalProps {
  log: LogEntry;
  copied: boolean;
  onCopy: () => void;
  onClose: () => void;
}

export const LogDetailModal: React.FC<LogDetailModalProps> = ({ log, copied, onCopy, onClose }) => {
  const formatTimestamp = (date: Date) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleString('en-US', { hour12: false });
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide shrink-0 ${
                log.direction === 'outgoing'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {log.direction === 'outgoing' ? 'OUT' : 'IN'}
            </span>
            <h3 className="font-semibold text-white font-mono text-sm truncate">{log.event}</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-4 py-2 border-b border-slate-700/50 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 font-mono">{formatTimestamp(log.timestamp)}</span>
          <button
            onClick={onCopy}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap break-words leading-relaxed bg-slate-950/40 p-3 rounded-lg">
            {JSON.stringify(log.data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};
