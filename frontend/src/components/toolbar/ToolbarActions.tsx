import { Button, HStack, Menu, Input, Box } from '@chakra-ui/react';
import { Eye, User, Download, Upload, Play } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

interface ToolbarActionsProps {
  isPreviewMode: boolean;
  onPreview: () => void;
  onNavigateToProfile: () => void;
  onExportJSON: () => void;
  onImportJSON: React.ChangeEventHandler<HTMLInputElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onTriggerImport: () => void;
}

export const ToolbarActions = ({
  onNavigateToProfile,
  onExportJSON,
  onImportJSON,
  fileInputRef,
  onTriggerImport,
}: ToolbarActionsProps) => {
  const { token, clear } = useAuthStore();
  const navigate = useNavigate();
  const isAuthed = Boolean(token);

  const handleLogout = () => {
    clear();
    navigate('/auth/login');
  };

  const goToProfile = () => {
    if (onNavigateToProfile) {
      onNavigateToProfile();
    } else {
      navigate('/profile');
    }
  };

  const goToProfileTab = (tab: 'projects' | 'blocks') => {
    navigate(`/profile?tab=${tab}`);
  };

  return (
    <>
      {isAuthed ? (
        <Menu.Root>
          <Menu.Trigger asChild>
            <Button
              variant="outline"
              size="sm"
              borderColor="var(--app-accent)"
              color="var(--app-accent)"
              _hover={{ borderColor: 'var(--app-accent)', backgroundColor: 'var(--app-hover)' }}
            >
              <HStack gap="6px">
                <User size={16} />
                <Box as="span">Профиль</Box>
              </HStack>
            </Button>
          </Menu.Trigger>
          <Menu.Positioner zIndex={30000}>
            <Menu.Content
              padding="12px"
              backgroundColor="var(--app-surface)"
              border="1px solid var(--app-border)"
              color="inherit"
              boxShadow="0 8px 20px rgba(0,0,0,0.2)"
            >
              <Menu.Item value="my_profile" onClick={goToProfile} color="inherit" _hover={{ backgroundColor: 'var(--app-hover)' }}>
                <Box as="span" color="inherit">Мой профиль</Box>
              </Menu.Item>
              <Menu.Item value="projects" onClick={() => goToProfileTab('projects')} color="inherit" _hover={{ backgroundColor: 'var(--app-hover)' }}>
                <Box as="span" color="inherit">Мои проекты</Box>
              </Menu.Item>
              <Menu.Item value="logout" onClick={handleLogout} color="inherit" _hover={{ backgroundColor: 'var(--app-hover)' }}>
                <Box as="span" color="inherit">Выйти</Box>
              </Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Menu.Root>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/auth/login')}
          borderColor="var(--app-accent)"
          color="var(--app-accent)"
          _hover={{ borderColor: 'var(--app-accent)', backgroundColor: 'var(--app-hover)' }}
        >
          <HStack gap="6px">
            <User size={16} />
            <Box as="span">Войти</Box>
          </HStack>
        </Button>
      )}
      <Menu.Root>
        <Menu.Trigger asChild>
          <Button
            variant="outline"
            size="sm"
            borderColor="var(--app-accent)"
            color="var(--app-accent)"
            _hover={{ borderColor: 'var(--app-accent)', backgroundColor: 'var(--app-hover)' }}
          >
            Ещё
          </Button>
        </Menu.Trigger>
        <Menu.Positioner zIndex={30000}>
          <Menu.Content
            padding="12px"
            backgroundColor="var(--app-surface)"
            border="1px solid var(--app-border)"
            color="inherit"
            boxShadow="0 8px 20px rgba(0,0,0,0.2)"
          >
            <Menu.Item value="export_json" onClick={onExportJSON} color="inherit" _hover={{ backgroundColor: 'var(--app-hover)' }}>
              <HStack gap="6px">
                <Download size={16} />
                <Box as="span" color="inherit">Экспорт JSON</Box>
              </HStack>
            </Menu.Item>
            <Menu.Item value="import_json" onClick={onTriggerImport} color="inherit" _hover={{ backgroundColor: 'var(--app-hover)' }}>
              <HStack gap="6px">
                <Upload size={16} />
                <Box as="span" color="inherit">Импорт JSON</Box>
              </HStack>
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Menu.Root>
      <Input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        display="none"
        onChange={onImportJSON}
      />
    </>
  );
};

