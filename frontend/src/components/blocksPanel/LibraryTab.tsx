import { VStack, Text, Button, Input, HStack, SimpleGrid, Box } from '@chakra-ui/react';
import { BookOpen } from 'lucide-react';
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
      <Text fontSize="18px" fontWeight="bold" color="inherit">Библиотека блоков</Text>
      <Button
        onClick={onNavigateAll}
        size="sm"
        backgroundColor="var(--app-accent)"
        color="white"
        _hover={{ backgroundColor: 'var(--app-accent)', opacity: 0.9 }}
      >
        <HStack gap="6px" align="center">
          <BookOpen size={16} />
          <Box as="span">Все</Box>
        </HStack>
      </Button>
      <Input
        placeholder="Поиск по названию, описанию или категории..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        size="sm"
        backgroundColor="var(--app-surface)"
        border="1px solid var(--app-border)"
        color="inherit"
        _placeholder={{ color: 'var(--app-text-muted)' }}
      />

      <HStack gap="4px" flexWrap="wrap">
        <Button
          size="xs"
          variant="outline"
          borderColor="var(--app-accent)"
          backgroundColor={activeLibraryTab === 'system' ? 'var(--app-accent)' : 'transparent'}
          color={activeLibraryTab === 'system' ? 'white' : 'var(--app-accent)'}
          _hover={{ backgroundColor: activeLibraryTab === 'system' ? 'var(--app-accent)' : 'var(--app-hover)' }}
          onClick={() => setActiveLibraryTab('system')}
        >
          Системные ({systemBlocks.length})
        </Button>
        <Button
          size="xs"
          variant="outline"
          borderColor="var(--app-accent)"
          backgroundColor={activeLibraryTab === 'community' ? 'var(--app-accent)' : 'transparent'}
          color={activeLibraryTab === 'community' ? 'white' : 'var(--app-accent)'}
          _hover={{ backgroundColor: activeLibraryTab === 'community' ? 'var(--app-accent)' : 'var(--app-hover)' }}
          onClick={() => setActiveLibraryTab('community')}
        >
          Сообщество ({communityBlocks.length})
        </Button>
        <Button
          size="xs"
          variant="outline"
          borderColor="var(--app-accent)"
          backgroundColor={activeLibraryTab === 'user' ? 'var(--app-accent)' : 'transparent'}
          color={activeLibraryTab === 'user' ? 'white' : 'var(--app-accent)'}
          _hover={{ backgroundColor: activeLibraryTab === 'user' ? 'var(--app-accent)' : 'var(--app-hover)' }}
          onClick={() => setActiveLibraryTab('user')}
        >
          Мои ({userBlocks.length + systemBlocks.filter((b) => b.isCustom).length})
        </Button>
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