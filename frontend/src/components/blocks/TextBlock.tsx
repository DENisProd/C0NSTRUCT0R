import { Box } from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { TextBlock as TextBlockType } from '../../types';
import { useProjectStore } from '../../store/useProjectStore';
import { executeBlockEventFunctions } from '../../lib/functionExecutor';
import { useResponsiveStore } from '../../store/useResponsiveStore';
import { getStyleForBreakpoint } from '../../lib/responsiveUtils';

interface TextBlockProps {
  block: TextBlockType;
  isSelected: boolean;
  isPreview: boolean;
}

export const TextBlock = ({ block, isSelected, isPreview }: TextBlockProps) => {
  const { selectBlock, updateBlock, deleteBlock, project } = useProjectStore();
  const { currentBreakpoint } = useResponsiveStore();
  const contentRef = useRef<HTMLDivElement | null>(null);
  const blockRef = useRef<HTMLDivElement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const responsiveStyle = getStyleForBreakpoint(block.style, currentBreakpoint);

  useEffect(() => {
    if (blockRef.current) {
      blockRef.current.setAttribute('data-block-id', block.id);
    }
  }, [block.id]);

  useEffect(() => {
    if (!isEditing && contentRef.current) {
      contentRef.current.textContent = block.content ?? '';
    }
  }, [block.content, isEditing]);

  const handleClick = (e: React.MouseEvent) => {
    if (isPreview) {
      if (block.events?.onClick) {
        e.stopPropagation();
        executeBlockEventFunctions(block.id, 'onClick', block.events);
      }
    } else {
      e.stopPropagation();
      selectBlock(block.id);
    }
  };

  const handleMouseEnter = () => {
    if (isPreview && block.events?.onHover) {
      executeBlockEventFunctions(block.id, 'onHover', block.events);
    }
  };

  const handleBlur = () => {
    const newContent = contentRef.current?.textContent || '';
    updateBlock(block.id, { content: newContent });
    setIsEditing(false);
  };

  return (
    <Box
      id={block.htmlId || undefined}
      ref={blockRef}
      position="relative"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      data-block-id={block.id}
      border="1px dashed transparent"
      _hover={{
        '& > .delete-btn': {
          display: !isPreview ? 'block' : 'none',
        },
        border: !isPreview ? '1px dashed #ccc' : 'none',
      }}
      style={{
        boxShadow: isSelected && !isPreview ? `0 0 0 2px ${project.theme.accent}` : 'none',
        cursor: isPreview && block.events?.onClick ? 'pointer' : 'default',
      }}
    >
      <Box
        contentEditable={!isPreview}
        suppressContentEditableWarning
        onInput={() => {}}
        onFocus={() => setIsEditing(true)}
        onBlur={handleBlur}
        fontSize={responsiveStyle.fontSize || block.style.fontSize}
        color={block.style.color}
        textAlign={responsiveStyle.textAlign || block.style.textAlign}
        fontWeight={block.style.fontWeight}
        backgroundColor={block.style.backgroundColor}
        padding={responsiveStyle.padding || block.style.padding}
        margin={responsiveStyle.margin || block.style.margin}
        width={responsiveStyle.width || block.style.width}
        borderRadius={responsiveStyle.borderRadius || block.style.borderRadius}
        style={{
          cursor: isPreview ? 'default' : 'text',
          minHeight: '30px',
          wordBreak: 'break-word',
          overflowWrap: 'anywhere',
          lineHeight: 1.25,
        }}
        _hover={{
          outline: !isPreview ? '1px dashed #ccc' : 'none',
        }}
        ref={contentRef}
      >
      </Box>

      {!isPreview && (
        <Box
          className="delete-btn"
          position="absolute"
          top="5px"
          right="5px"
          backgroundColor="var(--app-surface)"
          color="var(--app-text-muted)"
          padding="6px"
          borderRadius="6px"
          border="1px solid var(--app-border)"
          cursor="pointer"
          display="none"
          zIndex={10}
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

