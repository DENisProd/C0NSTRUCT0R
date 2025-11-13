import { useState, useEffect } from 'react';
import { Box, Button, Input, VStack, HStack, Text, Alert, Badge } from '@chakra-ui/react';
import { useWebSocketStore } from '../store/useWebSocketStore';
import { useAuthStore } from '../store/useAuthStore';

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
  const { token } = useAuthStore();

  const [localRoomId, setLocalRoomId] = useState('');
  const [localUserName, setLocalUserName] = useState('');
  const [showConnectionForm, setShowConnectionForm] = useState(!isConnected);

  useEffect(() => {
    if (isConnected) {
      setShowConnectionForm(false);
    }
  }, [isConnected]);

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
          backgroundColor="white"
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
              <Button onClick={handleConnect} colorScheme="blue" loading={isConnecting}>
                {isConnecting ? 'Подключение...' : 'Подключиться'}
              </Button>
            </HStack>
          </VStack>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      position="fixed"
      top="70px"
      right="20px"
      backgroundColor="white"
      borderRadius="8px"
      boxShadow="lg"
      padding="12px 16px"
      zIndex={1000}
      minWidth="220px"
      maxWidth="280px"
      border="1px solid #e0e0e0"
    >
      <VStack gap="8px" align="stretch">
        <HStack justify="space-between">
          <Text fontSize="14px" fontWeight="bold">
            Комната: {roomId}
          </Text>
          <Badge colorScheme={isConnected ? 'green' : 'red'}>
            {isConnected ? 'Подключено' : 'Отключено'}
          </Badge>
        </HStack>

        <Text fontSize="12px" color="#666">
          Вы: {userName}
        </Text>

        <Box>
          <Text fontSize="12px" fontWeight="bold" marginBottom="4px">
            Участники ({users.length}):
          </Text>
          <VStack gap="4px" align="stretch" maxHeight="150px" overflowY="auto">
            {users.map((user) => (
              <HStack key={user.id} gap="8px">
                <Box
                  width="8px"
                  height="8px"
                  borderRadius="50%"
                  backgroundColor={user.id === useWebSocketStore.getState().userId ? '#007bff' : '#28a745'}
                />
                <Text fontSize="12px">{user.name}</Text>
                {user.id === useWebSocketStore.getState().userId && (
                  <Text fontSize="10px" color="#666">
                    (Вы)
                  </Text>
                )}
              </HStack>
            ))}
          </VStack>
        </Box>

        <Button size="sm" colorScheme="red" onClick={handleDisconnect}>
          Отключиться
        </Button>
      </VStack>
    </Box>
  );
};

