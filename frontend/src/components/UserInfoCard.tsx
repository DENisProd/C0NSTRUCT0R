import { Box, VStack, HStack, Text, Avatar, Badge, Button, Spinner, Input } from '@chakra-ui/react';
import { User, Edit, Upload, Trash2 } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import { useRef, useState, useMemo } from 'react';
import { getUserAvatarUrl } from '../lib/api/user';

interface UserInfoCardProps {
  onEditClick?: () => void;
}

export const UserInfoCard = ({ onEditClick }: UserInfoCardProps) => {
  const { profile, isLoading, uploadAvatar, deleteAvatar } = useUserStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const avatarUrl = useMemo(() => {
    if (profile?.hasAvatar && profile?.id) {
      const baseUrl = getUserAvatarUrl(profile.id);
      const timestamp = profile.updatedAt ? new Date(profile.updatedAt).getTime() : Date.now();
      return `${baseUrl}?t=${timestamp}`;
    }
    return profile?.avatarUrl;
  }, [profile?.hasAvatar, profile?.id, profile?.avatarUrl, profile?.updatedAt]);

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите файл изображения');
      return;
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('Файл слишком большой. Максимум 5 МБ');
      return;
    }

    setIsUploading(true);
    try {
      await uploadAvatar(file);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Ошибка загрузки аватара');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAvatar = async () => {
    if (!confirm('Вы уверены, что хотите удалить аватар?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAvatar();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Ошибка удаления аватара');
    } finally {
      setIsDeleting(false);
    }
  };


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
            <Box position="relative">
              <Avatar.Root size="lg">
                <Avatar.Fallback>
                  <User size={32} />
                </Avatar.Fallback>
                {avatarUrl && <Avatar.Image src={avatarUrl} />}
              </Avatar.Root>
              <Box
                position="absolute"
                bottom="0"
                right="0"
                backgroundColor="var(--app-surface)"
                borderRadius="50%"
                padding="4px"
                border="2px solid var(--app-border)"
                cursor="pointer"
                _hover={{ backgroundColor: 'var(--app-hover)' }}
                onClick={() => fileInputRef.current?.click()}
                title="Загрузить аватар"
              >
                <Upload size={14} />
              </Box>
            </Box>
            <VStack align="flex-start" gap="4px">
              <Text fontSize="24px" fontWeight="bold">
                {profile.username}
              </Text>
              <Text fontSize="14px" color="var(--app-text-muted)">
                {profile.email}
              </Text>
              <HStack gap="8px" marginTop="4px">
                {profile.hasAvatar && (
                  <Button
                    size="xs"
                    variant="outline"
                    colorScheme="red"
                    onClick={handleDeleteAvatar}
                    loading={isDeleting}
                    disabled={isUploading || isDeleting}
                  >
                    <HStack gap="4px">
                      <Trash2 size={12} />
                      <Box as="span">Удалить</Box>
                    </HStack>
                  </Button>
                )}
              </HStack>
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
        
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

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

