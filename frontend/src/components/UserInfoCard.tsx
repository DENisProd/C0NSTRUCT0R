import { Box, VStack, HStack, Text, Avatar, Badge, Button, Spinner } from '@chakra-ui/react';
import { User, Edit } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';

interface UserInfoCardProps {
  onEditClick?: () => void;
}

export const UserInfoCard = ({ onEditClick }: UserInfoCardProps) => {
  const { profile, isLoading } = useUserStore();

  if (isLoading) {
    return (
      <Box
        padding="24px"
        backgroundColor="#ffffff"
        borderRadius="8px"
        border="1px solid #e0e0e0"
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <Spinner size="lg" />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box
        padding="24px"
        backgroundColor="#ffffff"
        borderRadius="8px"
        border="1px solid #e0e0e0"
      >
        <Text color="gray.500">Профиль не загружен</Text>
      </Box>
    );
  }

  return (
    <Box
      padding="24px"
      backgroundColor="#ffffff"
      borderRadius="8px"
      border="1px solid #e0e0e0"
    >
      <VStack gap="16px" align="stretch">
        <HStack justifyContent="space-between" align="flex-start">
          <HStack gap="16px">
            <Avatar.Root size="lg">
              <Avatar.Fallback>
                <User size={32} />
              </Avatar.Fallback>
              {profile.avatarUrl && <Avatar.Image src={profile.avatarUrl} />}
            </Avatar.Root>
            <VStack align="flex-start" gap="4px">
              <Text fontSize="24px" fontWeight="bold">
                {profile.username}
              </Text>
              <Text fontSize="14px" color="gray.600">
                {profile.email}
              </Text>
            </VStack>
          </HStack>
          {onEditClick && (
            <Button size="sm" variant="outline" onClick={onEditClick}>
              <HStack gap="6px">
                <Edit size={16} />
                <Box as="span">Редактировать</Box>
              </HStack>
            </Button>
          )}
        </HStack>

        <HStack gap="24px" paddingTop="16px" borderTop="1px solid #e0e0e0">
          <VStack align="flex-start" gap="4px">
            <Text fontSize="12px" color="gray.600">
              Проектов
            </Text>
            <Text fontSize="20px" fontWeight="bold">
              {profile.projectsCount ?? 0}
            </Text>
          </VStack>
          <VStack align="flex-start" gap="4px">
            <Text fontSize="12px" color="gray.600">
              Блоков
            </Text>
            <Text fontSize="20px" fontWeight="bold">
              {profile.blocksCount ?? 0}
            </Text>
          </VStack>
          <VStack align="flex-start" gap="4px">
            <Text fontSize="12px" color="gray.600">
              Участник с
            </Text>
            <Text fontSize="14px" fontWeight="medium">
              {new Date(profile.createdAt).toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
              })}
            </Text>
          </VStack>
        </HStack>
      </VStack>
    </Box>
  );
};

