import { useEffect } from 'react';
import { Box, Spinner, Text } from '@chakra-ui/react';
import { useWebSocketStore } from '../store/useWebSocketStore';
import { useAuthStore } from '../store/useAuthStore';
import { useUserStore } from '../store/useUserStore';
import { useLocation, useParams } from 'react-router-dom';

export const RoomConnection = () => {
  const {
    isConnected,
    isConnecting,
    connectionError,
    connect,
    disconnect,
    roomId,
  } = useWebSocketStore();
  const { token, email, username: authUsername } = useAuthStore();
  const { profile, fetchProfile } = useUserStore();
  const location = useLocation();

  const params = useParams<{ id?: string }>();
  const initialRoomId = (location.pathname.startsWith('/editor') && params.id) ? String(params.id) : '';
  const derivedName = (profile?.username || authUsername || (email ? email.split('@')[0] : '') || '').trim();

  useEffect(() => {
    const targetRoom = initialRoomId.trim();
    if (!targetRoom || !derivedName) return;
    if (isConnected) {
      if (roomId !== targetRoom) {
        disconnect();
        connect(targetRoom, derivedName.trim(), undefined, token);
      }
    } else if (!isConnecting) {
      connect(targetRoom, derivedName.trim(), undefined, token);
    }
  }, [isConnected, isConnecting, roomId, initialRoomId, derivedName, token, connect, disconnect]);

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

  return null;
};

