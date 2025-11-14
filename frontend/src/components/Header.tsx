import { Box, HStack, Image, Text, Button } from '@chakra-ui/react';
import { useProjectStore } from '../store/useProjectStore';
import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';

export const HeaderEditor = () => {
  const { project, selectBlock, isPreviewMode } = useProjectStore();
  const { header } = project;

  const handleClick = () => {
    if (!isPreviewMode) {
      selectBlock('header');
    }
  };

  return (
    <Box
      backgroundColor={project.theme.surface}
      color={project.theme.text}
      padding="15px 20px"
      borderBottom={`1px solid ${project.theme.border}`}
      cursor={!isPreviewMode ? 'pointer' : 'default'}
      onClick={() => {
        if (!isPreviewMode) {
          handleClick();
        }
      }}
      _hover={{
        outline: !isPreviewMode ? `1px dashed ${project.theme.accent}` : 'none',
      }}
    >
      <HStack gap="15px" justifyContent="space-between">
        <HStack gap="15px">
          {header.logoUrl && (
            <Image src={header.logoUrl} alt="Logo" height="40px" objectFit="contain" />
          )}
          <Text fontSize="20px" fontWeight="bold">
            {header.companyName || 'Моя компания'}
          </Text>
        </HStack>
      </HStack>
    </Box>
  );
};

export const HeaderService = () => {
  const { project } = useProjectStore();
  const { header } = project;
  const navigate = useNavigate();

  return (
    <Box
      backgroundColor={'var(--app-surface)'}
      color={'var(--app-text-muted)'}
      padding="15px 20px"
      borderBottom={'1px solid var(--app-border)'}
    >
      <HStack gap="15px" justifyContent="space-between">
        <HStack gap="15px">
          {header.logoUrl && (
            <Image src={header.logoUrl} alt="Logo" height="40px" objectFit="contain" />
          )}
          <Text fontSize="20px" fontWeight="bold">
            {header.companyName || 'Моя компания'}
          </Text>
        </HStack>
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            navigate('/profile');
          }}
        >
          <HStack gap="6px">
            <User size={16} />
            <Box as="span">Профиль</Box>
          </HStack>
        </Button>
      </HStack>
    </Box>
  );
};




