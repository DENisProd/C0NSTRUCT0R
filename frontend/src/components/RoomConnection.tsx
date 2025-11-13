import { useState, useEffect } from 'react';
import { Box, Button, Input, VStack, HStack, Text, Alert, Badge } from '@chakra-ui/react';
import { useWebSocketStore } from '../store/useWebSocketStore';
import { useAuthStore } from '../store/useAuthStore';
import { useUserStore } from '../store/useUserStore';
import { useLocation, useParams } from 'react-router-dom';

export const RoomConnection = () => {
  const {
    isConnected,
    isConnecting,
    connectionError,
    roomId,
    userName,
    users,
    connect,
    disconnect,
  } = useWebSocketStore();
  const { token, email, username: authUsername } = useAuthStore();
  const { profile, fetchProfile } = useUserStore();
  const location = useLocation();

  const params = useParams<{ id?: string }>();
  const initialRoomId = (location.pathname.startsWith('/editor') && params.id) ? String(params.id) : '';
  const derivedName = (profile?.username || authUsername || (email ? email.split('@')[0] : '') || '').trim();
  const [localRoomId, setLocalRoomId] = useState(initialRoomId);
  const [localUserName, setLocalUserName] = useState(derivedName);
  const [showConnectionForm, setShowConnectionForm] = useState(!(initialRoomId && derivedName));

  useEffect(() => {
    if (isConnected) {
      setShowConnectionForm(false);
    }
  }, [isConnected]);

  useEffect(() => {
    if (!isConnected && !isConnecting && initialRoomId && derivedName) {
      connect(initialRoomId.trim(), derivedName.trim(), undefined, token);
    }
  }, [isConnected, isConnecting, initialRoomId, derivedName, token]);

  useEffect(() => {
    if (connectionError) {
      setShowConnectionForm(true);
    }
  }, [connectionError]);

  useEffect(() => {
    if (token && !profile) {
      fetchProfile().catch(() => {});
    }
  }, [token]);

  useEffect(() => {
    const name = (profile?.username || authUsername || (email ? email.split('@')[0] : '') || '').trim();
    if (name && name !== localUserName) {
      setLocalUserName(name);
    }
  }, [profile?.username, authUsername, email]);

  const handleConnect = () => {
    if (!localRoomId.trim() || !localUserName.trim()) {
      alert('Пожалуйста, введите ID комнаты и имя');
      return;
    }
    connect(localRoomId.trim(), localUserName.trim(), undefined, token);
  };

  const handleDisconnect = () => {
    disconnect();
    setShowConnectionForm(true);
    setLocalRoomId('');
    setLocalUserName('');
  };

  if (showConnectionForm) {
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
          width="90%"
          maxWidth="500px"
          borderRadius="8px"
          boxShadow="lg"
          padding="24px"
        >
          <VStack gap="16px" align="stretch">
            <Text fontSize="20px" fontWeight="bold">
              Подключение к комнате редактирования
            </Text>

            {connectionError && (
              <Alert.Root status="error">
                <Box as="span" marginRight="8px">⚠️</Box>
                <Alert.Description>{connectionError}</Alert.Description>
              </Alert.Root>
            )}

            <VStack gap="12px" align="stretch">
              <Box>
              </Box>

              <Box>
                <Text fontSize="14px" marginBottom="4px">
                  ID комнаты *
                </Text>
                <Input
                  value={localRoomId}
                  onChange={(e) => setLocalRoomId(e.target.value)}
                  placeholder="room-123"
                  disabled={isConnecting}
                />
              </Box>

              <Box>
                <Text fontSize="14px" marginBottom="4px">
                  Ваше имя *
                </Text>
                <Input
                  value={localUserName}
                  onChange={(e) => setLocalUserName(e.target.value)}
                  placeholder="Иван"
                  disabled={isConnecting}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleConnect();
                    }
                  }}
                />
              </Box>
            </VStack>

            <HStack justify="flex-end" gap="8px">
              <Button
                onClick={handleConnect}
                loading={isConnecting}
                backgroundColor="var(--app-accent)"
                color="white"
                _hover={{ backgroundColor: 'var(--app-accent)', opacity: 0.9 }}
              >
                {isConnecting ? 'Подключение...' : 'Подключиться'}
              </Button>
            </HStack>
          </VStack>
        </Box>
      </Box>
    );
  }

  return null;
};

