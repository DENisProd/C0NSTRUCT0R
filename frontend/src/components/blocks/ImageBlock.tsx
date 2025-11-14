import { Box, Image, Text } from '@chakra-ui/react';
import { useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import type { ImageBlock as ImageBlockType } from '../../types';
import { useProjectStore } from '../../store/useProjectStore';
import { executeBlockEventFunctions } from '../../lib/functionExecutor';
import { useResponsiveStore } from '../../store/useResponsiveStore';
import { getStyleForBreakpoint } from '../../lib/responsiveUtils';
import { getMediaUrlByEtag } from '../../lib/api/media';

interface ImageBlockProps {
  block: ImageBlockType;
  isSelected: boolean;
  isPreview: boolean;
}

export const ImageBlock = ({ block, isSelected, isPreview }: ImageBlockProps) => {
  const { selectBlock, deleteBlock, project } = useProjectStore();
  const { currentBreakpoint } = useResponsiveStore();
  const blockRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const responsiveStyle = getStyleForBreakpoint(block.style, currentBreakpoint);

  useEffect(() => {
    if (blockRef.current) {
      blockRef.current.setAttribute('data-block-id', block.id);
    }
  }, [block.id]);

  useEffect(() => {
    if (isPreview && block.events?.onLoad && imageRef.current) {
      const img = imageRef.current;
      if (img.complete) {
        executeBlockEventFunctions(block.id, 'onLoad', block.events);
      } else {
        img.onload = () => {
          executeBlockEventFunctions(block.id, 'onLoad', block.events);
        };
      }
    }
  }, [block.id, block.events, isPreview]);

  const handleClick = (e: React.MouseEvent) => {
    if (isPreview) {
      if (block.events?.onClick) {
        e.preventDefault();
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

  // Определяем URL изображения: приоритет у mediaEtag, затем url
  const imageUrl = block.mediaEtag
    ? getMediaUrlByEtag(block.mediaEtag)
    : block.url;

  return (
    <Box
      id={block.htmlId || undefined}
      ref={blockRef}
      position="relative"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      data-block-id={block.id}
      border="1px dashed transparent"
      style={{
        ...block.style,
        padding: responsiveStyle.padding || block.style.padding,
        margin: responsiveStyle.margin || block.style.margin,
        width: responsiveStyle.width || block.style.width,
        boxShadow: isSelected && !isPreview ? `0 0 0 2px ${project.theme.accent}` : 'none',
        cursor: isPreview ? (block.events?.onClick ? 'pointer' : 'default') : 'pointer',
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
      {imageUrl ? (
        <Image
          ref={imageRef}
          src={imageUrl}
          alt="Block image"
          width="100%"
          maxHeight="400px"
          objectFit="contain"
          borderRadius="inherit"
        />
      ) : (
        <Box
          border="2px dashed #ccc"
          padding="40px"
          textAlign="center"
          backgroundColor="#f9f9f9"
          borderRadius="inherit"
        >
          <Text color="#999">Загрузите изображение в панели свойств</Text>
        </Box>
      )}
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

