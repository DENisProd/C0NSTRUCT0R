import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, VStack, Heading, Spinner, Text } from '@chakra-ui/react';
import { getProject } from '../lib/api/projects';
import type { Project } from '../types';
import { BlockRenderer } from '../components/blocks/BlockRenderer';

export const PreviewPage = () => {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getProject(Number(id));
        setProject(data);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Ошибка загрузки проекта';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) load();
  }, [id]);

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
      <Box maxWidth="1200px" margin="0 auto" padding="24px" backgroundColor={project.theme.surface} border="1px solid" borderColor={project.theme.border} borderRadius="10px">
        <Heading size="lg" marginBottom="16px" color={project.theme.heading}>{project.projectName}</Heading>
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