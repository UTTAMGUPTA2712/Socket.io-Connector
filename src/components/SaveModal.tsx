import React from 'react';
import { X } from 'lucide-react';

interface SaveModalProps {
  editingConfigId: string | null;
  configName: string;
  onChangeConfigName: (name: string) => void;
  onSave: () => void;
  onClose: () => void;
  saveInputRef: React.RefObject<HTMLInputElement>;
}

export const SaveModal: React.FC<SaveModalProps> = ({
  editingConfigId,
  configName,
  onChangeConfigName,
  onSave,
  onClose,
  saveInputRef,
}) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl w-full max-w-xs">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h3 className="font-semibold text-white">{editingConfigId ? 'Update' : 'Save'} Config</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4">
          <input
            ref={saveInputRef}
            type="text"
            value={configName}
            onChange={(e) => onChangeConfigName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSave()}
            className="w-full px-3 py-2 text-sm bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 mb-3"
            placeholder="Configuration name"
          />
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={!configName.trim()}
              className="flex-1 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white rounded-lg disabled:opacity-50"
            >
              {editingConfigId ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
