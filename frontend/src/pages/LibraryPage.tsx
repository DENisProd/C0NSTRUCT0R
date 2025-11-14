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
import { Book, Plus, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLibraryStore } from '../store/useLibraryStore';
import { getUserBlocks, getCommunityBlocks, type LibraryBlock } from '../lib/api/library';
import { useTemplatesStore } from '../store/useTemplatesStore';
import { useProjectStore } from '../store/useProjectStore';
import { BlockCard } from '../components/BlockCard';
import { BlockPreviewModal } from '../components/BlockPreviewModal';

export const LibraryPage = () => {
  const navigate = useNavigate();
  const { systemBlocks, communityBlocks, userBlocks, isLoading, error, setSystemBlocks, setCommunityBlocks, setUserBlocks, setLoading, setError } = useLibraryStore();
  const { getTemplatesByCategory } = useTemplatesStore();
  const { currentProjectId } = useProjectStore();
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
    <Box minHeight="100vh" backgroundColor="var(--app-bg-muted)" padding="40px 20px">
      <Box maxWidth="1400px" margin="0 auto">
        <VStack gap="24px" align="stretch">
          <HStack justify="space-between" align="center">
            <Button variant="outline" onClick={() => navigate(currentProjectId ? `/editor/${currentProjectId}` : '/editor')} borderColor="var(--app-accent)" color="var(--app-accent)" _hover={{ backgroundColor: 'var(--app-hover)' }}>
              Вернуться в редактор
            </Button>
            <Heading size="xl" color="inherit">
              <HStack gap="10px" align="center">
                <Book size={24} />
                <Text as="span" color="inherit">Библиотека блоков</Text>
              </HStack>
            </Heading>
            <Button
              onClick={() => navigate('/library/add')}
              backgroundColor="var(--app-accent)"
              color="white"
              _hover={{ backgroundColor: 'var(--app-accent)', opacity: 0.9 }}
            >
              <HStack gap="8px" align="center">
                <Plus size={16} />
                <Text as="span">Добавить блок</Text>
              </HStack>
            </Button>
          </HStack>

          <Input
            placeholder="Поиск по названию, описанию или категории..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            backgroundColor="var(--app-surface)"
            border="1px solid var(--app-border)"
            color="inherit"
            _placeholder={{ color: 'var(--app-text-muted)' }}
            size="lg"
          />

          {error && (
            <Alert.Root status="error" backgroundColor="var(--app-surface)" border="1px solid var(--app-border)" color="inherit">
              <Box as="span" marginRight="8px"><AlertTriangle size={16} /></Box>
              <Alert.Description>{error}</Alert.Description>
            </Alert.Root>
          )}

          {isLoading ? (
            <Box textAlign="center" padding="40px">
              <Spinner size="xl" color="var(--app-accent)" />
            </Box>
          ) : (
            <Tabs.Root defaultValue="system">
              <Tabs.List backgroundColor="var(--app-surface)" border="1px solid var(--app-border)" borderRadius="8px" padding="6px" gap="8px">
                <Tabs.Trigger
                  value="system"
                  color="inherit"
                  border="1px solid var(--app-border)"
                  borderRadius="6px"
                  padding="8px 12px"
                  _hover={{ backgroundColor: 'var(--app-hover)' }}
                >
                  Системные блоки ({systemBlocks.length})
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="community"
                  color="inherit"
                  border="1px solid var(--app-border)"
                  borderRadius="6px"
                  padding="8px 12px"
                  _hover={{ backgroundColor: 'var(--app-hover)' }}
                >
                  Сообщество ({communityBlocks.length})
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="user"
                  color="inherit"
                  border="1px solid var(--app-border)"
                  borderRadius="6px"
                  padding="8px 12px"
                  _hover={{ backgroundColor: 'var(--app-hover)' }}
                >
                  Мои блоки ({userBlocks.length})
                </Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="system" padding="24px 0">
                {filteredSystemBlocks.length === 0 ? (
                  <Text textAlign="center" color="var(--app-text-muted)" padding="40px">
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
                  <Text textAlign="center" color="var(--app-text-muted)" padding="40px">
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
                    <Text textAlign="center" color="var(--app-text-muted)">
                      У вас пока нет пользовательских блоков
                    </Text>
                    <Button
                      onClick={() => navigate('/library/add')}
                      backgroundColor="var(--app-accent)"
                      color="white"
                      _hover={{ backgroundColor: 'var(--app-accent)', opacity: 0.9 }}
                    >
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

