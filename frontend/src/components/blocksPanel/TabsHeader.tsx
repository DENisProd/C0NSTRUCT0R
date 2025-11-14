import { HStack, Button } from '@chakra-ui/react';
import { Layers, Library as LibraryIcon, Palette, Cpu } from 'lucide-react';

type TabKey = 'blocks' | 'library' | 'theme' | 'logic';

interface TabsHeaderProps {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
}

export const TabsHeader = ({ activeTab, onChange }: TabsHeaderProps) => {
  return (
    <HStack gap={0} borderBottom="1px solid var(--app-border)">
      <Button
        variant={activeTab === 'blocks' ? 'solid' : 'ghost'}
        borderRadius="0"
        onClick={() => onChange('blocks')}
        flex="1"
        fontSize="12px"
        backgroundColor={activeTab === 'blocks' ? 'var(--app-accent)' : 'transparent'}
        color={activeTab === 'blocks' ? 'white' : 'inherit'}
      >
        <Layers size={16} />
      </Button>
      <Button
        variant={activeTab === 'library' ? 'solid' : 'ghost'}
        borderRadius="0"
        onClick={() => onChange('library')}
        flex="1"
        fontSize="12px"
        backgroundColor={activeTab === 'library' ? 'var(--app-accent)' : 'transparent'}
        color={activeTab === 'library' ? 'white' : 'inherit'}
      >
        <LibraryIcon size={16} />
      </Button>
      <Button
        variant={activeTab === 'theme' ? 'solid' : 'ghost'}
        borderRadius="0"
        onClick={() => onChange('theme')}
        flex="1"
        fontSize="12px"
        backgroundColor={activeTab === 'theme' ? 'var(--app-accent)' : 'transparent'}
        color={activeTab === 'theme' ? 'white' : 'inherit'}
      >
        <Palette size={16} />
      </Button>
      <Button
        variant={activeTab === 'logic' ? 'solid' : 'ghost'}
        borderRadius="0"
        onClick={() => onChange('logic')}
        flex="1"
        fontSize="12px"
        backgroundColor={activeTab === 'logic' ? 'var(--app-accent)' : 'transparent'}
        color={activeTab === 'logic' ? 'white' : 'inherit'}
      >
        <Cpu size={16} />
      </Button>
    </HStack>
  );
};