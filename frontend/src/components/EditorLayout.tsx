import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Flex } from '@chakra-ui/react';
import { useProjectStore } from '../store/useProjectStore';
import { useTemplatesStore } from '../store/useTemplatesStore';
import { useFunctionsStore } from '../store/useFunctionsStore';
import { Toolbar } from './Toolbar';
import { BlocksPanel } from './BlocksPanel';
import { Workspace } from './Workspace';
import { PropertiesPanel } from './PropertiesPanel';
import { HeaderEditor } from './Header';
import { Footer } from './Footer';
import { DndProvider } from './DndProvider';
import { RoomConnection } from './RoomConnection';
import { useWebSocketSync } from '../lib/useWebSocketSync';

export function EditorLayout() {
  const { id } = useParams<{ id?: string }>();
  const { loadFromLocalStorage, isPreviewMode, loadProjectFromApi, currentProjectId, project } = useProjectStore();
  const { loadFromLocalStorage: loadTemplates } = useTemplatesStore();
  const { loadFromLocalStorage: loadFunctions } = useFunctionsStore();
  
  // Инициализация синхронизации через WebSocket
  useWebSocketSync();

  useEffect(() => {
    // Если есть ID в URL, загружаем проект с сервера
    if (id) {
      const projectId = parseInt(id, 10);
      if (!isNaN(projectId)) {
        loadProjectFromApi(projectId);
      }
    } else {
      // Иначе загружаем из LocalStorage
      loadFromLocalStorage();
    }
    // Загружаем шаблоны из LocalStorage при старте
    loadTemplates();
    // Загружаем функции из LocalStorage при старте
    loadFunctions();
  }, [id, loadFromLocalStorage, loadTemplates, loadFunctions, loadProjectFromApi]);

  const themeVars = {
    '--app-accent': project.theme.accent,
    '--app-surface': project.theme.surface,
    '--app-border': project.theme.border,
    '--app-bg-muted': project.theme.background,
    colorScheme: project.theme.mode === 'dark' ? 'dark' : 'light',
  } as React.CSSProperties;

  if (isPreviewMode) {
    // Режим предпросмотра - только контент без панелей
    return (
      <Box minHeight="100vh" display="flex" flexDirection="column">
        <Box style={themeVars}>
        <HeaderEditor />
          <Workspace />
          <Footer />
        </Box>
      </Box>
    );
  }

  // Режим редактора - все панели
  return (
    <DndProvider>
      <Box minHeight="100vh" display="flex" flexDirection="column">
        <RoomConnection />
        <Toolbar />
        <Flex flex="1" overflow="hidden">
          <BlocksPanel />
          <Box flex="1" display="flex" flexDirection="column" overflow="hidden" style={themeVars}>
            <HeaderEditor />
            <Workspace />
            <Footer />
          </Box>
          <PropertiesPanel />
        </Flex>
      </Box>
    </DndProvider>
  );
}



