import { handleIncomingMessage } from './messageHandlers';
import type { WebSocketStore } from './useWebSocketStore';

const generateUserId = () =>
  `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const RAW_WS = (import.meta as any).env?.VITE_WS_BASE_URL || '';
const RAW_API = (import.meta as any).env?.VITE_API_BASE_URL || '';

function resolveWsBase(): string {
  if (RAW_WS) {
    if (RAW_WS.startsWith('/')) {
      return (window.location.origin.replace(/^https?:/, 'ws:')) + RAW_WS;
    }
    return RAW_WS.replace(/^https?:/, 'ws:').replace(/^http:/, 'ws:');
  }
  if (RAW_API) {
    if (RAW_API.startsWith('/')) {
      return (window.location.origin.replace(/^https?:/, 'ws:')) + RAW_API;
    }
    return RAW_API.replace(/^https?:/, 'ws:').replace(/^http:/, 'ws:');
  }
  if (typeof window !== 'undefined') {
    return window.location.origin.replace(/^https?:/, 'ws:');
  }
  return 'ws://localhost';
}

const WS_BASE_URL = resolveWsBase();

export const createWebSocketConnection = (
  roomId: string,
  userName: string,
  serverUrl: string,
  token: string | null | undefined,
  state: WebSocketStore,
  setState: (updates: Partial<WebSocketStore>) => void,
  getState: () => WebSocketStore,
  onReconnect: () => void
): WebSocket => {
  const userId = generateUserId();
  // Строим URL с токеном, если он есть
  let wsUrl = `${serverUrl}/ws/rooms/${roomId}?name=${encodeURIComponent(userName)}`;
  if (token) {
    wsUrl += `&token=${encodeURIComponent(token)}`;
  }

  setState({
    isConnecting: true,
    connectionError: null,
    roomId,
    userName,
    userId,
    token: token || null,
  });

  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    setState({
      ws,
      isConnected: true,
      isConnecting: false,
      connectionError: null,
      reconnectAttempts: 0,
      reconnectTimerId: null,
      lastReconnectAt: null,
    });
    const s = getState();
    const self = { id: userId, name: userName };
    const exists = s.users.some((u) => u.id === self.id || u.name === self.name);
    if (!exists) {
      setState({ users: [...s.users, self] });
    }
    try {
      ws.send(
        JSON.stringify({
          type: 'join',
          payload: self,
          userId: self.id,
          userName: self.name,
          timestamp: Date.now(),
        })
      );
    } catch {}
  };

  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      handleIncomingMessage(message, getState());
    } catch (error) {
      console.error('Ошибка парсинга сообщения:', error);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket ошибка:', error);
    setState({ connectionError: 'Ошибка соединения', isConnecting: false });
  };

  ws.onclose = () => {
    console.log('WebSocket отключен');
    setState({ ws: null, isConnected: false, isConnecting: false });
    onReconnect();
  };

  return ws;
};

export { WS_BASE_URL };

