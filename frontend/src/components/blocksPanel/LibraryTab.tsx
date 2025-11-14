import { VStack, Text, Button, Input, HStack, SimpleGrid, Box } from '@chakra-ui/react';
import { BlockCard } from '../BlockCard';
import type { LibraryBlock } from '../../lib/api/library';

type LibraryTabKey = 'system' | 'community' | 'user';

interface LibraryTabProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  activeLibraryTab: LibraryTabKey;
  setActiveLibraryTab: (tab: LibraryTabKey) => void;
  systemBlocks: LibraryBlock[];
  communityBlocks: LibraryBlock[];
  userBlocks: LibraryBlock[];
  onSelectBlock: (block: LibraryBlock) => void;
  onNavigateAll: () => void;
}

export const LibraryTab = ({
  searchQuery,
  setSearchQuery,
  activeLibraryTab,
  setActiveLibraryTab,
  systemBlocks,
  communityBlocks,
  userBlocks,
  onSelectBlock,
  onNavigateAll,
}: LibraryTabProps) => {
  const filter = (list: LibraryBlock[]) =>
    list.filter((block) =>
      block.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      block.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      block.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const source =
    activeLibraryTab === 'system'
      ? filter(systemBlocks)
      : activeLibraryTab === 'community'
      ? filter(communityBlocks)
      : filter([...userBlocks, ...systemBlocks.filter((b) => b.isCustom)]);

  return (
    <VStack gap="12px" align="stretch">
      <Text fontSize="18px" fontWeight="bold">Библиотека блоков</Text>
      <Button onClick={onNavigateAll} colorScheme="orange" size="sm">
        <HStack gap="6px">
          <span>📚</span>
          <Box as="span">Все</Box>
        </HStack>
      </Button>
      <Input
        placeholder="Поиск по названию, описанию или категории..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        size="sm"
        backgroundColor="white"
      />

      <HStack gap="4px">
        <Button size="xs" variant={activeLibraryTab === 'system' ? 'solid' : 'ghost'} onClick={() => setActiveLibraryTab('system')}>Системные ({systemBlocks.length})</Button>
        <Button size="xs" variant={activeLibraryTab === 'community' ? 'solid' : 'ghost'} onClick={() => setActiveLibraryTab('community')}>Сообщество ({communityBlocks.length})</Button>
        <Button size="xs" variant={activeLibraryTab === 'user' ? 'solid' : 'ghost'} onClick={() => setActiveLibraryTab('user')}>Мои ({userBlocks.length + systemBlocks.filter((b) => b.isCustom).length})</Button>
      </HStack>

      {source.length === 0 ? (
        <Text fontSize="14px" color="var(--app-text-muted)" textAlign="center" padding="12px">Блоки не найдены</Text>
      ) : (
        <SimpleGrid columns={1} gap="12px">
          {source.map((block) => (
            <BlockCard
              key={block.id}
              block={block}
              draggable
              onSelect={() => onSelectBlock(block)}
            />
          ))}
        </SimpleGrid>
      )}
    </VStack>
  );
};