import { useState, useEffect, useRef, useCallback } from 'react';
import type { Socket } from 'socket.io-client';
import {
  Wifi,
  WifiOff,
  AlertCircle,
  Send,
  Trash2,
  Copy,
  Check,
  Zap,
  Server,
  Radio,
  ChevronDown,
  Settings,
  Save,
  FolderOpen,
  X,
} from 'lucide-react';

// @ts-expect-error - CDN global
const getIo = () => window.io;

interface SocketConfig {
  id: string;
  name: string;
  serverUrl: string;
  listenEvent: string;
  emitEvent: string;
  payload: string;
  createdAt: string;
  updatedAt: string;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  event: string;
  data: unknown;
  direction: 'incoming' | 'outgoing';
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const STORAGE_KEY = 'socket-dashboard-configs';
const CURRENT_CONFIG_KEY = 'socket-dashboard-current';

function App() {
  const [configs, setConfigs] = useState<SocketConfig[]>([]);
  const [currentConfigId, setCurrentConfigId] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState('http://localhost:3000');
  const [listenEvent, setListenEvent] = useState('user_update');
  const [emitEvent, setEmitEvent] = useState('get_users');
  const [payload, setPayload] = useState('{\n  "action": "list",\n  "limit": 10\n}');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [configName, setConfigName] = useState('');
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(true);

  const socketRef = useRef<Socket | null>(null);
  const logsRef = useRef<HTMLDivElement>(null);
  const saveInputRef = useRef<HTMLInputElement>(null);

  // Load configs from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SocketConfig[];
        setConfigs(parsed);
      }
      const currentId = localStorage.getItem(CURRENT_CONFIG_KEY);
      if (currentId) {
        setCurrentConfigId(currentId);
      }
    } catch {
      console.error('Failed to load configs from localStorage');
    }
  }, []);

  // Save configs to localStorage when they change
  useEffect(() => {
    if (configs.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
    }
  }, [configs]);

  // Load config when currentConfigId changes
  useEffect(() => {
    if (currentConfigId) {
      const config = configs.find((c) => c.id === currentConfigId);
      if (config) {
        setServerUrl(config.serverUrl);
        setListenEvent(config.listenEvent);
        setEmitEvent(config.emitEvent);
        setPayload(config.payload);
        localStorage.setItem(CURRENT_CONFIG_KEY, currentConfigId);
      }
    }
  }, [currentConfigId, configs]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  }, []);

  const addLog = useCallback((event: string, data: unknown, direction: 'incoming' | 'outgoing') => {
    const entry: LogEntry = {
      id: Date.now().toString() + Math.random(),
      timestamp: new Date(),
      event,
      data,
      direction,
    };
    setLogs((prev) => [entry, ...prev].slice(0, 100));
  }, []);

  const createConfig = useCallback((name: string) => {
    const newConfig: SocketConfig = {
      id: Date.now().toString(),
      name,
      serverUrl,
      listenEvent,
      emitEvent,
      payload,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setConfigs((prev) => [...prev, newConfig]);
    setCurrentConfigId(newConfig.id);
    showToast(`Saved "${name}"`, 'success');
    return newConfig;
  }, [serverUrl, listenEvent, emitEvent, payload, showToast]);

  const updateConfig = useCallback((id: string, name: string) => {
    setConfigs((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, name, serverUrl, listenEvent, emitEvent, payload, updatedAt: new Date().toISOString() }
          : c
      )
    );
    showToast(`Updated "${name}"`, 'success');
  }, [serverUrl, listenEvent, emitEvent, payload, showToast]);

  const deleteConfig = useCallback((id: string) => {
    setConfigs((prev) => prev.filter((c) => c.id !== id));
    if (currentConfigId === id) {
      setCurrentConfigId(null);
      localStorage.removeItem(CURRENT_CONFIG_KEY);
    }
    showToast('Config deleted', 'info');
  }, [currentConfigId, showToast]);

  const selectConfig = useCallback((id: string) => {
    setCurrentConfigId(id);
    setShowConfigModal(false);
    showToast('Config loaded', 'success');
  }, [showToast]);

  const handleSaveConfig = useCallback(() => {
    if (!configName.trim()) {
      showToast('Enter a name', 'error');
      return;
    }
    if (editingConfigId) {
      updateConfig(editingConfigId, configName.trim());
    } else {
      createConfig(configName.trim());
    }
    setShowSaveModal(false);
    setConfigName('');
    setEditingConfigId(null);
  }, [configName, editingConfigId, updateConfig, createConfig, showToast]);

  const openSaveModal = useCallback((isNew: boolean = true) => {
    if (isNew) {
      setConfigName('');
      setEditingConfigId(null);
    } else if (currentConfigId) {
      const config = configs.find((c) => c.id === currentConfigId);
      if (config) {
        setConfigName(config.name);
        setEditingConfigId(currentConfigId);
      }
    }
    setShowSaveModal(true);
    setTimeout(() => saveInputRef.current?.focus(), 50);
  }, [currentConfigId, configs]);

  const getCurrentConfigName = useCallback(() => {
    if (!currentConfigId) return null;
    const config = configs.find((c) => c.id === currentConfigId);
    return config?.name ?? null;
  }, [currentConfigId, configs]);

  const handleConnect = useCallback(() => {
    const io = getIo();
    if (!io) {
      showToast('Socket.IO not loaded. Refresh page.', 'error');
      return;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setConnectionStatus('connecting');
    setErrorMessage('');
    setLogs([]);

    try {
      const socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        timeout: 10000,
      });

      socketRef.current = socket as Socket;

      socket.on('connect', () => {
        setConnectionStatus('connected');
        showToast('Connected', 'success');
        addLog('connect', { socketId: socket.id }, 'incoming');
      });

      socket.on('connect_error', (error: Error) => {
        setConnectionStatus('error');
        setErrorMessage(error.message);
        showToast(`Error: ${error.message}`, 'error');
      });

      socket.on('disconnect', (reason: string) => {
        setConnectionStatus('disconnected');
        showToast(`Disconnected: ${reason}`, 'info');
        addLog('disconnect', { reason }, 'incoming');
      });

      socket.on(listenEvent, (data: unknown) => {
        addLog(listenEvent, data, 'incoming');
      });

    } catch (error) {
      setConnectionStatus('error');
      const message = error instanceof Error ? error.message : 'Unknown error';
      setErrorMessage(message);
      showToast(`Error: ${message}`, 'error');
    }
  }, [serverUrl, listenEvent, showToast, addLog]);

  const handleDisconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setConnectionStatus('disconnected');
    setErrorMessage('');
    showToast('Disconnected', 'info');
  }, [showToast]);

  const handleEmit = useCallback(() => {
    if (!socketRef.current || connectionStatus !== 'connected') {
      showToast('Not connected', 'error');
      return;
    }

    let parsedPayload: unknown;
    try {
      parsedPayload = JSON.parse(payload);
    } catch {
      showToast('Invalid JSON', 'error');
      return;
    }

    socketRef.current.emit(emitEvent, parsedPayload, (ack: unknown) => {
      if (ack !== undefined) {
        addLog(`${emitEvent} (ack)`, ack, 'incoming');
        showToast('Ack received', 'success');
      }
    });

    addLog(emitEvent, parsedPayload, 'outgoing');
    showToast('Event sent', 'success');
  }, [emitEvent, payload, connectionStatus, showToast, addLog]);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (socketRef.current && connectionStatus === 'connected') {
      socketRef.current.off();
      socketRef.current.on('connect', () => {
        setConnectionStatus('connected');
        showToast('Connected', 'success');
        addLog('connect', { socketId: socketRef.current?.id }, 'incoming');
      });
      socketRef.current.on(listenEvent, (data: unknown) => {
        addLog(listenEvent, data, 'incoming');
      });
    }
  }, [listenEvent, connectionStatus, showToast, addLog]);

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

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const copyToClipboard = useCallback((id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Compact Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-slate-700/50 bg-slate-800/50">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-400" />
          <span className="font-semibold text-white">Socket.IO Dashboard</span>
          {getCurrentConfigName() && (
            <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full">
              {getCurrentConfigName()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${statusConfig.bg}/20`}>
            <StatusIcon className={`w-3.5 h-3.5 ${statusConfig.color}`} />
            <span className={`text-xs font-medium ${statusConfig.color}`}>{statusConfig.text}</span>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <Settings className={`w-4 h-4 ${showSettings ? 'text-blue-400' : ''}`} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible Settings Panel */}
        <div
          className={`${showSettings ? 'w-72' : 'w-0'} transition-all duration-300 overflow-hidden border-r border-slate-700/50 bg-slate-800/30`}
        >
          <div className="w-72 h-full flex flex-col p-3 gap-3 overflow-y-auto">
            {/* Config Actions Row */}
            <div className="flex gap-1.5">
              <button
                onClick={() => openSaveModal(!currentConfigId)}
                className="flex-1 px-2 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Save className="w-3 h-3" />
                Save
              </button>
              <button
                onClick={() => setShowConfigModal(true)}
                className="flex-1 px-2 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <FolderOpen className="w-3 h-3" />
                Open {configs.length > 0 && `(${configs.length})`}
              </button>
            </div>

            {/* Connection Settings */}
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-xs font-medium text-slate-400">
                <Server className="w-3 h-3" />
                Server URL
              </label>
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                disabled={connectionStatus === 'connected'}
                className="w-full px-2 py-1.5 text-sm bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                placeholder="http://localhost:3000"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Listen Event</label>
              <input
                type="text"
                value={listenEvent}
                onChange={(e) => setListenEvent(e.target.value)}
                className="w-full px-2 py-1.5 text-sm bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="user_update"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleConnect}
                disabled={connectionStatus === 'connected' || connectionStatus === 'connecting'}
                className="flex-1 px-2 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
              >
                <Wifi className="w-3.5 h-3.5" />
                Connect
              </button>
              <button
                onClick={handleDisconnect}
                disabled={connectionStatus === 'disconnected'}
                className="flex-1 px-2 py-2 text-sm bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
              >
                <WifiOff className="w-3.5 h-3.5" />
                Disconnect
              </button>
            </div>

            {errorMessage && (
              <div className="px-2 py-1.5 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-xs">{errorMessage}</p>
              </div>
            )}

            <div className="border-t border-slate-700/50 my-2" />

            {/* Emit Settings */}
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-xs font-medium text-slate-400">
                <Send className="w-3 h-3" />
                Emit Event
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={emitEvent}
                  onChange={(e) => setEmitEvent(e.target.value)}
                  className="flex-1 px-2 py-1.5 text-sm bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="get_users"
                />
                <button
                  onClick={handleEmit}
                  disabled={connectionStatus !== 'connected'}
                  className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">JSON Payload</label>
              <textarea
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                rows={6}
                className="w-full px-2 py-1.5 text-xs bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono resize-none"
                placeholder='{"key": "value"}'
              />
            </div>
          </div>
        </div>

        {/* Logs Panel - Main Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/50">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/50 bg-slate-800/30">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-white">Events</span>
              <span className="text-xs text-slate-500">({logs.length})</span>
            </div>
            <button
              onClick={() => setLogs([])}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          </div>

          <div ref={logsRef} className="flex-1 overflow-y-auto p-2">
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600">
                <Radio className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm">No events</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-2 rounded-lg border ${
                      log.direction === 'outgoing'
                        ? 'bg-blue-500/5 border-blue-500/20'
                        : 'bg-emerald-500/5 border-emerald-500/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            log.direction === 'outgoing'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {log.direction === 'outgoing' ? 'OUT' : 'IN'}
                        </span>
                        <span className="text-white font-mono text-sm">{log.event}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500 text-[10px] font-mono">
                          {formatTimestamp(log.timestamp)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(log.id, JSON.stringify(log.data, null, 2))}
                          className="p-0.5 text-slate-500 hover:text-white rounded transition-colors"
                        >
                          {copiedId === log.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                    <pre className="text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap break-words">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl w-full max-w-sm max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
              <h3 className="font-semibold text-white">Saved Configurations</h3>
              <button onClick={() => setShowConfigModal(false)} className="p-1 text-slate-400 hover:text-white">
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
                      onClick={() => selectConfig(config.id)}
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
                            deleteConfig(config.id);
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
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl w-full max-w-xs">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
              <h3 className="font-semibold text-white">{editingConfigId ? 'Update' : 'Save'} Config</h3>
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setConfigName('');
                  setEditingConfigId(null);
                }}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <input
                ref={saveInputRef}
                type="text"
                value={configName}
                onChange={(e) => setConfigName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveConfig()}
                className="w-full px-3 py-2 text-sm bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 mb-3"
                placeholder="Configuration name"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowSaveModal(false);
                    setConfigName('');
                    setEditingConfigId(null);
                  }}
                  className="flex-1 px-3 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveConfig}
                  disabled={!configName.trim()}
                  className="flex-1 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 text-white rounded-lg disabled:opacity-50"
                >
                  {editingConfigId ? 'Update' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-1.5 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm animate-slide-in ${
              toast.type === 'success'
                ? 'bg-emerald-500/90 text-white'
                : toast.type === 'error'
                ? 'bg-red-500/90 text-white'
                : 'bg-blue-500/90 text-white'
            }`}
          >
            {toast.type === 'success' && <Check className="w-3.5 h-3.5" />}
            {toast.type === 'error' && <AlertCircle className="w-3.5 h-3.5" />}
            {toast.type === 'info' && <Radio className="w-3.5 h-3.5" />}
            <span className="font-medium">{toast.message}</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.2s ease-out; }
      `}</style>
    </div>
  );
}

export default App;
