import { Box, VStack, Text, Badge, Image, HStack } from '@chakra-ui/react';
import { useDraggable } from '@dnd-kit/core';
import type { LibraryBlock } from '../lib/api/library';

interface BlockCardProps {
  block: LibraryBlock;
  onSelect: () => void;
  draggable?: boolean;
}

export const BlockCard = ({ block, onSelect, draggable = false }: BlockCardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `library-block-${block.id}`,
    data: { libraryBlockId: block.id, type: 'library' },
    disabled: !draggable,
  });

  const style = draggable && transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.6 : 1,
      }
    : undefined;

  return (
    <Box
      ref={draggable ? setNodeRef : undefined}
      style={style}
      {...(draggable ? listeners : {})}
      {...(draggable ? attributes : {})}
      as="button"
      onClick={onSelect}
      backgroundColor="white"
      borderRadius="8px"
      padding="16px"
      border="1px solid"
      borderColor="gray.200"
      cursor={draggable ? 'grab' : 'pointer'}
      transition="all 0.2s"
      _hover={{
        borderColor: 'blue.500',
        boxShadow: 'md',
        transform: 'translateY(-2px)',
      }}
      _active={draggable ? { cursor: 'grabbing' } : undefined}
      textAlign="left"
      width="100%"
    >
      <VStack gap="12px" align="stretch">
        {block.preview ? (
          <Image
            src={block.preview}
            alt={block.name}
            borderRadius="4px"
            height="120px"
            objectFit="cover"
            width="100%"
          />
        ) : (
          <Box
            height="120px"
            backgroundColor="gray.100"
            borderRadius="4px"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text color="gray.400" fontSize="24px">
              📦
            </Text>
          </Box>
        )}

        <VStack gap="4px" align="stretch">
          <Text fontWeight="bold" fontSize="16px" truncate>
            {block.name}
          </Text>
          {block.description && (
            <Text
              fontSize="14px"
              color="gray.600"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical' as any,
                overflow: 'hidden',
              }}
            >
              {block.description}
            </Text>
          )}
        </VStack>

        <HStack gap="8px" flexWrap="wrap">
          <Badge colorScheme="blue" fontSize="10px">
            {block.category}
          </Badge>
          {block.isCustom && (
            <Badge colorScheme="green" fontSize="10px">
              Мой блок
            </Badge>
          )}
        </HStack>
      </VStack>
    </Box>
  );
};

