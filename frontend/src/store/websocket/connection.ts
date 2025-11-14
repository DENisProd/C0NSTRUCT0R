import { handleIncomingMessage } from './messageHandlers';
import type { WebSocketStore } from './useWebSocketStore';

const generateUserId = () =>
  `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const WS_BASE_URL = (
  import.meta.env.VITE_WS_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'ws://localhost:8000'
)
  .replace(/^https?:/, 'ws:')
  .replace(/^http:/, 'ws:');

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

