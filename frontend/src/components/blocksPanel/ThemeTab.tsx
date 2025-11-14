import { VStack, HStack, Text, Input } from '@chakra-ui/react';
import type { Project } from '../../types';

interface ThemeTabProps {
  projectTheme: Project['theme'];
  updateTheme: (updates: Partial<Project['theme']>) => void;
}

export const ThemeTab = ({ projectTheme, updateTheme }: ThemeTabProps) => {
  return (
    <VStack gap="16px" align="stretch">
      <Text fontSize="18px" fontWeight="bold">Тема проекта</Text>
      <HStack gap="12px">
        <label>
          <input
            type="radio"
            name="theme-mode"
            checked={projectTheme.mode === 'light'}
            onChange={() => updateTheme({ mode: 'light' })}
          />{' '}
          Светлая
        </label>
        <label>
          <input
            type="radio"
            name="theme-mode"
            checked={projectTheme.mode === 'dark'}
            onChange={() => updateTheme({ mode: 'dark' })}
          />{' '}
          Тёмная
        </label>
        <label>
          <input
            type="checkbox"
            checked={projectTheme.mode === 'dark'}
            onChange={(e) => updateTheme({ mode: e.target.checked ? 'dark' : 'light' })}
          />{' '}
          Темный режим
        </label>
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