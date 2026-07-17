import React, { useState } from 'react';
import { Radio, Trash2, Check, Copy, Maximize2 } from 'lucide-react';
import { LogEntry } from '../types/socket';
import { LogDetailModal } from './LogDetailModal';

interface LogsPanelProps {
  logs: LogEntry[];
  copiedId: string | null;
  onClearLogs: () => void;
  onCopyLog: (id: string, text: string) => void;
  logsRef: React.RefObject<HTMLDivElement>;
}

export const LogsPanel: React.FC<LogsPanelProps> = ({
  logs,
  copiedId,
  onClearLogs,
  onCopyLog,
  logsRef,
}) => {
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const selectedLog = logs.find((l) => l.id === selectedLogId) || null;

  const formatTimestamp = (date: Date) => {
    // If timestamp is not a Date object (e.g. from JSON parse), construct it
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="w-96 flex flex-col overflow-hidden bg-slate-900/50 shrink-0">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/50 bg-slate-800/30">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-white">Events Log</span>
          <span className="text-xs text-slate-500">({logs.length})</span>
        </div>
        <button
          onClick={onClearLogs}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear
        </button>
      </div>

      <div ref={logsRef} className="flex-1 overflow-y-auto p-3">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600">
            <Radio className="w-10 h-10 mb-2 opacity-50" />
            <p className="text-sm">No events logged</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`p-2.5 rounded-lg border cursor-pointer ${
                  log.direction === 'outgoing'
                    ? 'bg-blue-500/5 border-blue-500/20'
                    : 'bg-emerald-500/5 border-emerald-500/20'
                }`}
                onClick={() => setSelectedLogId(log.id)}
              >
                <div className="flex items-center justify-between mb-1.5">
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
                    <span className="text-white font-mono text-xs font-semibold truncate">{log.event}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-slate-500 text-[10px] font-mono">
                      {formatTimestamp(log.timestamp)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLogId(log.id);
                      }}
                      className="p-0.5 text-slate-500 hover:text-white rounded transition-colors"
                      title="View full response"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopyLog(log.id, JSON.stringify(log.data, null, 2));
                      }}
                      className="p-0.5 text-slate-500 hover:text-white rounded transition-colors"
                      title="Copy response"
                    >
                      {copiedId === log.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap break-words leading-relaxed max-h-[150px] overflow-y-auto bg-slate-950/20 p-1.5 rounded">
                  {JSON.stringify(log.data, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedLog && (
        <LogDetailModal
          log={selectedLog}
          copied={copiedId === selectedLog.id}
          onCopy={() => onCopyLog(selectedLog.id, JSON.stringify(selectedLog.data, null, 2))}
          onClose={() => setSelectedLogId(null)}
        />
      )}
    </div>
  );
};
