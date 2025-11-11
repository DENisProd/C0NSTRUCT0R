import { useEffect, useState } from 'react';
import {
  Box,
  VStack,
  Heading,
  SimpleGrid,
  Input,
  Button,
  Tabs,
  Spinner,
  Alert,
  Text,
  HStack,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useLibraryStore } from '../store/useLibraryStore';
import { getUserBlocks, getCommunityBlocks, type LibraryBlock } from '../lib/api/library';
import { useTemplatesStore } from '../store/useTemplatesStore';
import { BlockCard } from '../components/BlockCard';
import { BlockPreviewModal } from '../components/BlockPreviewModal';

export const LibraryPage = () => {
  const navigate = useNavigate();
  const { systemBlocks, communityBlocks, userBlocks, isLoading, error, setSystemBlocks, setCommunityBlocks, setUserBlocks, setLoading, setError } = useLibraryStore();
  const { getTemplatesByCategory } = useTemplatesStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);

  useEffect(() => {
    loadBlocks();
  }, []);

  const loadBlocks = async () => {
    setLoading(true);
    try {
      // Берём красивые готовые шаблоны из фронтенда как системные блоки
      const templates = getTemplatesByCategory();
      const mappedTemplates: LibraryBlock[] = templates.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category || 'other',
        tags: [],
        author: undefined,
        preview: t.preview,
        blocks: t.blocks,
        isCustom: t.isCustom ?? false,
        createdAt: t.createdAt,
      }));

      const [community, user] = await Promise.all([
        getCommunityBlocks(),
        getUserBlocks(),
      ]);
      setSystemBlocks(mappedTemplates);
      setCommunityBlocks(community);
      setUserBlocks(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки блоков');
    } finally {
      setLoading(false);
    }
  };

  const filteredSystemBlocks = systemBlocks.filter((block) =>
    block.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    block.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    block.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUserBlocks = userBlocks.filter((block) =>
    block.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    block.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    block.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCommunityBlocks = communityBlocks.filter((block) =>
    block.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    block.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    block.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box minHeight="100vh" backgroundColor="#f5f5f5" padding="40px 20px">
      <Box maxWidth="1400px" margin="0 auto">
        <VStack gap="24px" align="stretch">
          <HStack justify="space-between" align="center">
            <Heading size="xl">📚 Библиотека блоков</Heading>
            <Button colorScheme="blue" onClick={() => navigate('/library/add')}>
              ➕ Добавить блок
            </Button>
          </HStack>

          <Input
            placeholder="Поиск по названию, описанию или категории..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            backgroundColor="white"
            size="lg"
          />

          {error && (
            <Alert.Root status="error">
              <Box as="span" marginRight="8px">⚠️</Box>
              <Alert.Description>{error}</Alert.Description>
            </Alert.Root>
          )}

          {isLoading ? (
            <Box textAlign="center" padding="40px">
              <Spinner size="xl" />
            </Box>
          ) : (
            <Tabs.Root defaultValue="system">
              <Tabs.List>
                <Tabs.Trigger value="system">Системные блоки ({systemBlocks.length})</Tabs.Trigger>
                <Tabs.Trigger value="community">Сообщество ({communityBlocks.length})</Tabs.Trigger>
                <Tabs.Trigger value="user">Мои блоки ({userBlocks.length})</Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="system" padding="24px 0">
                {filteredSystemBlocks.length === 0 ? (
                  <Text textAlign="center" color="gray.500" padding="40px">
                    Блоки не найдены
                  </Text>
                ) : (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} gap="16px">
                    {filteredSystemBlocks.map((block) => (
                      <BlockCard
                        key={block.id}
                        block={block}
                        onSelect={() => setSelectedBlock(block.id)}
                      />
                    ))}
                  </SimpleGrid>
                )}
              </Tabs.Content>

              <Tabs.Content value="community" padding="24px 0">
                {filteredCommunityBlocks.length === 0 ? (
                  <Text textAlign="center" color="gray.500" padding="40px">
                    Блоки не найдены
                  </Text>
                ) : (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} gap="16px">
                    {filteredCommunityBlocks.map((block) => (
                      <BlockCard
                        key={block.id}
                        block={block}
                        onSelect={() => setSelectedBlock(block.id)}
                      />
                    ))}
                  </SimpleGrid>
                )}
              </Tabs.Content>

              <Tabs.Content value="user" padding="24px 0">
                {filteredUserBlocks.length === 0 ? (
                  <VStack gap="16px" padding="40px">
                    <Text textAlign="center" color="gray.500">
                      У вас пока нет пользовательских блоков
                    </Text>
                    <Button colorScheme="blue" onClick={() => navigate('/library/add')}>
                      Создать первый блок
                    </Button>
                  </VStack>
                ) : (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} gap="16px">
                    {filteredUserBlocks.map((block) => (
                      <BlockCard
                        key={block.id}
                        block={block}
                        onSelect={() => setSelectedBlock(block.id)}
                      />
                    ))}
                  </SimpleGrid>
                )}
              </Tabs.Content>
            </Tabs.Root>
          )}

          <Button variant="outline" onClick={() => navigate('/editor')}>
            Вернуться в редактор
          </Button>
        </VStack>
      </Box>

      {selectedBlock && (
        <BlockPreviewModal
          blockId={selectedBlock}
          isOpen={!!selectedBlock}
          onClose={() => setSelectedBlock(null)}
        />
      )}
    </Box>
  );
};

