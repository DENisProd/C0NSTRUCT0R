import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Box, VStack, Heading, Spinner, Text } from '@chakra-ui/react';
import { getDefaultProject } from '../store/project/persistence';
import { useProjectStore } from '../store/useProjectStore';
import { getPublicProject } from '../lib/api/projects';
import type { Project } from '../types';
import { BlockRenderer } from '../components/blocks/BlockRenderer';
import { useResponsiveStore } from '../store/useResponsiveStore';
import { generateResponsiveStyles } from '../lib/responsiveUtils';

export const ViewPage = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setProject: setStoreProject, setPreviewMode } = useProjectStore();
  const { setBreakpoint, currentBreakpoint } = useResponsiveStore();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getPublicProject(Number(projectId));
        const withResponsive = {
          ...data,
          blocks: data.blocks.map(enhanceBlockResponsive),
        } as Project;
        setProject(withResponsive);
        setStoreProject(withResponsive);
        setPreviewMode(true);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Ошибка загрузки проекта';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };
    if (projectId) load();
    return () => {
      setPreviewMode(false);
    };
  }, [projectId]);

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setBreakpoint('mobile');
      } else if (width < 1024) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('desktop');
      }
    };

    // Устанавливаем начальный breakpoint
    updateBreakpoint();

    // Слушаем изменения размера окна
    window.addEventListener('resize', updateBreakpoint);

    const target = containerRef.current;
    if (target) {
      const ro = new ResizeObserver(() => {
        updateBreakpoint();
      });
      ro.observe(target);
      return () => {
        ro.disconnect();
        window.removeEventListener('resize', updateBreakpoint);
      };
    }

    return () => {
      window.removeEventListener('resize', updateBreakpoint);
    };
  }, [setBreakpoint]);

  function enhanceBlockResponsive(block: any): any {
    const style = block.style || {};
    const responsive = style.responsive || generateResponsiveStyles(style);
    const base = { ...block, style: { ...style, responsive } };
    if (block.type === 'container' && Array.isArray(block.children)) {
      return { ...base, children: block.children.map(enhanceBlockResponsive) };
    }
    if (block.type === 'grid' && Array.isArray(block.cells)) {
      return {
        ...base,
        cells: block.cells.map((cell: any) => ({
          ...cell,
          block: cell.block ? enhanceBlockResponsive(cell.block) : cell.block,
        })),
      };
    }
    return base;
  }

  if (isLoading) {
    return (
      <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" backgroundColor="var(--app-bg-muted)">
        <Spinner size="xl" color="var(--app-accent)" />
      </Box>
    );
  }

  if (error || !project) {
    return (
      <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" padding="24px" backgroundColor="var(--app-bg-muted)">
        <Box padding="16px" backgroundColor="var(--app-surface)" border="1px solid var(--app-border)" borderRadius="8px">
          <Text color="inherit">{error || 'Проект не найден или недоступен'}</Text>
        </Box>
      </Box>
    );
  }

  const fallback = getDefaultProject();
  const theme = project.theme || fallback.theme;
  const title = project.projectName || fallback.projectName;
  const blocks = Array.isArray(project.blocks) ? project.blocks : [];
  const themeVars = {
    '--app-accent': theme.accent,
    '--app-surface': theme.surface,
    '--app-border': theme.border,
    '--app-bg-muted': theme.background,
    colorScheme: theme.mode === 'dark' ? 'dark' : 'light',
  } as React.CSSProperties;

  // Адаптивные стили для контейнера
  const getContainerStyles = () => {
    const baseStyles = {
      maxWidth: '1200px',
      margin: '0 auto',
      backgroundColor: theme.surface,
      border: '1px solid',
      borderColor: theme.border,
      borderRadius: '10px',
    };

    if (currentBreakpoint === 'mobile') {
      return {
        ...baseStyles,
        padding: '12px',
        margin: '0',
        borderRadius: '0',
        border: 'none',
        borderTop: `1px solid ${theme.border}`,
        borderBottom: `1px solid ${theme.border}`,
      };
    } else if (currentBreakpoint === 'tablet') {
      return {
        ...baseStyles,
        padding: '16px',
        margin: '0 auto',
      };
    }
    return {
      ...baseStyles,
      padding: '24px',
    };
  };

  return (
    <Box minHeight="100vh" backgroundColor={theme.background} style={themeVars}>
      <Box ref={containerRef} {...getContainerStyles()}>
        <Heading 
          size="lg" 
          marginBottom="16px" 
          color={theme.heading}
          fontSize={currentBreakpoint === 'mobile' ? '20px' : currentBreakpoint === 'tablet' ? '24px' : '32px'}
        >
          {title}
        </Heading>
        <VStack gap="0" align="stretch">
          {blocks.map((block) => (
            <Box key={block.id}>
              <BlockRenderer block={block} isPreview={true} interactionsEnabled={false} />
            </Box>
          ))}
        </VStack>
      </Box>
    </Box>
  );
}

export default ViewPage;