import React, { useRef } from 'react';
import { X, FolderOpen, Trash2, Download, Upload } from 'lucide-react';
import { SocketConfig } from '../types/socket';

interface ConfigModalProps {
  configs: SocketConfig[];
  currentConfigId: string | null;
  onSelectConfig: (id: string) => void;
  onDeleteConfig: (id: string) => void;
  onExportConfig: (config: SocketConfig) => void;
  onExportAll: () => void;
  onImportFile: (file: File) => void;
  onClose: () => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  configs,
  currentConfigId,
  onSelectConfig,
  onDeleteConfig,
  onExportConfig,
  onExportAll,
  onImportFile,
  onClose,
}) => {
  const importInputRef = useRef<HTMLInputElement>(null);

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleImportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportFile(file);
    }
    e.target.value = '';
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

        <div className="flex gap-2 px-3 pt-3">
          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImportChange}
          />
          <button
            onClick={() => importInputRef.current?.click()}
            className="flex-1 px-2.5 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
            title="Import configuration(s) from a JSON file"
          >
            <Upload className="w-3.5 h-3.5" />
            Import
          </button>
          <button
            onClick={onExportAll}
            disabled={configs.length === 0}
            className="flex-1 px-2.5 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:hover:bg-slate-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
            title="Export all configurations to a JSON file"
          >
            <Download className="w-3.5 h-3.5" />
            Export All
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {configs.length === 0 ? (
            <div className="text-center py-6">
              <FolderOpen className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-slate-400 text-sm">No saved configurations</p>
              <p className="text-slate-500 text-xs mt-1">Import a shared config or save one from the sidebar</p>
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
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onExportConfig(config);
                        }}
                        className="p-1 text-slate-500 hover:text-blue-400"
                        title="Export this configuration"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConfig(config.id);
                        }}
                        className="p-1 text-slate-500 hover:text-red-400"
                        title="Delete this configuration"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
