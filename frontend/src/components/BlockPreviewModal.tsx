import {
  Dialog,
  Button,
  VStack,
  Text,
  Badge,
  HStack,
  Box,
} from '@chakra-ui/react';
import { useLibraryStore } from '../store/useLibraryStore';
import { useProjectStore } from '../store/useProjectStore';
import { BlockRenderer } from './blocks/BlockRenderer';
import { useNavigate } from 'react-router-dom';

interface BlockPreviewModalProps {
  blockId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const BlockPreviewModal = ({ blockId, isOpen, onClose }: BlockPreviewModalProps) => {
  const { systemBlocks, communityBlocks, userBlocks } = useLibraryStore();
  const { addTemplateBlocks, project, currentProjectId } = useProjectStore();
  const navigate = useNavigate();

  const allBlocks = [...systemBlocks, ...communityBlocks, ...userBlocks];
  const block = allBlocks.find((b) => b.id === blockId);

  if (!block) {
    return null;
  }

  const handleAddToProject = () => {
    if (block.blocks.length > 0) {
      addTemplateBlocks(block.blocks);
      onClose();
      navigate(currentProjectId ? `/editor/${currentProjectId}` : '/editor');
    }
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details) => {
        if (!details.open) onClose();
      }}
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content maxW="4xl" w="100%" maxH="80vh" overflowY="auto" p="6" backgroundColor="var(--app-surface)" border="1px solid var(--app-border)" color="inherit">
          <Dialog.Title>
            Предпросмотр блока
          </Dialog.Title>
          <Dialog.Description>
            Ознакомьтесь с блоком и добавьте его в проект
          </Dialog.Description>
        <Button
          variant="ghost"
          position="absolute"
          top="3"
          right="3"
          onClick={onClose}
        >
          ✕
        </Button>
        <VStack gap="8px" align="stretch">
          <VStack gap="8px" align="stretch">
            <Text fontSize="xl" fontWeight="bold">
              {block.name}
            </Text>
            <HStack gap="8px">
              <Badge fontSize="10px" border="1px solid var(--app-border)" backgroundColor="var(--app-surface)" color="inherit">{block.category}</Badge>
              {block.isCustom && <Badge fontSize="10px" border="1px solid var(--app-border)" backgroundColor="var(--app-surface)" color="inherit">Мой блок</Badge>}
              {block.tags && block.tags.length > 0 && (
                <HStack gap="4px">
                  {block.tags.map((tag) => (
                    <Badge key={tag} fontSize="10px" border="1px solid var(--app-border)" backgroundColor="var(--app-surface)" color="inherit">
                      {tag}
                    </Badge>
                  ))}
                </HStack>
              )}
            </HStack>
          </VStack>

          <VStack gap="16px" align="stretch">
            {block.description && (
              <Text color="var(--app-text-muted)">{block.description}</Text>
            )}

            <Box
              padding="24px"
              backgroundColor="var(--app-bg-muted)"
              borderRadius="12px"
              border="1px solid"
              borderColor="var(--app-border)"
            >
              <Text mb="12px" fontWeight="medium" fontSize="14px" color="inherit">
                Предпросмотр
              </Text>
              <Box display="flex" justifyContent="center">
                <Box
                  width={{ base: '100%', md: '860px' }}
                  padding="16px"
                  backgroundColor={project.theme.background}
                  borderRadius="10px"
                  border="1px solid"
                  borderColor="var(--app-border)"
                  boxShadow="sm"
                >
                  {block.blocks.map((b, idx) => (
                    <Box key={b.id} mb={idx !== block.blocks.length - 1 ? '16px' : 0}>
                      <BlockRenderer block={b} isPreview={true} />
                      {idx !== block.blocks.length - 1 && (
                        <Box height="1px" backgroundColor="var(--app-border)" my="16px" />
                      )}
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>

            <HStack gap="12px" justify="flex-end">
              <Button variant="outline" onClick={onClose} borderColor="var(--app-border)" color="inherit" _hover={{ backgroundColor: 'var(--app-hover)' }}>
                Закрыть
              </Button>
              <Button
                onClick={handleAddToProject}
                backgroundColor="var(--app-accent)"
                color="white"
                _hover={{ backgroundColor: 'var(--app-accent)', opacity: 0.9 }}
              >
                Добавить в проект
              </Button>
            </HStack>
          </VStack>
        </VStack>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};


