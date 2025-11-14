import { Box, Text } from '@chakra-ui/react';
import type { VideoBlock as VideoBlockType } from '../../types';
import { useProjectStore } from '../../store/useProjectStore';
import { useResponsiveStore } from '../../store/useResponsiveStore';
import { getStyleForBreakpoint } from '../../lib/responsiveUtils';

interface VideoBlockProps {
  block: VideoBlockType;
  isSelected: boolean;
  isPreview: boolean;
}

const getYouTubeEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  
  if (url.includes('youtube.com/embed/')) {
    return url;
  }
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }
  
  return null;
};

export const VideoBlock = ({ block, isSelected, isPreview }: VideoBlockProps) => {
  const { selectBlock, deleteBlock, project } = useProjectStore();
  const { currentBreakpoint } = useResponsiveStore();
  const embedUrl = getYouTubeEmbedUrl(block.url);
  
  const responsiveStyle = getStyleForBreakpoint(block.style, currentBreakpoint);

  const handleClick = (e: React.MouseEvent) => {
    if (!isPreview) {
      e.stopPropagation();
      selectBlock(block.id);
    }
  };

  return (
    <Box
      data-block-id={block.id}
      position="relative"
      onClick={handleClick}
      border="1px dashed transparent"
      style={{
        ...block.style,
        padding: responsiveStyle.padding || block.style.padding,
        margin: responsiveStyle.margin || block.style.margin,
        width: responsiveStyle.width || block.style.width,
        boxShadow: isSelected && !isPreview ? `0 0 0 2px ${project.theme.accent}` : 'none',
        cursor: isPreview ? 'default' : 'pointer',
      }}
      borderRadius={responsiveStyle.borderRadius || block.style.borderRadius}
      _hover={{
        border: !isPreview ? '1px dashed var(--app-border)' : 'none',
        '& > .delete-btn': {
          display: !isPreview ? 'block' : 'none',
        },
      }}
    >
      {embedUrl ? (
        <Box
          position="relative"
          paddingBottom="56.25%"
          height="0"
          overflow="hidden"
          borderRadius="inherit"
          maxWidth="100%"
        >
          <iframe
            src={embedUrl}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
            }}
          />
        </Box>
      ) : (
        <Box
          border="2px dashed var(--app-border)"
          padding="40px"
          textAlign="center"
          backgroundColor="var(--app-bg-muted)"
          borderRadius="inherit"
        >
          <Text color="var(--app-text-muted)">Введите YouTube URL в панели свойств</Text>
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

import { Trash2 } from 'lucide-react';


