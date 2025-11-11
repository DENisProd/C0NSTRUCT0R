import { Box, Button } from '@chakra-ui/react';
import { useEffect, useRef } from 'react';
import type { ButtonBlock as ButtonBlockType } from '../../types';
import { useProjectStore } from '../../store/useProjectStore';
import { executeBlockEventFunctions } from '../../lib/functionExecutor';
import { useResponsiveStore } from '../../store/useResponsiveStore';
import { getStyleForBreakpoint } from '../../lib/responsiveUtils';

interface ButtonBlockProps {
  block: ButtonBlockType;
  isSelected: boolean;
  isPreview: boolean;
}

export const ButtonBlock = ({ block, isSelected, isPreview }: ButtonBlockProps) => {
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
    if (isPreview) {
      if (block.events?.onClick) {
        e.preventDefault();
        e.stopPropagation();
        executeBlockEventFunctions(block.id, 'onClick', block.events);
      }
      if (!block.events?.onClick && block.link && block.link !== '#') {
        return;
      }
      if (!block.events?.onClick && (!block.link || block.link === '#')) {
        e.preventDefault();
      }
    } else {
      e.preventDefault();
      e.stopPropagation();
      selectBlock(block.id);
    }
  };

  const handleMouseEnter = () => {
    if (isPreview && block.events?.onHover) {
      executeBlockEventFunctions(block.id, 'onHover', block.events);
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

  return (
    <Box
      id={block.htmlId || undefined}
      ref={blockRef}
      position="relative"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onFocus={handleFocus}
      onBlur={handleBlur}
      data-block-id={block.id}
      style={{
        ...block.style,
        padding: responsiveStyle.padding || block.style.padding,
        margin: responsiveStyle.margin || block.style.margin,
        width: responsiveStyle.width || block.style.width,
        boxShadow: isSelected && !isPreview ? `0 0 0 2px ${project.theme.accent}` : 'none',
        cursor: isPreview ? (block.events?.onClick ? 'pointer' : 'default') : 'pointer',
      }}
      borderRadius={responsiveStyle.borderRadius || block.style.borderRadius}
      _hover={{
        border: !isPreview ? '1px dashed #ccc' : 'none',
        '& > .delete-btn': {
          display: !isPreview ? 'block' : 'none',
        },
      }}
    >
      {isPreview ? (
        block.variant === 'radio' ? (
          <a
            href={block.events?.onClick ? undefined : block.link}
            style={{ textDecoration: 'none' }}
            target={block.events?.onClick ? undefined : '_blank'}
            rel={block.events?.onClick ? undefined : 'noopener noreferrer'}
            onClick={(e) => {
              if (block.events?.onClick) {
                e.preventDefault();
              }
            }}
          >
            <label style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <input type="radio" disabled style={{ accentColor: project.theme.accent }} />
              <span style={{ color: project.theme.text }}>{block.text}</span>
            </label>
          </a>
        ) : block.variant === 'checkbox' ? (
          <a
            href={block.events?.onClick ? undefined : block.link}
            style={{ textDecoration: 'none' }}
            target={block.events?.onClick ? undefined : '_blank'}
            rel={block.events?.onClick ? undefined : 'noopener noreferrer'}
            onClick={(e) => {
              if (block.events?.onClick) {
                e.preventDefault();
              }
            }}
          >
            <label style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" disabled style={{ accentColor: project.theme.accent }} />
              <span style={{ color: project.theme.text }}>{block.text}</span>
            </label>
          </a>
        ) : (
          <a
            href={block.events?.onClick ? undefined : block.link}
            style={{ textDecoration: 'none' }}
            target={block.events?.onClick ? undefined : '_blank'}
            rel={block.events?.onClick ? undefined : 'noopener noreferrer'}
            onClick={(e) => {
              if (block.events?.onClick) {
                e.preventDefault();
              }
            }}
          >
            <Button
              backgroundColor={block.buttonColor || project.theme.accent}
              color="white"
              padding={responsiveStyle.padding || "10px 20px"}
              borderRadius={responsiveStyle.borderRadius || block.style.borderRadius || '4px'}
              cursor="pointer"
              pointerEvents="auto"
              style={{ width: responsiveStyle.width || block.style.width || 'auto' }}
            >
              {block.text}
            </Button>
          </a>
        )
      ) : (
        block.variant === 'radio' ? (
          <label style={{ cursor: 'default', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <input type="radio" disabled style={{ accentColor: project.theme.accent }} />
            <span style={{ color: project.theme.text }}>{block.text}</span>
          </label>
        ) : block.variant === 'checkbox' ? (
          <label style={{ cursor: 'default', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <input type="checkbox" disabled style={{ accentColor: project.theme.accent }} />
            <span style={{ color: project.theme.text }}>{block.text}</span>
          </label>
        ) : (
          <Button
            as="div"
            backgroundColor={block.buttonColor || project.theme.accent}
            color="white"
            padding={responsiveStyle.padding || "10px 20px"}
            borderRadius={responsiveStyle.borderRadius || block.style.borderRadius || '4px'}
            cursor="default"
            pointerEvents="none"
            style={{ width: responsiveStyle.width || block.style.width || 'auto' }}
          >
            {block.text}
          </Button>
        )
      )}
      {!isPreview && (
        <Box
          className="delete-btn"
          position="absolute"
          top="5px"
          right="5px"
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

