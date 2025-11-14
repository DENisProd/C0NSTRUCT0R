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
        backgroundColor="var(--app-surface)"
        borderRadius="8px"
        border="1px solid var(--app-border)"
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
        backgroundColor="var(--app-surface)"
        borderRadius="8px"
        border="1px solid var(--app-border)"
      >
        <Text color="var(--app-text-muted)">Профиль не загружен</Text>
      </Box>
    );
  }

  return (
    <Box
      padding="24px"
      backgroundColor="var(--app-surface)"
      borderRadius="8px"
      border="1px solid var(--app-border)"
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
              <Text fontSize="14px" color="var(--app-text-muted)">
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

        <HStack gap="24px" paddingTop="16px" borderTop="1px solid var(--app-border)">
          <VStack align="flex-start" gap="4px">
            <Text fontSize="12px" color="var(--app-text-muted)">
              Проектов
            </Text>
            <Text fontSize="20px" fontWeight="bold">
              {profile.projectsCount ?? 0}
            </Text>
          </VStack>
          <VStack align="flex-start" gap="4px">
            <Text fontSize="12px" color="var(--app-text-muted)">
              Блоков
            </Text>
            <Text fontSize="20px" fontWeight="bold">
              {profile.blocksCount ?? 0}
            </Text>
          </VStack>
          <VStack align="flex-start" gap="4px">
            <Text fontSize="12px" color="var(--app-text-muted)">
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

