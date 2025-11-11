import { Box, VStack, Text } from '@chakra-ui/react';
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

const InnerDropZone = ({ id, isEmpty = false }: { id: string; isEmpty?: boolean }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const { project } = useProjectStore();

  const minHeight = isEmpty ? '60px' : isOver ? '36px' : '0';
  const padding = isEmpty ? '12px' : isOver ? '6px' : '0';
  const margin = isEmpty ? '8px 0' : isOver ? '8px 0' : '0';

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
        <Text textAlign="center" color={project.theme.accent} fontSize="12px" fontWeight="bold">
          Вставьте блок сюда
        </Text>
      )}
    </Box>
  );
};

export const ContainerBlock = ({ block, isSelected, isPreview }: ContainerBlockProps) => {
  const { selectBlock, project, deleteBlock } = useProjectStore();
  const { currentBreakpoint } = useResponsiveStore();
  const children = (block.children || []) as Block[];
  
  // Получаем стили для текущего брейкпоинта
  const responsiveStyle = getStyleForBreakpoint(block.style, currentBreakpoint);

  const handleClick = (e: React.MouseEvent) => {
    if (!isPreview) {
      // Выделяем контейнер только при прямом клике по его фону,
      // а не при клике по вложенному контенту
      if (e.currentTarget === e.target) {
        selectBlock(block.id);
      }
    }
  };

  return (
    <Box
      id={block.htmlId || undefined}
      data-block-id={block.id}
      onClick={handleClick}
      style={{
        ...block.style,
        padding: responsiveStyle.padding || block.style.padding,
        margin: responsiveStyle.margin || block.style.margin,
        width: responsiveStyle.width || block.style.width,
        boxShadow: isSelected && !isPreview ? `0 0 0 2px ${project.theme.accent}` : 'none',
        backgroundColor: block.style.backgroundColor || '#fafafa',
        position: 'relative',
      }}
      borderRadius={responsiveStyle.borderRadius || block.style.borderRadius}
      overflow={block.style.borderRadius ? 'hidden' : undefined}
      _hover={{
        border: !isPreview ? '1px dashed #ccc' : 'none',
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
          backgroundColor="#fff"
          border="1px solid #ddd"
          borderRadius="6px"
          fontSize="12px"
          color="#555"
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
      <Box
        gap="0"
        style={{
          display: responsiveStyle.display || block.style.display || 'block',
          flexDirection: responsiveStyle.flexDirection || block.style.flexDirection || (currentBreakpoint === 'mobile' ? 'column' : undefined),
          flexWrap: responsiveStyle.flexWrap || block.style.flexWrap || (currentBreakpoint === 'mobile' ? 'wrap' : undefined),
        }}
      >
        {!isPreview && (
          <InnerDropZone id={`container-drop-zone-${block.id}-0`} isEmpty={children.length === 0} />
        )}
        {children.map((child, idx) => {
          const displayValue = responsiveStyle.display || block.style.display || 'block';
          return (
            <Box 
              key={child.id} 
              flex={displayValue === 'flex' ? '1 1 auto' : undefined}
              style={displayValue === 'flex' ? { flex: '1 1 auto' } : undefined}
            >
              <BlockRenderer block={child} isPreview={isPreview} />
              {!isPreview && (
                <InnerDropZone id={`container-drop-zone-${block.id}-${idx + 1}`} />
              )}
            </Box>
          );
        })}
      </Box>
      {!isPreview && (
        <Box
          className="delete-btn"
          position="absolute"
          top="6px"
          left="6px"
          backgroundColor="red"
          color="white"
          padding="5px 10px"
          borderRadius="4px"
          cursor="pointer"
          display="none"
          onClick={(e) => {
            e.stopPropagation();
            deleteBlock(block.id);
          }}
        >
          🗑 Удалить
        </Box>
      )}
    </Box>
  );
};