import React from 'react';
import { Send, Zap, ChevronDown, Copy, Trash2 } from 'lucide-react';
import { EmitterConfig, ConnectionStatus } from '../types/socket';

interface EmittersPanelProps {
  emitters: EmitterConfig[];
  connectionStatus: ConnectionStatus;
  onAddEmitter: () => void;
  onUpdateEmitterEvent: (id: string, event: string) => void;
  onUpdateEmitterPayload: (id: string, payload: string) => void;
  onToggleEmitterExpanded: (id: string) => void;
  onDeleteEmitter: (id: string) => void;
  onDuplicateEmitter: (emitter: EmitterConfig) => void;
  onEmit: (emitter: EmitterConfig) => void;
}

export const EmittersPanel: React.FC<EmittersPanelProps> = ({
  emitters,
  connectionStatus,
  onAddEmitter,
  onUpdateEmitterEvent,
  onUpdateEmitterPayload,
  onToggleEmitterExpanded,
  onDeleteEmitter,
  onDuplicateEmitter,
  onEmit,
}) => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-700/50 bg-slate-900/20">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/50 bg-slate-800/30">
        <div className="flex items-center gap-2">
          <Send className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold text-white">Emitters</span>
          <span className="text-xs text-slate-500">({emitters.length})</span>
        </div>
        <button
          onClick={onAddEmitter}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors shadow-md"
        >
          <span>+ Add Emitter</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {emitters.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 py-12">
            <Send className="w-12 h-12 mb-3 opacity-50 text-slate-500" />
            <p className="text-sm font-medium">No emitters configured</p>
            <button
              onClick={onAddEmitter}
              className="mt-3 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-blue-400 rounded-lg transition-colors"
            >
              Create one now
            </button>
          </div>
        ) : (
          emitters.map((emitter) => (
            <div
              key={emitter.id}
              className={`bg-slate-800/40 rounded-xl border transition-all duration-200 ${
                emitter.isExpanded ? 'border-slate-700 shadow-lg' : 'border-slate-700/50 hover:border-slate-700'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between p-3 gap-3">
                <div className="flex-1 flex items-center gap-2">
                  <Send className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <input
                    type="text"
                    value={emitter.event}
                    onChange={(e) => onUpdateEmitterEvent(emitter.id, e.target.value)}
                    className="bg-transparent border-0 border-b border-transparent hover:border-slate-600 focus:border-blue-500 focus:ring-0 text-sm font-mono text-white py-0.5 px-1 rounded flex-1 min-w-0"
                    placeholder="event_name"
                  />
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onEmit(emitter)}
                    disabled={connectionStatus !== 'connected'}
                    className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors shadow-sm"
                    title={connectionStatus === 'connected' ? 'Emit event' : 'Connect to server to emit'}
                  >
                    <Zap className="w-3 h-3" />
                    <span>Send</span>
                  </button>

                  <button
                    onClick={() => onToggleEmitterExpanded(emitter.id)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                    title={emitter.isExpanded ? 'Collapse payload' : 'Expand payload'}
                  >
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        emitter.isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  <button
                    onClick={() => onDuplicateEmitter(emitter)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                    title="Duplicate emitter"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeleteEmitter(emitter.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-colors"
                    title="Delete emitter"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card Body (Payload Area) */}
              {emitter.isExpanded && (
                <div className="p-3 pt-0 border-t border-slate-700 bg-slate-900/30 rounded-b-xl">
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider font-mono">
                    JSON Payload
                  </label>
                  <textarea
                    value={emitter.payload}
                    onChange={(e) => onUpdateEmitterPayload(emitter.id, e.target.value)}
                    rows={5}
                    className="w-full p-2.5 text-xs bg-slate-900/80 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono resize-y"
                    placeholder='{"key": "value"}'
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
