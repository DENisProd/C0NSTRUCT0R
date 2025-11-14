import { VStack, HStack, Text, Input, Button, Box, Spinner } from '@chakra-ui/react';
import { Sun, Moon } from 'lucide-react';
import type { Project } from '../../types';
import { useState } from 'react';
import { getRandomPalette } from '../../lib/api/generateLanding';
import { applyPaletteToProject } from '../../lib/applyPalette';

interface ThemeTabProps {
  projectTheme: Project['theme'];
  updateTheme: (updates: Partial<Project['theme']>) => void;
}

export const ThemeTab = ({ projectTheme, updateTheme }: ThemeTabProps) => {
  const [isLoadingPalette, setIsLoadingPalette] = useState(false);
  const handleRandomPalette = async () => {
    try {
      setIsLoadingPalette(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const palette = await getRandomPalette(token);
      applyPaletteToProject(palette, updateTheme);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingPalette(false);
    }
  };
  return (
    <VStack gap="16px" align="stretch">
      <Text fontSize="18px" fontWeight="bold">Тема проекта</Text>
      <HStack gap="12px">
        <Button
          size="sm"
          variant={projectTheme.mode === 'light' ? 'solid' : 'outline'}
          backgroundColor={projectTheme.mode === 'light' ? 'var(--app-accent)' : 'var(--app-surface)'}
          color={projectTheme.mode === 'light' ? 'white' : 'var(--app-accent)'}
          borderColor="var(--app-accent)"
          _hover={{ backgroundColor: 'var(--app-hover)' }}
          onClick={() => updateTheme({ mode: 'light' })}
          title="Светлая тема"
        
        >
          <HStack gap="6px" align="center">
            <Sun size={16} />
            <Box as="span">Светлая</Box>
          </HStack>
        </Button>
        <Button
          size="sm"
          variant={projectTheme.mode === 'dark' ? 'solid' : 'outline'}
          backgroundColor={projectTheme.mode === 'dark' ? 'var(--app-accent)' : 'var(--app-surface)'}
          color={projectTheme.mode === 'dark' ? 'white' : 'var(--app-accent)'}
          borderColor="var(--app-accent)"
          _hover={{ backgroundColor: 'var(--app-hover)' }}
          onClick={() => updateTheme({ mode: 'dark' })}
          title="Тёмная тема"
        >
          <HStack gap="6px" align="center">
            <Moon size={16} />
            <Box as="span">Тёмная</Box>
          </HStack>
        </Button>
      </HStack>
      <HStack gap="12px">
        <Button
          size="sm"
          variant="outline"
          backgroundColor="var(--app-surface)"
          color="inherit"
          borderColor="var(--app-border)"
          _hover={{ backgroundColor: 'var(--app-hover)' }}
          onClick={handleRandomPalette}
          title="Случайная палитра"
          disabled={isLoadingPalette}
        >
          {isLoadingPalette ? (
            <HStack gap="6px" align="center">
              <Spinner size="xs" />
              <Box as="span">Генерация…</Box>
            </HStack>
          ) : (
            <Box as="span">Случайная палитра</Box>
          )}
        </Button>
      </HStack>
      <VStack gap="10px" align="stretch">
        <HStack justify="space-between">
          <Text>Акцент</Text>
          <Input type="color" value={projectTheme.accent} onChange={(e) => updateTheme({ accent: e.target.value })} width="60px" padding={0} />
        </HStack>
        <HStack justify="space-between">
          <Text>Текст</Text>
          <Input type="color" value={projectTheme.text} onChange={(e) => updateTheme({ text: e.target.value })} width="60px" padding={0} />
        </HStack>
        <HStack justify="space-between">
          <Text>Заголовки</Text>
          <Input type="color" value={projectTheme.heading} onChange={(e) => updateTheme({ heading: e.target.value })} width="60px" padding={0} />
        </HStack>
        <HStack justify="space-between">
          <Text>Фон страницы</Text>
          <Input type="color" value={projectTheme.background} onChange={(e) => updateTheme({ background: e.target.value })} width="60px" padding={0} />
        </HStack>
        <HStack justify="space-between">
          <Text>Поверхность панелей</Text>
          <Input type="color" value={projectTheme.surface} onChange={(e) => updateTheme({ surface: e.target.value })} width="60px" padding={0} />
        </HStack>
        <HStack justify="space-between">
          <Text>Цвет границ</Text>
          <Input type="color" value={projectTheme.border} onChange={(e) => updateTheme({ border: e.target.value })} width="60px" padding={0} />
        </HStack>
      </VStack>
    </VStack>
  );
};