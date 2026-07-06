import React from 'react';
import { Zap, Settings, Wifi, Radio, AlertCircle, WifiOff } from 'lucide-react';
import { ConnectionStatus } from '../types/socket';

interface HeaderProps {
  currentConfigName: string | null;
  connectionStatus: ConnectionStatus;
  showSettings: boolean;
  onToggleSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentConfigName,
  connectionStatus,
  showSettings,
  onToggleSettings,
}) => {
  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return { icon: Wifi, text: 'Connected', color: 'text-emerald-400', bg: 'bg-emerald-500' };
      case 'connecting':
        return { icon: Radio, text: 'Connecting...', color: 'text-amber-400', bg: 'bg-amber-500' };
      case 'error':
        return { icon: AlertCircle, text: 'Error', color: 'text-red-400', bg: 'bg-red-500' };
      default:
        return { icon: WifiOff, text: 'Disconnected', color: 'text-slate-400', bg: 'bg-slate-500' };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-slate-700/50 bg-slate-800/50">
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-blue-400" />
        <span className="font-semibold text-white">Socket.IO Dashboard</span>
        {currentConfigName && (
          <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full">
            {currentConfigName}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${statusConfig.bg}/20`}>
          <StatusIcon className={`w-3.5 h-3.5 ${statusConfig.color}`} />
          <span className={`text-xs font-medium ${statusConfig.color}`}>{statusConfig.text}</span>
        </div>
        <button
          onClick={onToggleSettings}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
        >
          <Settings className={`w-4 h-4 ${showSettings ? 'text-blue-400' : ''}`} />
        </button>
      </div>
    </header>
  );
};
