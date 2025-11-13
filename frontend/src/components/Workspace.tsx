import { Box, VStack, Text, Button, HStack } from '@chakra-ui/react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useProjectStore } from '../store/useProjectStore';
import { SortableBlock } from './SortableBlock';
import { usePresence } from '../lib/usePresence';
import { CursorsOverlay } from './CursorsOverlay';

const DropZone = ({ id, isEmpty = false }: { id: string; isEmpty?: boolean }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const { project } = useProjectStore();

  const minHeight = isEmpty ? '100px' : isOver ? '42px' : '0';
  const padding = isEmpty ? '20px' : isOver ? '8px' : '0';
  const margin = isEmpty ? '10px 0' : isOver ? '10px 0' : '0';

  return (
    <Box
      ref={setNodeRef}
      minHeight={minHeight}
      border={isOver ? `2px dashed ${project.theme.accent}` : '2px dashed transparent'}
      borderRadius="4px"
      padding={padding}
      backgroundColor={isOver ? '#f0f8ff' : 'transparent'}
      transition="all 0.2s"
      margin={margin}
    >
      {isOver && (
        <Text textAlign="center" color={project.theme.accent} fontSize="14px" fontWeight="bold">
          Отпустите для добавления блока
        </Text>
      )}
    </Box>
  );
};

export const Workspace = () => {
  const { project, isPreviewMode, setPreviewMode } = useProjectStore();
  const { blocks } = project;
  usePresence(!isPreviewMode);

  return (
    <Box
      flex="1"
      backgroundColor={project.theme.background}
      overflowY="auto"
      minHeight="calc(100vh - 60px)"
    >
      {!isPreviewMode && <CursorsOverlay />}
      <Box maxWidth="1200px" margin="0 auto" padding="20px">
        <SortableContext
          items={blocks.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          <VStack gap="0" align="stretch">
            {!isPreviewMode && (
              <DropZone id={`workspace-drop-zone-0`} isEmpty={blocks.length === 0} />
            )}
            {blocks.map((block, index) => (
              <Box key={block.id}>
                <SortableBlock block={block} isPreview={isPreviewMode} />
                {!isPreviewMode && <DropZone id={`workspace-drop-zone-${index + 1}`} />}
              </Box>
            ))}
          </VStack>
        </SortableContext>
      </Box>
      {isPreviewMode && (
        <Box position="fixed" bottom="20px" right="20px" zIndex={1000}>
          <Button onClick={() => setPreviewMode(false)} colorScheme="gray" size="md" boxShadow="md">
            <HStack gap="6px">
              <span>↩</span>
              <Box as="span">Выйти из предпросмотра</Box>
            </HStack>
          </Button>
        </Box>
      )}
    </Box>
  );
};

