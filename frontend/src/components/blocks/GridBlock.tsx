import { Box } from '@chakra-ui/react';
import { useDroppable, useDraggable, useDndMonitor } from '@dnd-kit/core';
import { useState } from 'react';
import type { GridBlock as GridBlockType, Block, GridCell } from '../../types';
import { useProjectStore } from '../../store/useProjectStore';
import { BlockRenderer } from './BlockRenderer';
import { useResponsiveStore } from '../../store/useResponsiveStore';
import { getStyleForBreakpoint } from '../../lib/responsiveUtils';

interface GridBlockProps {
  block: GridBlockType;
  isSelected: boolean;
  isPreview: boolean;
}


const GridDragMonitor = ({ onChange }: { onChange: (dragging: boolean) => void }) => {
  useDndMonitor({
    onDragStart() {
      onChange(true);
    },
    onDragEnd() {
      onChange(false);
    },
    onDragCancel() {
      onChange(false);
    },
  });
  return null;
};

export const GridBlock = ({ block, isSelected, isPreview }: GridBlockProps) => {
  const { selectBlock, project } = useProjectStore();
  const { currentBreakpoint } = useResponsiveStore();
  const { columns, rows, gapX, gapY, align, justify, showCellBorders, cellBorderColor, cellBorderWidth } = block.settings;
  const [isDragging, setIsDragging] = useState(false);
  
  const responsiveStyle = getStyleForBreakpoint(block.style, currentBreakpoint);

  const handleClick = (e: React.MouseEvent) => {
    if (!isPreview) {
      e.stopPropagation();
      selectBlock(block.id);
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
      }}
      borderRadius={responsiveStyle.borderRadius || block.style.borderRadius}
      _hover={{ border: !isPreview ? '1px dashed #ccc' : 'none' }}
    >
      {!isPreview && <GridDragMonitor onChange={setIsDragging} />}
      <Box
        style={{
          display: 'grid',
          gridTemplateColumns: currentBreakpoint === 'mobile' 
            ? '1fr' 
            : currentBreakpoint === 'tablet' 
            ? `repeat(${Math.min(columns, 2)}, 1fr)`
            : `repeat(${columns}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, auto)`,
          columnGap: `${gapX}px`,
          rowGap: `${gapY}px`,
          alignItems: align ?? 'stretch',
          justifyItems: justify ?? 'start',
        }}
      >
        {block.cells.map((cell: GridCell, idx) => {
          const cellId = `grid-cell-${block.id}-${idx}`;
          const innerIsContainer = !!cell.block && (cell.block as Block).type === 'container';
          const { setNodeRef, isOver } = useDroppable({ id: cellId, disabled: innerIsContainer });
          return (
            <Box
              key={cellId}
              ref={setNodeRef}
              position="relative"
              minHeight={!cell.block ? '56px' : undefined}
              style={{
                display: 'grid',
                alignItems: cell.align ?? 'stretch',
                justifyItems: cell.justify ?? 'start',
                border: isOver
                  ? `2px solid ${project.theme.accent}`
                  : showCellBorders
                  ? `${cellBorderWidth ?? 1}px solid ${cellBorderColor ?? '#e0e0e0'}`
                  : 'none',
                backgroundColor: isOver
                  ? `${project.theme.accent}22`
                  : isDragging && !innerIsContainer
                  ? `${project.theme.accent}11`
                  : 'transparent',
                transition: 'all 0.15s ease',
                borderRadius: '6px',
              }}
            >
              <Box
                position="absolute"
                top="6px"
                left="6px"
                fontSize="11px"
                color="#444"
                backgroundColor="rgba(255,255,255,0.9)"
                border="1px solid #ddd"
                borderRadius="6px"
                padding="2px 6px"
                pointerEvents="none"
                display={isDragging || isOver ? 'block' : 'none'}
              >
                #{idx + 1}
              </Box>
              {cell.block && (
                <DraggableCellContent
                  block={cell.block}
                  gridId={block.id}
                  cellIndex={idx}
                  isPreview={isPreview}
                />
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

const DraggableCellContent = ({ block, gridId, cellIndex, isPreview }: { block: Block; gridId: string; cellIndex: number; isPreview: boolean }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `nested-block-${block.id}`,
    data: { gridId, cellIndex, blockId: block.id },
    disabled: isPreview,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.6 : 1,
      }
    : undefined;

  return (
    <Box ref={setNodeRef} style={style} {...listeners} {...attributes} cursor={isPreview ? 'default' : 'grab'}>
      <BlockRenderer block={block} isPreview={isPreview} />
    </Box>
  );
};