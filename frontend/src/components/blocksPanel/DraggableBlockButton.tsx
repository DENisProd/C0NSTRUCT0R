import { Button, HStack, Box, Text } from '@chakra-ui/react';
import { useDraggable } from '@dnd-kit/core';
import type { BlockType } from '../../types';

interface DraggableBlockButtonProps {
  type: BlockType;
  label: string;
  icon: JSX.Element;
}

export const DraggableBlockButton = ({ type, label, icon }: DraggableBlockButtonProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `new-block-${type}`,
    data: { type },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <Button
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      backgroundColor="var(--app-surface)"
      color="black"
      border="1px solid var(--app-border)"
      justifyContent="flex-start"
      cursor="grab"
      _hover={{
        backgroundColor: 'var(--app-hover)',
        borderColor: 'var(--app-accent)',
      }}
      _active={{
        cursor: 'grabbing',
      }}
    >
      <HStack gap="8px" align="center">
        <Box as="span">{icon}</Box>
        <Text>{label}</Text>
      </HStack>
    </Button>
  );
};