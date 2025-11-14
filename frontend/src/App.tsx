import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { EditorLayout } from './components/EditorLayout';
import { GeneratePage } from './pages/GeneratePage';
import { PreviewPage } from './pages/PreviewPage';
import { LibraryPage } from './pages/LibraryPage';
import { AddBlockPage } from './pages/AddBlockPage';
import { AuthLoginPage } from './pages/AuthLoginPage';
import { AuthRegisterPage } from './pages/AuthRegisterPage';
import { AuthChangePasswordPage } from './pages/AuthChangePasswordPage';
import { ProfilePage } from './pages/ProfilePage';
// import { useAuthStore } from './store/useAuthStore';

function PrivateRoute({ children }: { children: JSX.Element }) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
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
          <Route path="/preview/:id" element={<PreviewPage />} />
          <Route path="/" element={<Navigate to="/editor" replace />} />
        </Routes>
      </BrowserRouter>
    </ChakraProvider>
  );
}

export default App;
