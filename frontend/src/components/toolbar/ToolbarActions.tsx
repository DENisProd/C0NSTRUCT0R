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
          <Menu.Positioner>
            <Menu.Content>
              <Menu.Item value="my_profile" onClick={goToProfile}>
                <Box as="span">Мой профиль</Box>
              </Menu.Item>
              <Menu.Item value="projects" onClick={() => goToProfileTab('projects')}>
                <Box as="span">Мои проекты</Box>
              </Menu.Item>
              <Menu.Item value="logout" onClick={handleLogout}>
                <Box as="span">Выйти</Box>
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
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item value="export_json" onClick={onExportJSON}>
              <HStack gap="6px">
                <Download size={16} />
                <Box as="span">Экспорт JSON</Box>
              </HStack>
            </Menu.Item>
            <Menu.Item value="import_json" onClick={onTriggerImport}>
              <HStack gap="6px">
                <Upload size={16} />
                <Box as="span">Импорт JSON</Box>
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

