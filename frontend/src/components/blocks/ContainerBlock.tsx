import { Box, VStack, Text } from '@chakra-ui/react';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import type { ContainerBlock as ContainerBlockType, Block } from '../../types';
import { useProjectStore } from '../../store/useProjectStore';
import { BlockRenderer } from './BlockRenderer';
import { useResponsiveStore } from '../../store/useResponsiveStore';
import { getStyleForBreakpoint } from '../../lib/responsiveUtils';

interface ContainerBlockProps {
  block: ContainerBlockType;
  isSelected: boolean;
  isPreview: boolean;
}

const InnerDropZone = ({ id, isEmpty = false, direction = 'column' }: { id: string; isEmpty?: boolean; direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse' }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const { project } = useProjectStore();

  const isRow = direction.startsWith('row');
  const minHeight = isRow ? '0' : isEmpty ? '60px' : isOver ? '36px' : '0';
  const minWidth = isRow ? (isEmpty ? '60px' : isOver ? '36px' : '0') : '0';
  const padding = isEmpty ? '12px' : isOver ? '6px' : '0';
  const margin = isRow ? (isEmpty || isOver ? '0 8px' : '0') : isEmpty || isOver ? '8px 0' : '0';

  return (
    <Box
      ref={setNodeRef}
      minHeight={minHeight}
      minWidth={minWidth}
      border={isOver ? `2px dashed ${project.theme.accent}` : '2px dashed transparent'}
      borderRadius="4px"
      padding={padding}
      backgroundColor={isOver ? '#f0f8ff' : 'transparent'}
      transition="all 0.2s"
      margin={margin}
    >
      {isOver && (
        <Text textAlign="center" color={project.theme.accent} fontSize="12px" fontWeight="bold">
          Вставьте блок сюда
        </Text>
      )}
    </Box>
  );
};

export const ContainerBlock = ({ block, isSelected, isPreview }: ContainerBlockProps) => {
  const { selectBlock, project, deleteBlock, isLibraryDragging } = useProjectStore();
  const { currentBreakpoint } = useResponsiveStore();
  const children = (block.children || []) as Block[];
  const [isDraggingLibraryLocal] = useState(false);
  
  const responsiveStyle = getStyleForBreakpoint(block.style, currentBreakpoint);


  const handleClick = (e: React.MouseEvent) => {
    if (!isPreview) {
      if (e.currentTarget === e.target) {
        selectBlock(block.id);
      }
    }
  };

  const direction = (responsiveStyle.flexDirection || block.style.flexDirection || 'column') as 'row' | 'column' | 'row-reverse' | 'column-reverse';
  return (
    <Box
      id={block.htmlId || undefined}
      data-block-id={block.id}
      onClick={handleClick}
      border="1px dashed transparent"
      style={{
        ...block.style,
        padding: responsiveStyle.padding ?? block.style.padding,
        margin: responsiveStyle.margin ?? block.style.margin,
        width: responsiveStyle.width ?? block.style.width,
        display: responsiveStyle.display ?? block.style.display ?? 'flex',
        flexDirection: direction,
        flexWrap: responsiveStyle.flexWrap ?? block.style.flexWrap ?? 'nowrap',
        alignItems: responsiveStyle.alignItems ?? block.style.alignItems ?? 'stretch',
        justifyContent: responsiveStyle.justifyContent ?? block.style.justifyContent ?? 'flex-start',
        textAlign: responsiveStyle.textAlign ?? block.style.textAlign,
        boxShadow: isSelected && !isPreview ? `0 0 0 2px ${project.theme.accent}` : 'none',
        backgroundColor: (isLibraryDragging || isDraggingLibraryLocal) ? 'transparent' : (block.style.backgroundColor || project.theme.surface),
        position: 'relative',
      }}
      borderRadius={responsiveStyle.borderRadius ?? block.style.borderRadius}
      overflow={block.style.borderRadius ? 'hidden' : undefined}
      _hover={{
        border: !isPreview ? '1px dashed var(--app-border)' : 'none',
        '& > .delete-btn': {
          display: !isPreview ? 'block' : 'none',
        },
      }}
    >
      {!isPreview && (
        <Box
          position="absolute"
          top="6px"
          right="6px"
          zIndex={20}
          backgroundColor="var(--app-surface)"
          border="1px solid var(--app-border)"
          borderRadius="6px"
          fontSize="12px"
          color="inherit"
          padding="4px 8px"
          boxShadow="0 1px 2px rgba(0,0,0,0.06)"
          cursor="pointer"
          onClick={(e) => {
            e.stopPropagation();
            selectBlock(block.id);
          }}
        >
          Контейнер
        </Box>
      )}
      {!isPreview && (
        <InnerDropZone id={`container-drop-zone-${block.id}-0`} isEmpty={children.length === 0} direction={direction} />
      )}
      {children.map((child, idx) => (
        <Box key={child.id}>
          <BlockRenderer block={child} isPreview={isPreview} />
          {!isPreview && (
            <InnerDropZone id={`container-drop-zone-${block.id}-${idx + 1}`} direction={direction} />
          )}
        </Box>
      ))}
      {!isPreview && (
        <Box
          className="delete-btn"
          position="absolute"
          top="6px"
          left="6px"
          backgroundColor="var(--app-surface)"
          color="var(--app-text-muted)"
          padding="6px"
          borderRadius="6px"
          border="1px solid var(--app-border)"
          cursor="pointer"
          display="none"
          _hover={{ backgroundColor: 'var(--app-hover)', color: 'var(--app-accent)' }}
          onClick={(e) => {
            e.stopPropagation();
            deleteBlock(block.id);
          }}
        >
          <Trash2 size={14} />
        </Box>
      )}
    </Box>
  );
};