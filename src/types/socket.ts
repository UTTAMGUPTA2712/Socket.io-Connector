export interface ListenerConfig {
  id: string;
  event: string;
  isActive: boolean;
}

export interface EmitterConfig {
  id: string;
  event: string;
  payload: string;
  isExpanded?: boolean;
}

export interface SocketConfig {
  id: string;
  name: string;
  serverUrl: string;
  listeners: ListenerConfig[];
  emitters: EmitterConfig[];
  createdAt: string;
  updatedAt: string;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  event: string;
  data: unknown;
  direction: 'incoming' | 'outgoing';
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}
