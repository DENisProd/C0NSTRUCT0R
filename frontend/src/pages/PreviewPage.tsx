import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, VStack, Heading, Spinner, Text, HStack, Button } from '@chakra-ui/react';
import { getProject, updateProject } from '../lib/api/projects';
import type { Project } from '../types';
import { BlockRenderer } from '../components/blocks/BlockRenderer';
import { useResponsiveStore } from '../store/useResponsiveStore';
import { generateResponsiveStyles } from '../lib/responsiveUtils';

export const PreviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const { setBreakpoint, currentBreakpoint } = useResponsiveStore();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getProject(Number(id));
        const withResponsive = {
          ...data,
          blocks: data.blocks.map(enhanceBlockResponsive),
        } as Project;
        setProject(withResponsive);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Ошибка загрузки проекта';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) load();
  }, [id]);

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

  const handleShare = async () => {
    if (!id) return;
    try {
      setIsSharing(true);
      await updateProject(Number(id), { isPublic: true });
      const url = `${window.location.origin}/view/${id}`;
      const copied = await copyText(url);
      if (copied) {
        alert('Ссылка скопирована: ' + url);
      } else {
        alert('Скопируйте вручную: ' + url);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Не удалось поделиться';
      setError(message);
    } finally {
      setIsSharing(false);
    }
  };

  async function copyText(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        return ok;
      } catch {
        return false;
      }
    }
  }

  const handleExitPreview = () => {
    if (!id) return;
    navigate(`/editor/${id}`);
  };

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
          <Text color="inherit">{error || 'Проект не найден'}</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box minHeight="100vh" backgroundColor={project.theme.background}>
      <Box ref={containerRef} maxWidth="1200px" margin="0 auto" padding="24px" backgroundColor={project.theme.surface} border="1px solid" borderColor={project.theme.border} borderRadius="10px">
        <HStack justifyContent="space-between" marginBottom="16px">
          <Heading size="lg" color={project.theme.heading}>{project.projectName}</Heading>
          <HStack gap="8px">
            <Button onClick={handleExitPreview} variant="outline" colorScheme="gray">
              Выйти из предпросмотра
            </Button>
            <Button onClick={handleShare} loading={isSharing} variant="solid" colorScheme="blue">
              Поделиться лендингом
            </Button>
          </HStack>
        </HStack>
        <VStack gap="0" align="stretch">
          {project.blocks.map((block) => (
            <Box key={block.id}>
              <BlockRenderer block={block} isPreview={true} />
            </Box>
          ))}
        </VStack>
      </Box>
    </Box>
  );
};