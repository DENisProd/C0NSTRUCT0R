import { Box, VStack, HStack, Text, Button, SimpleGrid, Spinner } from '@chakra-ui/react';
import { Plus, Trash2 } from 'lucide-react';
import { useLibraryStore } from '../store/useLibraryStore';
import { useEffect, useState } from 'react';
import { getUserBlocks } from '../lib/api/library';
import type { LibraryBlock } from '../lib/api/library';

interface UserBlocksListProps {
  onAddClick?: () => void;
}

export const UserBlocksList = ({ onAddClick }: UserBlocksListProps) => {
  const [blocks, setBlocks] = useState<LibraryBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const loadBlocks = async () => {
      setIsLoading(true);
      try {
        const userBlocks = await getUserBlocks();
        setBlocks(userBlocks);
      } catch (error) {
        console.error('Ошибка загрузки пользовательских блоков:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadBlocks();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Вы уверены, что хотите удалить блок "${name}"?`)) {
      return;
    }

    setDeletingId(id);
    try {
      // TODO: Реализовать DELETE /api/user-blocks/:id или использовать существующий endpoint
      // await deleteUserBlock(id);
      // Временно просто обновляем список
      setBlocks((prev) => prev.filter((b) => b.id !== id));
      window.alert('Блок удален (функционал удаления будет реализован)');
    } catch (error) {
      console.error('Ошибка удаления блока:', error);
      window.alert('Не удалось удалить блок');
    } finally {
      setDeletingId(null);
    }
  };

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
        color="inherit"
      >
        <Spinner size="lg" />
      </Box>
    );
  }

  return (
    <VStack gap="16px" align="stretch">
      <HStack justifyContent="space-between">
        <Text fontSize="20px" fontWeight="bold" color="inherit">
          Мои блоки ({blocks.length})
        </Text>
        {onAddClick && (
          <Button
            size="sm"
            onClick={onAddClick}
            backgroundColor="var(--app-accent)"
            color="white"
            _hover={{ backgroundColor: 'var(--app-accent)', opacity: 0.9 }}
          >
            <HStack gap="6px">
              <Plus size={16} />
              <Box as="span">Добавить блок</Box>
            </HStack>
          </Button>
        )}
      </HStack>

      {blocks.length === 0 ? (
        <Box
          padding="48px"
          backgroundColor="var(--app-surface)"
          borderRadius="8px"
          border="1px solid var(--app-border)"
          textAlign="center"
          color="inherit"
        >
          <VStack gap="16px">
            <Text fontSize="16px" color="var(--app-text-muted)">
              У вас пока нет пользовательских блоков
            </Text>
            {onAddClick && (
              <Button
                onClick={onAddClick}
                backgroundColor="var(--app-accent)"
                color="white"
                _hover={{ backgroundColor: 'var(--app-accent)', opacity: 0.9 }}
              >
                <HStack gap="6px">
                  <Plus size={16} />
                  <Box as="span">Создать первый блок</Box>
                </HStack>
              </Button>
            )}
          </VStack>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="16px">
          {blocks.map((block) => (
            <Box
              key={block.id}
              padding="16px"
              backgroundColor="var(--app-surface)"
              borderRadius="8px"
              border="1px solid var(--app-border)"
              color="inherit"
            >
              <VStack gap="12px" align="stretch">
                {block.preview && (
                  <Box
                    width="100%"
                    height="120px"
                    backgroundColor="var(--app-bg-muted)"
                    borderRadius="4px"
                    overflow="hidden"
                  >
                    <img
                      src={block.preview}
                      alt={block.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Box>
                )}
                <Text fontSize="16px" fontWeight="bold">
                  {block.name}
                </Text>
                {block.description && (
                  <Text fontSize="14px" color="var(--app-text-muted)">
                    {block.description}
                  </Text>
                )}
                <HStack gap="8px" marginTop="8px">
                  <Button
                    size="sm"
                    variant="outline"
                    colorScheme="red"
                    color="inherit"
                    borderColor="var(--app-border)"
                    _hover={{ backgroundColor: 'var(--app-hover)', borderColor: 'var(--app-accent)' }}
                    onClick={() => handleDelete(block.id, block.name)}
                    disabled={deletingId === block.id}
                  >
                    {deletingId === block.id ? (
                      <Spinner size="sm" />
                    ) : (
                      <>
                        <Trash2 size={14} />
                        <Box as="span" marginLeft="4px">Удалить</Box>
                      </>
                    )}
                  </Button>
                </HStack>
              </VStack>
            </Box>
          ))}
        </SimpleGrid>
      )}
    </VStack>
  );
};

