import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Box, Flex, ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { useProjectStore } from './store/useProjectStore';
import { useTemplatesStore } from './store/useTemplatesStore';
import { useFunctionsStore } from './store/useFunctionsStore';
import { Toolbar } from './components/Toolbar';
import { BlocksPanel } from './components/BlocksPanel';
import { Workspace } from './components/Workspace';
import { PropertiesPanel } from './components/PropertiesPanel';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { DndProvider } from './components/DndProvider';
import { RoomConnection } from './components/RoomConnection';
import { useWebSocketSync } from './lib/useWebSocketSync';
import { GeneratePage } from './pages/GeneratePage';
import { LibraryPage } from './pages/LibraryPage';
import { AddBlockPage } from './pages/AddBlockPage';
import { AuthLoginPage } from './pages/AuthLoginPage';
import { AuthRegisterPage } from './pages/AuthRegisterPage';
import { AuthChangePasswordPage } from './pages/AuthChangePasswordPage';
import { ProfilePage } from './pages/ProfilePage';
import { useAuthStore } from './store/useAuthStore';

function EditorLayout() {
  const { id } = useParams<{ id?: string }>();
  const { loadFromLocalStorage, isPreviewMode, loadProjectFromApi, currentProjectId } = useProjectStore();
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

  if (isPreviewMode) {
    // Режим предпросмотра - только контент без панелей
    return (
      <Box minHeight="100vh" display="flex" flexDirection="column">
        <Header />
        <Workspace />
        <Footer />
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
          <Box flex="1" display="flex" flexDirection="column" overflow="hidden">
            <Header />
            <Workspace />
            <Footer />
          </Box>
          <PropertiesPanel />
        </Flex>
      </Box>
    </DndProvider>
  );
}

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { token } = useAuthStore();
  if (!token) {
    return <Navigate to="/auth/login" replace />;
  }
  return children;
}

function App() {
  return (
    <ChakraProvider value={defaultSystem}>
      <BrowserRouter>
        <Routes>
          <Route path="/editor" element={<PrivateRoute><EditorLayout /></PrivateRoute>} />
          <Route path="/editor/:id" element={<PrivateRoute><EditorLayout /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path="/generate" element={<GeneratePage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/library/add" element={<AddBlockPage />} />
          <Route path="/auth/login" element={<AuthLoginPage />} />
          <Route path="/auth/register" element={<AuthRegisterPage />} />
          <Route path="/auth/change-password" element={<AuthChangePasswordPage />} />
          <Route path="/" element={<Navigate to="/editor" replace />} />
        </Routes>
      </BrowserRouter>
    </ChakraProvider>
  );
}

export default App;
