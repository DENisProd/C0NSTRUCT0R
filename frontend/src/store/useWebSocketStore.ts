import { create } from 'zustand';
import type { Project } from '../types';

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
  | 'users_list';

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

interface WebSocketStore {
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
  users: RoomUser[];
  cursors: Map<string, CursorPosition>;
  userColors: Map<string, string>;

  // Color helpers
  getColorForUser: (userId: string) => string;

  // Actions
  connect: (roomId: string, userName: string, serverUrl?: string) => void;
  disconnect: () => void;
  sendMessage: (message: Omit<WebSocketMessage, 'userId' | 'userName' | 'timestamp'>) => void;
  
  // Event handlers (set from outside)
  onProjectUpdate?: (project: Project) => void;
  onUserJoin?: (user: RoomUser) => void;
  onUserLeave?: (userId: string) => void;
  onCursorUpdate?: (cursor: CursorPosition) => void;
}

const generateUserId = () => `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const DEFAULT_WS_BASE_URL =
  (import.meta as any).env?.VITE_WS_BASE_URL ||
  ((import.meta as any).env?.VITE_API_BASE_URL
    ? String((import.meta as any).env.VITE_API_BASE_URL).replace(/^http/i, 'ws')
    : 'ws://localhost:8001');

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
  users: [],
  cursors: new Map(),
  userColors: new Map(),

  getColorForUser: (userId: string) => {
    const palette = [
      '#e6194B', '#3cb44b', '#0082c8', '#f58231', '#911eb4',
      '#46f0f0', '#f032e6', '#008080', '#aa6e28', '#ffd8b1',
      '#fabebe', '#aaffc3', '#808000', '#ffd8b1', '#e6beff'
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

  connect: (roomId: string, userName: string, serverUrl = DEFAULT_WS_BASE_URL) => {
    const state = get();
    if (state.isConnecting || state.isConnected) {
      console.warn('WebSocket уже подключен или подключается');
      return;
    }

    const userId = generateUserId();
    const wsUrl = `${serverUrl}/ws/rooms/${roomId}?name=${encodeURIComponent(userName)}`;

    set({ isConnecting: true, connectionError: null, roomId, userName, userId });

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket подключен');
        set({
          ws,
          isConnected: true,
          isConnecting: false,
          connectionError: null,
          reconnectAttempts: 0,
        });
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleIncomingMessage(message, get());
        } catch (error) {
          console.error('Ошибка парсинга сообщения:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket ошибка:', error);
        set({ connectionError: 'Ошибка соединения', isConnecting: false });
      };

      ws.onclose = () => {
        console.log('WebSocket отключен');
        const state = get();
        set({ ws: null, isConnected: false, isConnecting: false });

        // Попытка переподключения
        if (state.reconnectAttempts < state.maxReconnectAttempts && state.roomId && state.userName) {
          const delay = state.reconnectDelay * Math.pow(2, state.reconnectAttempts);
          setTimeout(() => {
            set({ reconnectAttempts: state.reconnectAttempts + 1 });
            get().connect(state.roomId!, state.userName!, serverUrl);
          }, delay);
        } else if (state.reconnectAttempts >= state.maxReconnectAttempts) {
          set({ connectionError: 'Не удалось переподключиться. Пожалуйста, попробуйте подключиться вручную.' });
        }
      };
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
      users: [],
      cursors: new Map(),
      userColors: new Map(),
      connectionError: null,
      reconnectAttempts: 0,
    });
  },

  sendMessage: (message: Omit<WebSocketMessage, 'userId' | 'userName' | 'timestamp'>) => {
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

// Обработчик входящих сообщений
function handleIncomingMessage(message: WebSocketMessage, state: WebSocketStore) {
  switch (message.type) {
    case 'join': {
      const user = message.payload as RoomUser;
      if (user.id !== state.userId) {
        // Добавляем пользователя в список
        useWebSocketStore.setState((s) => ({
          users: [...s.users.filter((u) => u.id !== user.id), user],
        }));
        if (state.onUserJoin) {
          state.onUserJoin(user);
        }
      }
      break;
    }

    case 'leave': {
      const userId = message.payload?.userId || message.userId;
      if (userId) {
        useWebSocketStore.setState((s) => ({
          users: s.users.filter((u) => u.id !== userId),
          cursors: new Map([...s.cursors].filter(([id]) => id !== userId)),
        }));
        if (state.onUserLeave) {
          state.onUserLeave(userId);
        }
      }
      break;
    }

    case 'sync_state': {
      const project = message.payload as Project;
      if (project && state.onProjectUpdate) {
        // Обновляем только если это не наше собственное сообщение
        if (message.userId !== state.userId) {
          state.onProjectUpdate(project);
        }
      }
      break;
    }
    
    case 'users_list': {
      const users = message.payload as RoomUser[];
      if (Array.isArray(users)) {
        useWebSocketStore.setState({ users });
      }
      break;
    }

    case 'update_block':
    case 'add_block':
    case 'delete_block':
    case 'move_block':
    case 'update_theme':
    case 'update_header':
    case 'update_footer': {
      // Эти события должны привести к обновлению проекта
      // Для простоты запрашиваем полное состояние или обрабатываем через sync_state
      // В реальности сервер должен отправлять обновленное состояние
      break;
    }

    case 'cursor_update': {
      const cursor = message.payload as CursorPosition;
      if (cursor && cursor.userId !== state.userId) {
        useWebSocketStore.setState((s) => {
          const newCursors = new Map(s.cursors);
          newCursors.set(cursor.userId, cursor);
          return { cursors: newCursors };
        });
        if (state.onCursorUpdate) {
          state.onCursorUpdate(cursor);
        }
      }
      break;
    }

    default:
      console.warn('Неизвестный тип сообщения:', message.type);
  }
}

