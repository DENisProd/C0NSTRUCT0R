import { Box, HStack, Image, Text, Button } from '@chakra-ui/react';
import { useProjectStore } from '../store/useProjectStore';
import { useNavigate, useLocation } from 'react-router-dom';
import { User } from 'lucide-react';

export const Header = () => {
  const { project, selectBlock, isPreviewMode } = useProjectStore();
  const { header } = project;
  const navigate = useNavigate();
  const location = useLocation();
  const isEditorPage = location.pathname.startsWith('/editor');

  const handleClick = () => {
    if (!isPreviewMode) {
      selectBlock('header');
    }
  };

  return (
    <Box
      backgroundColor={header.backgroundColor || '#ffffff'}
      color={header.textColor || '#000000'}
      padding="15px 20px"
      borderBottom="1px solid #e0e0e0"
      cursor={isPreviewMode ? 'default' : 'pointer'}
      onClick={handleClick}
      _hover={{
        outline: !isPreviewMode && isEditorPage ? '1px dashed #ccc' : 'none',
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
        {!isEditorPage && (
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
        )}
      </HStack>
    </Box>
  );
};




