import { useEffect } from 'react';
import { Box, Spinner, Text } from '@chakra-ui/react';
import { useWebSocketStore } from '../store/useWebSocketStore';
import { useAuthStore } from '../store/useAuthStore';
import { useUserStore } from '../store/useUserStore';
import { useLocation, useParams } from 'react-router-dom';
import { useProjectStore } from '../store/useProjectStore';

export const RoomConnection = () => {
  const {
    isConnected,
    isConnecting,
    connectionError,
    reconnectAttempts,
    reconnectTimerId,
    connect,
    disconnect,
    roomId,
    userName,
  } = useWebSocketStore();
  const { token, email, username: authUsername } = useAuthStore();
  const { profile, fetchProfile } = useUserStore();
  const location = useLocation();
  const { currentProjectId } = useProjectStore();

  const params = useParams<{ id?: string }>();
  const initialRoomId = (location.pathname.startsWith('/editor') && params.id)
    ? String(params.id)
    : (currentProjectId ? String(currentProjectId) : '');
  const derivedName = (profile?.username || authUsername || (email ? email.split('@')[0] : '') || '').trim();
  const safeName = derivedName || 'Guest';

  useEffect(() => {
    const targetRoom = initialRoomId.trim() || (currentProjectId ? String(currentProjectId) : (localStorage.getItem('ws-local-room-id') || 'local'));
    if (!targetRoom || !safeName) return;
    if (isConnected) {
      if (roomId !== targetRoom || (userName && userName !== safeName.trim())) {
        disconnect();
        connect(targetRoom, safeName.trim(), undefined, token);
      }
    } else if (!isConnecting) {
      connect(targetRoom, safeName.trim(), undefined, token);
    }
  }, [isConnected, isConnecting, roomId, userName, initialRoomId, safeName, token, connect, disconnect, currentProjectId]);

  useEffect(() => {
    if (token && !profile) {
      fetchProfile().catch(() => {});
    }
  }, [token]);

  if (isConnecting) {
    return (
      <Box
        position="fixed"
        top="0"
        left="0"
        width="100vw"
        height="100vh"
        backgroundColor="rgba(0, 0, 0, 0.5)"
        display="flex"
        alignItems="center"
        justifyContent="center"
        zIndex={2000}
      >
        <Box
          backgroundColor="var(--app-surface)"
          padding="24px"
          borderRadius="8px"
          boxShadow="lg"
          display="flex"
          alignItems="center"
          gap="12px"
        >
          <Spinner size="lg" />
          <Text>Подключение к комнате...</Text>
        </Box>
      </Box>
    );
  }

  if (!isConnected && !isConnecting && (connectionError || (reconnectAttempts > 0 && reconnectTimerId))) {
    return (
      <Box
        position="fixed"
        top="0"
        left="0"
        width="100vw"
        height="100vh"
        backgroundColor="rgba(0, 0, 0, 0.5)"
        display="flex"
        alignItems="center"
        justifyContent="center"
        zIndex={2000}
      >
        <Box
          backgroundColor="var(--app-surface)"
          padding="24px"
          borderRadius="8px"
          boxShadow="lg"
          display="flex"
          alignItems="center"
          gap="12px"
        >
          <Spinner size="lg" />
          <Text>
            Не удалось подключиться, попытка переподключения...
          </Text>
        </Box>
      </Box>
    );
  }

  return null;
};

