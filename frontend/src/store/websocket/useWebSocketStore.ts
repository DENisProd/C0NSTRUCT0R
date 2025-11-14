import { create } from 'zustand';
import type { Project } from '../../types';
import { createWebSocketConnection, WS_BASE_URL } from './connection';

export type WebSocketEventType =
  | 'join'
  | 'leave'
  | 'update_block'
  | 'add_block'
  | 'delete_block'
  | 'move_block'
  | 'cursor_update'
  | 'sync_state'
  | 'update_theme'
  | 'update_header'
  | 'update_footer'
  | 'users_list'
  | 'save_project'
  | 'project_saved';

export interface WebSocketMessage {
  type: WebSocketEventType;
  payload: any;
  userId?: string;
  userName?: string;
  timestamp?: number;
}

export interface RoomUser {
  id: string;
  name: string;
}

export interface CursorPosition {
  userId: string;
  userName: string;
  x: number;
  y: number;
  blockId?: string;
}

export interface WebSocketStore {
  // Connection state
  ws: WebSocket | null;
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  reconnectDelay: number;

  // Room state
  roomId: string | null;
  userName: string | null;
  userId: string | null;
  token: string | null;
  users: RoomUser[];
  cursors: Map<string, CursorPosition>;
  userColors: Map<string, string>;

  // Color helpers
  getColorForUser: (userId: string) => string;

  // Actions
  connect: (
    roomId: string,
    userName: string,
    serverUrl?: string,
    token?: string | null
  ) => void;
  disconnect: () => void;
  sendMessage: (
    message: Omit<WebSocketMessage, 'userId' | 'userName' | 'timestamp'>
  ) => void;

  // Event handlers (set from outside)
  onProjectUpdate?: (project: Project) => void;
  onUserJoin?: (user: RoomUser) => void;
  onUserLeave?: (userId: string) => void;
  onCursorUpdate?: (cursor: CursorPosition) => void;
  onProjectSaved?: (projectId: number) => void;
}

export const useWebSocketStore = create<WebSocketStore>((set, get) => ({
  ws: null,
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,
  reconnectDelay: 1000,

  roomId: null,
  userName: null,
  userId: null,
  token: null,
  users: [],
  cursors: new Map(),
  userColors: new Map(),

  getColorForUser: (userId: string) => {
    const palette = [
      '#e6194B',
      '#3cb44b',
      '#0082c8',
      '#f58231',
      '#911eb4',
      '#46f0f0',
      '#f032e6',
      '#008080',
      '#aa6e28',
      '#ffd8b1',
      '#fabebe',
      '#aaffc3',
      '#808000',
      '#ffd8b1',
      '#e6beff',
    ];
    const state = get();
    const existing = state.userColors.get(userId);
    if (existing) return existing;
    // Assign deterministically based on hash
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
    }
    const color = palette[hash % palette.length];
    const next = new Map(state.userColors);
    next.set(userId, color);
    set({ userColors: next });
    return color;
  },

  connect: (roomId: string, userName: string, serverUrl = WS_BASE_URL, token?: string | null) => {
    const state = get();
    if (state.isConnecting || state.isConnected) {
      console.warn('WebSocket уже подключен или подключается');
      return;
    }

    try {
      const ws = createWebSocketConnection(
        roomId,
        userName,
        serverUrl,
        token,
        state,
        (updates) => set(updates),
        () => get(),
        () => {
          // Reconnect handler
          const currentState = get();
          if (
            currentState.reconnectAttempts < currentState.maxReconnectAttempts &&
            currentState.roomId &&
            currentState.userName
          ) {
            const delay =
              currentState.reconnectDelay *
              Math.pow(2, currentState.reconnectAttempts);
            setTimeout(() => {
              set({ reconnectAttempts: currentState.reconnectAttempts + 1 });
              get().connect(currentState.roomId!, currentState.userName!, serverUrl, currentState.token);
            }, delay);
          } else if (currentState.reconnectAttempts >= currentState.maxReconnectAttempts) {
            set({
              connectionError:
                'Не удалось переподключиться. Пожалуйста, попробуйте подключиться вручную.',
            });
          }
        }
      );
      set({ ws });
    } catch (error) {
      console.error('Ошибка создания WebSocket:', error);
      set({
        isConnecting: false,
        connectionError: 'Не удалось создать соединение',
      });
    }
  },

  disconnect: () => {
    const state = get();
    if (state.ws) {
      state.ws.close();
    }
    set({
      ws: null,
      isConnected: false,
      isConnecting: false,
      roomId: null,
      userName: null,
      userId: null,
      token: null,
      users: [],
      cursors: new Map(),
      userColors: new Map(),
      connectionError: null,
      reconnectAttempts: 0,
    });
  },

  sendMessage: (
    message: Omit<WebSocketMessage, 'userId' | 'userName' | 'timestamp'>
  ) => {
    const state = get();
    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket не подключен, сообщение не отправлено');
      return;
    }

    const fullMessage: WebSocketMessage = {
      ...message,
      userId: state.userId || undefined,
      userName: state.userName || undefined,
      timestamp: Date.now(),
    };

    try {
      state.ws.send(JSON.stringify(fullMessage));
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
    }
  },
}));

