import React from 'react';
import { Save, FolderOpen, Server, Wifi, WifiOff, Radio, X } from 'lucide-react';
import { ConnectionStatus, ListenerConfig } from '../types/socket';

interface SidebarProps {
  showSettings: boolean;
  serverUrl: string;
  onChangeServerUrl: (url: string) => void;
  connectionStatus: ConnectionStatus;
  errorMessage: string;
  listeners: ListenerConfig[];
  onConnect: () => void;
  onDisconnect: () => void;
  onSaveConfigClick: () => void;
  onOpenConfigClick: () => void;
  savedConfigsCount: number;
  onAddListener: () => void;
  onToggleListenerActive: (id: string) => void;
  onUpdateListenerEvent: (id: string, event: string) => void;
  onDeleteListener: (id: string) => void;
  onListenerBlur: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  showSettings,
  serverUrl,
  onChangeServerUrl,
  connectionStatus,
  errorMessage,
  listeners,
  onConnect,
  onDisconnect,
  onSaveConfigClick,
  onOpenConfigClick,
  savedConfigsCount,
  onAddListener,
  onToggleListenerActive,
  onUpdateListenerEvent,
  onDeleteListener,
  onListenerBlur,
}) => {
  return (
    <div
      className={`${showSettings ? 'w-80 border-r border-slate-700/50' : 'w-0 border-r-0'} transition-all duration-300 overflow-hidden bg-slate-850/40 flex flex-col`}
    >
      <div className="w-80 h-full flex flex-col p-4 gap-4 overflow-y-auto">
        {/* Config Actions Row */}
        <div className="flex gap-2">
          <button
            onClick={onSaveConfigClick}
            className="flex-1 px-2.5 py-1.5 text-xs bg-slate-700 hover:bg-slate-650 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>
          <button
            onClick={onOpenConfigClick}
            className="flex-1 px-2.5 py-1.5 text-xs bg-slate-700 hover:bg-slate-655 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Open {savedConfigsCount > 0 && `(${savedConfigsCount})`}
          </button>
        </div>

        {/* Connection Settings */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <Server className="w-3.5 h-3.5 text-blue-400" />
            Server URL
          </label>
          <input
            type="text"
            value={serverUrl}
            onChange={(e) => onChangeServerUrl(e.target.value)}
            disabled={connectionStatus === 'connected'}
            className="w-full px-2.5 py-1.5 text-sm bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            placeholder="http://localhost:8000"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onConnect}
            disabled={connectionStatus === 'connected' || connectionStatus === 'connecting'}
            className="flex-1 px-2 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1 shadow-sm"
          >
            <Wifi className="w-4 h-4" />
            Connect
          </button>
          <button
            onClick={onDisconnect}
            disabled={connectionStatus === 'disconnected'}
            className="flex-1 px-2 py-2 text-sm bg-slate-700 hover:bg-slate-650 disabled:bg-slate-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1 shadow-sm"
          >
            <WifiOff className="w-4 h-4" />
            Disconnect
          </button>
        </div>

        {errorMessage && (
          <div className="px-3 py-2 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-xs">{errorMessage}</p>
          </div>
        )}

        <div className="border-t border-slate-700/50 my-1" />

        {/* Listeners Section */}
        <div className="flex flex-col gap-2 flex-1 min-h-[220px]">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <Radio className="w-3.5 h-3.5 text-blue-400" />
              Listeners ({listeners.filter((l) => l.isActive).length}/{listeners.length})
            </label>
            <button
              onClick={onAddListener}
              className="px-2 py-1 text-[11px] bg-slate-700 hover:bg-slate-650 text-slate-200 rounded-md font-medium transition-colors border border-slate-600/50 shadow-sm"
            >
              + Add
            </button>
          </div>

          <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1">
            {listeners.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-4">No listeners configured</p>
            ) : (
              listeners.map((listener) => (
                <div
                  key={listener.id}
                  className="flex items-center gap-1.5 bg-slate-900/30 p-2 rounded-lg border border-slate-700/50 group"
                >
                  <input
                    type="checkbox"
                    checked={listener.isActive}
                    onChange={() => onToggleListenerActive(listener.id)}
                    className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-900 h-4 w-4 cursor-pointer"
                    title={listener.isActive ? 'Disable listener' : 'Enable listener'}
                  />
                  <input
                    type="text"
                    value={listener.event}
                    onChange={(e) => onUpdateListenerEvent(listener.id, e.target.value)}
                    onBlur={onListenerBlur}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                    className="flex-1 min-w-0 bg-transparent border-0 border-b border-transparent hover:border-slate-600 focus:border-blue-500 focus:ring-0 text-xs font-mono text-white py-0.5 px-1 rounded"
                    placeholder="event_name"
                  />
                  <button
                    onClick={() => onDeleteListener(listener.id)}
                    className="p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete listener"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
          {connectionStatus === 'connected' && (
            <span className="text-[10px] text-slate-500 italic mt-1 leading-relaxed">
              * Listener modifications trigger automatic reconnection.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
