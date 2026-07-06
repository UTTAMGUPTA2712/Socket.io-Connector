import { SocketConfig } from '../types/socket';

// Migration helper for old single-event config models
export const migrateConfig = (config: any): SocketConfig => {
  return {
    id: config.id || Date.now().toString() + Math.random(),
    name: config.name || 'Unnamed Config',
    serverUrl: config.serverUrl || 'http://localhost:8080',
    listeners: Array.isArray(config.listeners)
      ? config.listeners
      : [
        {
          id: 'default-listener',
          event: config.listenEvent || 'user_update',
          isActive: true,
        },
      ],
    emitters: Array.isArray(config.emitters)
      ? config.emitters.map((e: any) => ({ ...e, isExpanded: e.isExpanded ?? false }))
      : [
        {
          id: 'default-emitter',
          event: config.emitEvent || 'get_users',
          payload: config.payload || '{\n  "action": "list",\n  "limit": 10\n}',
          isExpanded: false,
        },
      ],
    createdAt: config.createdAt || new Date().toISOString(),
    updatedAt: config.updatedAt || new Date().toISOString(),
  };
};
