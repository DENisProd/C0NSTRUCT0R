import { Box, HStack, Button, Input, Popover, Text, VStack } from '@chakra-ui/react';
import { useRef, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProjectStore } from '../store/useProjectStore';
import { useFunctionsStore } from '../store/useFunctionsStore';
import { useTemplatesStore } from '../store/useTemplatesStore';
import { useResponsiveStore } from '../store/useResponsiveStore';
import { BreakpointSelector } from './toolbar/BreakpointSelector';
import { ToolbarActions } from './toolbar/ToolbarActions';
import { AIGenerateButton } from './toolbar/AIGenerateButton';
import { exportProjectToJSON, importProjectFromJSON } from '../lib/projectImportExport';
import { useWebSocketStore } from '../store/useWebSocketStore';
import { Play } from 'lucide-react';

export const Toolbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { project, setPreviewMode, isPreviewMode, setProject, saveToApi } =
    useProjectStore();
  const { functions, setFunctions } = useFunctionsStore();
  const { templates, importCustomTemplates } = useTemplatesStore();
  const { currentBreakpoint, setBreakpoint } = useResponsiveStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { users, roomId, isConnected, disconnect } = useWebSocketStore();

  const [globalMode, setGlobalMode] = useState<'light' | 'dark'>('light');

  const applyGlobalTheme = (mode: 'light' | 'dark') => {
    const root = document.documentElement;
    const isDark = mode === 'dark';
    const vars = isDark
      ? {
          '--app-bg-muted': '#0f1216',
          '--app-surface': '#343a40',
          '--app-border': '#495057',
          '--app-text-muted': '#9aa1a9',
          '--app-accent': '#ffc107',
          '--app-success': '#00CE5F',
          '--app-hover': '#2b2f36',
          '--app-selected': '#233043',
          '--app-resize': '#274060',
          bodyBg: '#212529',
          bodyColor: '#ededed',
        }
      : {
          '--app-bg-muted': '#F4F6FA',
          '--app-surface': '#ffffff',
          '--app-border': '#DCDEE1',
          '--app-text-muted': '#666666',
          '--app-accent': '#4200FF',
          '--app-success': '#00CE5F',
          '--app-hover': '#eaf3ff',
          '--app-selected': '#e3f2fd',
          '--app-resize': '#cde4ff',
          bodyBg: '#ffffff',
          bodyColor: '#213547',
        };

    Object.entries(vars).forEach(([key, value]) => {
      if (key.startsWith('--')) {
        root.style.setProperty(key, value);
      }
    });
    root.style.colorScheme = isDark ? 'dark' : 'light';
    document.body.style.backgroundColor = vars.bodyBg;
    document.body.style.color = vars.bodyColor;
    localStorage.setItem('global-theme-mode', mode);
    setGlobalMode(mode);
  };

  useEffect(() => {
    const saved = (localStorage.getItem('global-theme-mode') as 'light' | 'dark') || 'light';
    applyGlobalTheme(saved);
  }, []);

  const handleSave = async () => {
    try {
      await saveToApi();
      window.alert('Изменения сохранены');
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      window.alert(
        'Не удалось сохранить изменения на сервер. Изменения сохранены локально.'
      );
    }
  };

  const handlePreview = () => {
    setPreviewMode(!isPreviewMode);
  };

  const handleProjectNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProject({ ...project, projectName: e.target.value });
  };

  const handleExportJSON = () => {
    try {
      exportProjectToJSON(project, functions, templates);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Не удалось экспортировать проект в JSON');
    }
  };

  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  const handleImportJSON: React.ChangeEventHandler<HTMLInputElement> = async (
    e
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { project: importedProject, functions: importedFunctions, templates: importedTemplates } =
        await importProjectFromJSON(file);

      if (importedProject) {
        setProject(importedProject);
      }
      if (Array.isArray(importedFunctions)) {
        setFunctions(importedFunctions);
      }
      if (Array.isArray(importedTemplates)) {
        importCustomTemplates(importedTemplates);
      }
      window.alert('Проект успешно импортирован из JSON');
      e.target.value = '';
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : 'Не удалось импортировать проект из JSON'
      );
    }
  };

  return (
    <Box
      height="60px"
      backgroundColor="var(--app-surface)"
      borderBottom="1px solid var(--app-border)"
      padding="0 20px"
      display="flex"
      alignItems="center"
      justifyContent="space-between"
    >
      <Input
        value={project.projectName}
        onChange={handleProjectNameChange}
        fontSize="18px"
        fontWeight="bold"
        border="none"
        width="auto"
        minWidth="200px"
        _focus={{ border: '1px solid var(--app-accent)' }}
      />
      <HStack gap="10px">
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input
            type="checkbox"
            checked={globalMode === 'dark'}
            onChange={(e) => applyGlobalTheme(e.target.checked ? 'dark' : 'light')}
          />
          <Box as="span" fontSize="12px">Тёмная тема сервиса</Box>
        </label>
        {location.pathname.startsWith('/editor') && (
          <>
            <BreakpointSelector
              currentBreakpoint={currentBreakpoint}
              setBreakpoint={setBreakpoint}
            />
            <AIGenerateButton onClick={() => navigate('/generate')} />
            <Button
              onClick={handlePreview}
              size="sm"
              backgroundColor="var(--app-accent)"
              color="white"
              _hover={{ backgroundColor: 'var(--app-accent)', opacity: 0.9 }}
            >
              <HStack gap="6px">
                <Play size={16} />
              </HStack>
            </Button>
            <Popover.Root>
              <Popover.Trigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  borderColor="var(--app-accent)"
                  color="var(--app-accent)"
                  _hover={{ borderColor: 'var(--app-accent)', backgroundColor: 'var(--app-hover)' }}
                >
                  <HStack gap="6px">
                    <Box as="span">Участники ({users.length})</Box>
                  </HStack>
                </Button>
              </Popover.Trigger>
              <Popover.Positioner>
                <Popover.Content padding="12px">
                  <VStack gap="8px" align="stretch">
                    <Text fontSize="12px" fontWeight="bold">Участники ({users.length}):</Text>
                    <VStack gap="4px" align="stretch" maxHeight="200px" overflowY="auto">
                      {users.map((user) => (
                        <HStack key={user.id} gap="8px">
                          <Box
                            width="8px"
                            height="8px"
                            borderRadius="50%"
                            backgroundColor="var(--app-accent)"
                          />
                          <Text fontSize="12px">{user.name}</Text>
                        </HStack>
                      ))}
                    </VStack>
                    <HStack gap="8px" justifyContent="flex-end">
                      <Button size="sm" variant="outline">Закрыть</Button>
                      <Button size="sm" colorScheme="red" onClick={() => { disconnect(); }}>Отключиться</Button>
                    </HStack>
                  </VStack>
                </Popover.Content>
              </Popover.Positioner>
            </Popover.Root>
          </>
        )}
        <ToolbarActions
          isPreviewMode={isPreviewMode}
          onPreview={handlePreview}
          onNavigateToProfile={() => navigate('/profile')}
          onExportJSON={handleExportJSON}
          onImportJSON={handleImportJSON}
          fileInputRef={fileInputRef}
          onTriggerImport={triggerImport}
        />
      </HStack>

    </Box>
  );
};
