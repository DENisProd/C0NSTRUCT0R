import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Flex } from '@chakra-ui/react';
import { useLayoutStore } from '../store/useLayoutStore';
import { useProjectStore } from '../store/useProjectStore';
import { useTemplatesStore } from '../store/useTemplatesStore';
import { useFunctionsStore } from '../store/useFunctionsStore';
import { useResponsiveStore } from '../store/useResponsiveStore';
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
  const { blocksPanelWidth, propertiesPanelWidth } = useLayoutStore();
  const { loadFromLocalStorage: loadTemplates } = useTemplatesStore();
  const { loadFromLocalStorage: loadFunctions } = useFunctionsStore();
  const { setBreakpoint } = useResponsiveStore();
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Инициализация синхронизации через WebSocket
  useWebSocketSync();

  // Автоматическое определение breakpoint на основе ширины окна
  // В редакторе breakpoint можно переключать вручную, но по умолчанию определяется автоматически
  useEffect(() => {
    const updateBreakpoint = () => {
      // Используем ширину окна для определения breakpoint
      const width = window.innerWidth;
      if (width < 768) {
        setBreakpoint('mobile');
      } else if (width < 1024) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('desktop');
      }
    };

    // Устанавливаем начальный breakpoint
    updateBreakpoint();

    // Слушаем изменения размера окна
    window.addEventListener('resize', updateBreakpoint);

    // Также используем ResizeObserver для более точного отслеживания
    const target = containerRef.current;
    if (target) {
      const resizeObserver = new ResizeObserver(() => {
        updateBreakpoint();
      });
      resizeObserver.observe(target);
      return () => {
        resizeObserver.disconnect();
        window.removeEventListener('resize', updateBreakpoint);
      };
    }

    return () => {
      window.removeEventListener('resize', updateBreakpoint);
    };
  }, [setBreakpoint]);

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
        <Box style={{ ...themeVars, backgroundColor: project.theme.background }}>
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
      <Box ref={containerRef} minHeight="100vh" display="flex" flexDirection="column">
        <RoomConnection />
        <Toolbar />
        <Flex flex="1" overflow="hidden">
          <BlocksPanel />
          <Box
            flex="1"
            display="flex"
            flexDirection="column"
            overflow="hidden"
            style={{
              ...themeVars,
              backgroundColor: project.theme.background,
              marginLeft: `${blocksPanelWidth}px`,
              marginRight: `${propertiesPanelWidth}px`,
            }}
          >
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




