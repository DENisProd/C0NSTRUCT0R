import { Box, Input as ChakraInput } from '@chakra-ui/react';
import { useEffect, useRef } from 'react';
import type { InputBlock as InputBlockType } from '../../types';
import { useProjectStore } from '../../store/useProjectStore';
import { useResponsiveStore } from '../../store/useResponsiveStore';
import { getStyleForBreakpoint } from '../../lib/responsiveUtils';
import { executeBlockEventFunctions } from '../../lib/functionExecutor';
import { Trash2 } from 'lucide-react';

interface Props {
  block: InputBlockType;
  isSelected: boolean;
  isPreview: boolean;
}

export const InputBlock = ({ block, isSelected, isPreview }: Props) => {
  const { selectBlock, deleteBlock, project } = useProjectStore();
  const { currentBreakpoint } = useResponsiveStore();
  const blockRef = useRef<HTMLDivElement>(null);
  const responsiveStyle = getStyleForBreakpoint(block.style, currentBreakpoint);

  useEffect(() => {
    if (blockRef.current) {
      blockRef.current.setAttribute('data-block-id', block.id);
    }
  }, [block.id]);

  const handleClick = (e: React.MouseEvent) => {
    if (!isPreview) {
      e.stopPropagation();
      selectBlock(block.id);
    }
  };

  const handleFocus = () => {
    if (isPreview && block.events?.onFocus) {
      executeBlockEventFunctions(block.id, 'onFocus', block.events);
    }
  };

  const handleBlur = () => {
    if (isPreview && block.events?.onBlur) {
      executeBlockEventFunctions(block.id, 'onBlur', block.events);
    }
  };

  const handleChange = () => {
    if (isPreview && block.events?.onChange) {
      executeBlockEventFunctions(block.id, 'onChange', block.events);
    }
  };

  return (
    <Box
      id={block.htmlId || undefined}
      ref={blockRef}
      position="relative"
      onClick={handleClick}
      data-block-id={block.id}
      border="1px dashed transparent"
      style={{
        padding: responsiveStyle.padding || block.style.padding,
        margin: responsiveStyle.margin || block.style.margin,
        width: responsiveStyle.width || block.style.width,
        boxShadow: isSelected && !isPreview ? `0 0 0 2px ${project.theme.accent}` : 'none',
        cursor: isPreview ? 'text' : 'pointer',
      }}
      borderRadius={responsiveStyle.borderRadius || block.style.borderRadius}
      _hover={{
        border: !isPreview ? '1px dashed #ccc' : 'none',
        '& > .delete-btn': {
          display: !isPreview ? 'block' : 'none',
        },
      }}
   >
      <ChakraInput
        value={block.value || ''}
        placeholder={block.placeholder || 'Текстовое поле'}
        name={block.name}
        pointerEvents={isPreview ? 'auto' : 'none'}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
      />

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
}