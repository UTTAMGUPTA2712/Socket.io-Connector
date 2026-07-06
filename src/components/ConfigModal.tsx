import React from 'react';
import { X, FolderOpen, Trash2 } from 'lucide-react';
import { SocketConfig } from '../types/socket';

interface ConfigModalProps {
  configs: SocketConfig[];
  currentConfigId: string | null;
  onSelectConfig: (id: string) => void;
  onDeleteConfig: (id: string) => void;
  onClose: () => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  configs,
  currentConfigId,
  onSelectConfig,
  onDeleteConfig,
  onClose,
}) => {
  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl w-full max-w-sm max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h3 className="font-semibold text-white">Saved Configurations</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {configs.length === 0 ? (
            <div className="text-center py-6">
              <FolderOpen className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-slate-400 text-sm">No saved configurations</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {configs.map((config) => (
                <div
                  key={config.id}
                  onClick={() => onSelectConfig(config.id)}
                  className={`p-3 rounded-lg cursor-pointer group transition-colors ${
                    currentConfigId === config.id
                      ? 'bg-blue-500/20 border border-blue-500/30'
                      : 'bg-slate-700/50 hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm font-medium">{config.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConfig(config.id);
                      }}
                      className="p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-xs text-slate-400 font-mono truncate mt-1">{config.serverUrl}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{formatDate(config.updatedAt)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
