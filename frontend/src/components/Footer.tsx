import { Box, Text } from '@chakra-ui/react';
import { useProjectStore } from '../store/useProjectStore';

export const Footer = () => {
  const { project, selectBlock, isPreviewMode } = useProjectStore();
  const { footer } = project;

  const handleClick = () => {
    if (!isPreviewMode) {
      selectBlock('footer');
    }
  };

  return (
    <Box
      backgroundColor={footer.backgroundColor || 'var(--app-surface)'}
      color={footer.textColor || 'inherit'}
      padding="20px"
      textAlign="center"
      borderTop="1px solid var(--app-border)"
      cursor={isPreviewMode ? 'default' : 'pointer'}
      onClick={handleClick}
      _hover={{
        outline: !isPreviewMode ? '1px dashed var(--app-accent)' : 'none',
      }}
    >
      <Text>{footer.text || '© 2025 My Landing'}</Text>
    </Box>
  );
}




