import { useState, useEffect, useRef, useCallback } from 'react';
import type { Socket } from 'socket.io-client';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { EmittersPanel } from './components/EmittersPanel';
import { LogsPanel } from './components/LogsPanel';
import { ToastContainer } from './components/ToastContainer';
import { ConfigModal } from './components/ConfigModal';
import { SaveModal } from './components/SaveModal';
import { migrateConfig } from './utils/migration';
import {
  ListenerConfig,
  EmitterConfig,
  SocketConfig,
  LogEntry,
  ConnectionStatus,
  Toast,
} from './types/socket';

// @ts-expect-error - CDN global
const getIo = () => window.io;

const STORAGE_KEY = 'socket-dashboard-configs';
const CURRENT_CONFIG_KEY = 'socket-dashboard-current';

function App() {
  const [configs, setConfigs] = useState<SocketConfig[]>([]);
  const [currentConfigId, setCurrentConfigId] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState('http://localhost:8080');
  const [listeners, setListeners] = useState<ListenerConfig[]>([
    { id: 'default-listener', event: 'user_update', isActive: true },
  ]);
  const [emitters, setEmitters] = useState<EmitterConfig[]>([
    {
      id: 'default-emitter',
      event: 'get_users',
      payload: '{\n  "action": "list",\n  "limit": 10\n}',
      isExpanded: false,
    },
  ]);
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
  const isLoadedRef = useRef(false);

  // Load configs and active state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as any[];
        const migrated = parsed.map(migrateConfig);
        setConfigs(migrated);
      }
      const activeStateStr = localStorage.getItem('socket-dashboard-active-state');
      if (activeStateStr) {
        const activeState = JSON.parse(activeStateStr);
        if (activeState.serverUrl) setServerUrl(activeState.serverUrl);
        if (activeState.listeners) setListeners(activeState.listeners);
        if (activeState.emitters) setEmitters(activeState.emitters);
        if (activeState.currentConfigId) setCurrentConfigId(activeState.currentConfigId);
      } else {
        const currentId = localStorage.getItem(CURRENT_CONFIG_KEY);
        if (currentId) {
          setCurrentConfigId(currentId);
        }
      }
    } catch {
      console.error('Failed to load configs from localStorage');
    } finally {
      isLoadedRef.current = true;
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
        setListeners(config.listeners || []);
        setEmitters(config.emitters || []);
        localStorage.setItem(CURRENT_CONFIG_KEY, currentConfigId);
      }
    }
  }, [currentConfigId, configs]);

  // Auto-save active state to localStorage on modification
  useEffect(() => {
    if (!isLoadedRef.current) return;
    const activeState = {
      serverUrl,
      listeners,
      emitters,
      currentConfigId,
    };
    localStorage.setItem('socket-dashboard-active-state', JSON.stringify(activeState));
  }, [serverUrl, listeners, emitters, currentConfigId]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setToasts((prev) => {
      const next = [...prev, { id, message, type }];
      if (next.length > 3) {
        return next.slice(next.length - 3);
      }
      return next;
    });
    setTimeout(() => {
      removeToast(id);
    }, 2500);
  }, [removeToast]);

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

      // Bind all active listeners
      listeners.forEach((listener) => {
        if (listener.isActive && listener.event.trim()) {
          socket.on(listener.event.trim(), (data: unknown) => {
            addLog(listener.event.trim(), data, 'incoming');
          });
        }
      });

    } catch (error) {
      setConnectionStatus('error');
      const message = error instanceof Error ? error.message : 'Unknown error';
      setErrorMessage(message);
      showToast(`Error: ${message}`, 'error');
    }
  }, [serverUrl, listeners, showToast, addLog]);

  const handleDisconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setConnectionStatus('disconnected');
    setErrorMessage('');
    showToast('Disconnected', 'info');
  }, [showToast]);

  // Reconnection helper on listener updates
  const handleListenerChange = useCallback(() => {
    if (socketRef.current && connectionStatus === 'connected') {
      showToast('Reconnecting to apply listener changes...', 'info');
      handleConnect();
    }
  }, [connectionStatus, handleConnect, showToast]);

  // Listener handlers
  const addListener = useCallback(() => {
    const newListener: ListenerConfig = {
      id: Date.now().toString() + Math.random(),
      event: 'new_event',
      isActive: true,
    };
    setListeners((prev) => [...prev, newListener]);
    setTimeout(() => handleListenerChange(), 0);
  }, [handleListenerChange]);

  const updateListenerEvent = useCallback((id: string, event: string) => {
    setListeners((prev) =>
      prev.map((l) => (l.id === id ? { ...l, event } : l))
    );
  }, []);

  const toggleListenerActive = useCallback((id: string) => {
    setListeners((prev) =>
      prev.map((l) => (l.id === id ? { ...l, isActive: !l.isActive } : l))
    );
    setTimeout(() => handleListenerChange(), 0);
  }, [handleListenerChange]);

  const deleteListener = useCallback((id: string) => {
    setListeners((prev) => prev.filter((l) => l.id !== id));
    setTimeout(() => handleListenerChange(), 0);
  }, [handleListenerChange]);

  const handleListenerBlur = useCallback(() => {
    handleListenerChange();
  }, [handleListenerChange]);

  // Emitter handlers
  const addEmitter = useCallback(() => {
    const newEmitter: EmitterConfig = {
      id: Date.now().toString() + Math.random(),
      event: 'new_event',
      payload: '{\n  "action": "execute"\n}',
      isExpanded: true,
    };
    setEmitters((prev) => [...prev, newEmitter]);
    showToast('Emitter added', 'success');
  }, [showToast]);

  const updateEmitterEvent = useCallback((id: string, event: string) => {
    setEmitters((prev) =>
      prev.map((e) => (e.id === id ? { ...e, event } : e))
    );
  }, []);

  const updateEmitterPayload = useCallback((id: string, payload: string) => {
    setEmitters((prev) =>
      prev.map((e) => (e.id === id ? { ...e, payload } : e))
    );
  }, []);

  const toggleEmitterExpanded = useCallback((id: string) => {
    setEmitters((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isExpanded: !e.isExpanded } : e))
    );
  }, []);

  const deleteEmitter = useCallback((id: string) => {
    setEmitters((prev) => prev.filter((e) => e.id !== id));
    showToast('Emitter deleted', 'info');
  }, [showToast]);

  const duplicateEmitter = useCallback((emitter: EmitterConfig) => {
    const duplicated: EmitterConfig = {
      ...emitter,
      id: Date.now().toString() + Math.random(),
      event: `${emitter.event}_copy`,
      isExpanded: true,
    };
    setEmitters((prev) => [...prev, duplicated]);
    showToast('Emitter duplicated', 'success');
  }, [showToast]);

  const handleEmit = useCallback((emitter: EmitterConfig) => {
    if (!socketRef.current || connectionStatus !== 'connected') {
      showToast('Not connected', 'error');
      return;
    }

    let parsedPayload: unknown;
    try {
      parsedPayload = JSON.parse(emitter.payload);
    } catch {
      showToast(`Invalid JSON in event "${emitter.event}"`, 'error');
      return;
    }

    socketRef.current.emit(emitter.event, parsedPayload, (ack: unknown) => {
      if (ack !== undefined) {
        addLog(`${emitter.event} (ack)`, ack, 'incoming');
        showToast(`Ack received for "${emitter.event}"`, 'success');
      }
    });

    addLog(emitter.event, parsedPayload, 'outgoing');
    showToast(`Event "${emitter.event}" sent`, 'success');
  }, [connectionStatus, showToast, addLog]);

  // Config persistence
  const createConfig = useCallback((name: string) => {
    const newConfig: SocketConfig = {
      id: Date.now().toString(),
      name,
      serverUrl,
      listeners,
      emitters,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setConfigs((prev) => [...prev, newConfig]);
    setCurrentConfigId(newConfig.id);
    showToast(`Saved "${name}"`, 'success');
    return newConfig;
  }, [serverUrl, listeners, emitters, showToast]);

  const updateConfig = useCallback((id: string, name: string) => {
    setConfigs((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, name, serverUrl, listeners, emitters, updatedAt: new Date().toISOString() }
          : c
      )
    );
    showToast(`Updated "${name}"`, 'success');
  }, [serverUrl, listeners, emitters, showToast]);

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

  const copyToClipboard = useCallback((id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }, []);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      <Header
        currentConfigName={getCurrentConfigName()}
        connectionStatus={connectionStatus}
        showSettings={showSettings}
        onToggleSettings={() => setShowSettings(!showSettings)}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          showSettings={showSettings}
          serverUrl={serverUrl}
          onChangeServerUrl={setServerUrl}
          connectionStatus={connectionStatus}
          errorMessage={errorMessage}
          listeners={listeners}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          onSaveConfigClick={() => openSaveModal(!currentConfigId)}
          onOpenConfigClick={() => setShowConfigModal(true)}
          savedConfigsCount={configs.length}
          onAddListener={addListener}
          onToggleListenerActive={toggleListenerActive}
          onUpdateListenerEvent={updateListenerEvent}
          onDeleteListener={deleteListener}
          onListenerBlur={handleListenerBlur}
        />

        <EmittersPanel
          emitters={emitters}
          connectionStatus={connectionStatus}
          onAddEmitter={addEmitter}
          onUpdateEmitterEvent={updateEmitterEvent}
          onUpdateEmitterPayload={updateEmitterPayload}
          onToggleEmitterExpanded={toggleEmitterExpanded}
          onDeleteEmitter={deleteEmitter}
          onDuplicateEmitter={duplicateEmitter}
          onEmit={handleEmit}
        />

        <LogsPanel
          logs={logs}
          copiedId={copiedId}
          onClearLogs={() => setLogs([])}
          onCopyLog={copyToClipboard}
          logsRef={logsRef}
        />
      </div>

      {showConfigModal && (
        <ConfigModal
          configs={configs}
          currentConfigId={currentConfigId}
          onSelectConfig={selectConfig}
          onDeleteConfig={deleteConfig}
          onClose={() => setShowConfigModal(false)}
        />
      )}

      {showSaveModal && (
        <SaveModal
          editingConfigId={editingConfigId}
          configName={configName}
          onChangeConfigName={setConfigName}
          onSave={handleSaveConfig}
          onClose={() => {
            setShowSaveModal(false);
            setConfigName('');
            setEditingConfigId(null);
          }}
          saveInputRef={saveInputRef}
        />
      )}

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default App;
