import { Box, Text, IconButton, HStack, VStack } from '@chakra-ui/react';
import { useDraggable } from '@dnd-kit/core';
import type { BlockTemplate } from '../types';
import { useProjectStore } from '../store/useProjectStore';
import { useTemplatesStore } from '../store/useTemplatesStore';

interface TemplateCardProps {
  template: BlockTemplate;
  showDeleteButton?: boolean;
}

export const TemplateCard = ({ template, showDeleteButton = false }: TemplateCardProps) => {
  const { addTemplateBlocks } = useProjectStore();
  const { removeTemplate } = useTemplatesStore();

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `template-${template.id}`,
    data: { templateId: template.id, type: 'template' },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  const handleClick = () => {
    addTemplateBlocks(template.blocks);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (template.isCustom && window.confirm(`Удалить шаблон "${template.name}"?`)) {
      removeTemplate(template.id);
    }
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      border="1px solid #e0e0e0"
      borderRadius="8px"
      padding="12px"
      backgroundColor="white"
      cursor="grab"
      position="relative"
      _hover={{
        borderColor: '#007bff',
        boxShadow: '0 2px 8px rgba(0,123,255,0.2)',
      }}
      _active={{
        cursor: 'grabbing',
      }}
    >
      {showDeleteButton && template.isCustom && (
        <IconButton
          aria-label="Удалить шаблон"
          size="xs"
          position="absolute"
          top="8px"
          right="8px"
          zIndex={10}
          onClick={handleDelete}
          backgroundColor="white"
          _hover={{
            backgroundColor: '#ff4444',
            color: 'white',
          }}
        >
          <span>🗑️</span>
        </IconButton>
      )}
      
      <VStack alignItems="stretch" gap="8px">
        <Box
          minHeight="120px"
          backgroundColor="#f5f5f5"
          borderRadius="4px"
          border="1px solid #e0e0e0"
          position="relative"
          overflow="hidden"
          padding="8px"
        >
          {template.preview ? (
            <img
              src={template.preview}
              alt={template.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Box
              width="100%"
              height="100%"
              border="1px solid #eee"
              borderRadius="8px"
              background="#fafafa"
              display="flex"
              alignItems="center"
              justifyContent="center"
              pointerEvents="none"
            >
              <Text fontSize="12px" color="var(--app-text-muted)">
                {template.name || 'Шаблон'}
              </Text>
            </Box>
          )}
        </Box>

        <VStack alignItems="stretch" gap="4px">
          <HStack justifyContent="space-between" alignItems="flex-start">
            <Text
              fontSize="14px"
              fontWeight="bold"
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
                maxWidth: '100%',
              }}
            >
              {template.name}
            </Text>
            {template.category && (
              <Text fontSize="10px" color="var(--app-text-muted)" backgroundColor="#f0f0f0" padding="2px 6px" borderRadius="4px">
                {template.category}
              </Text>
            )}
          </HStack>
          {template.description && (
            <Text
              fontSize="12px"
              color="var(--app-text-muted)"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: '2',
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {template.description}
            </Text>
          )}
          <Text fontSize="11px" color="var(--app-text-muted)">
            {template.blocks.length} {template.blocks.length === 1 ? 'блок' : 'блоков'}
          </Text>
        </VStack>

        <Box
          as="button"
          onClick={handleClick}
          fontSize="12px"
          padding="6px"
          backgroundColor="var(--app-accent)"
          color="white"
          borderRadius="4px"
          _hover={{
            backgroundColor: 'var(--app-accent)',
            opacity: 0.9,
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          Добавить
        </Box>
      </VStack>
    </Box>
  );
};


