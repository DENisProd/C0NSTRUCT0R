import { Box, HStack, Image, Text, Button } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Sun, Moon } from 'lucide-react';

export const HeaderEditor = () => {
  const { project, selectBlock, isPreviewMode } = useProjectStore();
  const { header } = project;

  const handleClick = () => {
    if (!isPreviewMode) {
      selectBlock('header');
    }
  };

  return (
    <Box
      backgroundColor={project.theme.surface}
      color={project.theme.text}
      padding="15px 20px"
      borderBottom={`1px solid ${project.theme.border}`}
      cursor={!isPreviewMode ? 'pointer' : 'default'}
      onClick={() => {
        if (!isPreviewMode) {
          handleClick();
        }
      }}
      _hover={{
        outline: !isPreviewMode ? `1px dashed ${project.theme.accent}` : 'none',
      }}
    >
      <HStack gap="15px" justifyContent="space-between">
        <HStack gap="15px">
          {header.logoUrl && (
            <Image src={header.logoUrl} alt="Logo" height="40px" objectFit="contain" />
          )}
          <Text fontSize="20px" fontWeight="bold">
            {header.companyName || 'Моя компания'}
          </Text>
        </HStack>
      </HStack>
    </Box>
  );
};

export const HeaderService = () => {
  const { project } = useProjectStore();
  const navigate = useNavigate();
  const [globalMode, setGlobalMode] = useState<'light' | 'dark'>('light');
  const applyGlobalTheme = (mode: 'light' | 'dark') => {
    const root = document.documentElement;
    const isDark = mode === 'dark';
    const cssVars = [
      '--app-bg-muted',
      '--app-surface',
      '--app-border',
      '--app-text-muted',
      '--app-accent',
      '--app-success',
      '--app-hover',
      '--app-selected',
      '--app-resize',
    ];
    cssVars.forEach((v) => root.style.removeProperty(v));
    root.setAttribute('data-theme', mode);
    root.style.colorScheme = isDark ? 'dark' : 'light';
    localStorage.setItem('global-theme-mode', mode);
    setGlobalMode(mode);
  };
  useEffect(() => {
    const saved = (localStorage.getItem('global-theme-mode') as 'light' | 'dark') || 'light';
    applyGlobalTheme(saved);
  }, []);

  return (
    <Box
      backgroundColor={'var(--app-surface)'}
      color={'var(--app-text-muted)'}
      padding="15px 20px"
      borderBottom={'1px solid var(--app-border)'}
    >
      <HStack gap="15px" justifyContent="space-between" alignItems="center">
        <HStack gap="6px" alignItems="center">
          <Lock size={18} />
          <Box as="span" fontSize="18px" fontWeight="bolder">Dark Secrets</Box>
        </HStack>
        <HStack gap="10px" alignItems="center">
          <Button
            size="sm"
            variant="outline"
            onClick={() => applyGlobalTheme(globalMode === 'dark' ? 'light' : 'dark')}
            borderColor="var(--app-accent)"
            color="var(--app-accent)"
            _hover={{ backgroundColor: 'var(--app-hover)' }}
            title={globalMode === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          >
            {globalMode === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            color={'var(--app-accent)'}
            _hover={{ backgroundColor: 'var(--app-hover)' }}
            onClick={(e) => {
              e.stopPropagation();
              navigate('/profile');
            }}
          >
            <HStack gap="6px">
              <User size={16} />
              <Box as="span">Профиль</Box>
            </HStack>
          </Button>
        </HStack>
      </HStack>
    </Box>
  );
};




