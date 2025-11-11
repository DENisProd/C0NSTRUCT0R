import { Box, HStack, Button, Input, NativeSelect } from '@chakra-ui/react';
import { useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProjectStore } from '../store/useProjectStore';
import { useFunctionsStore } from '../store/useFunctionsStore';
import { useTemplatesStore } from '../store/useTemplatesStore';
import { useResponsiveStore, type Breakpoint } from '../store/useResponsiveStore';

export const Toolbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { project, saveToLocalStorage, clearProject, setPreviewMode, isPreviewMode, setProject } =
    useProjectStore();
  const { functions, setFunctions } = useFunctionsStore();
  const { templates, importCustomTemplates } = useTemplatesStore();
  const { currentBreakpoint, setBreakpoint } = useResponsiveStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSave = () => {
    saveToLocalStorage();
    window.alert('Изменения сохранены');
  };

  const handleClear = () => {
    if (window.confirm('Вы уверены, что хотите очистить проект?')) {
      clearProject();
      window.alert('Проект очищен');
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
      const customTemplates = (templates || []).filter((t) => t.isCustom);
      const bundle = {
        version: 1,
        exportedAt: Date.now(),
        project,
        functions,
        templates: customTemplates,
      };
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const name = (project?.projectName || 'landing-project').replace(/\s+/g, '-').toLowerCase();
      a.href = url;
      a.download = `${name}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Ошибка экспорта JSON:', error);
      window.alert('Не удалось экспортировать проект в JSON');
    }
  };

  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  const handleImportJSON: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const importedProject = data?.project;
      const importedFunctions = data?.functions || [];
      const importedTemplates = data?.templates || [];

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
      console.error('Ошибка импорта JSON:', error);
      window.alert('Не удалось импортировать проект из JSON');
    }
  };

  return (
    <Box
      height="60px"
      backgroundColor="#ffffff"
      borderBottom="1px solid #e0e0e0"
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
        _focus={{ border: '1px solid #007bff' }}
      />
      <HStack gap="10px">
        {location.pathname === '/editor' && (
          <>
            <Button onClick={() => navigate('/generate')} colorScheme="purple" size="sm">
              <HStack gap="6px">
                <span>🧠</span>
                <Box as="span">Генерация AI</Box>
              </HStack>
            </Button>
            <Button onClick={() => navigate('/library')} colorScheme="orange" size="sm">
              <HStack gap="6px">
                <span>📚</span>
                <Box as="span">Библиотека</Box>
              </HStack>
            </Button>
            <Box>
              <NativeSelect.Root size="sm" width="140px" backgroundColor="#fff">
                <NativeSelect.Field
                  value={currentBreakpoint}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setBreakpoint(e.target.value as Breakpoint)
                  }
                >
                  <option value="desktop">🖥 Desktop</option>
                  <option value="tablet">📱 Tablet</option>
                  <option value="mobile">📱 Mobile</option>
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Box>
          </>
        )}
        <Button onClick={handleSave} colorScheme="blue" size="sm">
          <HStack gap="6px">
            <span>💾</span>
            <Box as="span">Сохранить</Box>
          </HStack>
        </Button>
        <Button onClick={handlePreview} colorScheme={isPreviewMode ? 'gray' : 'green'} size="sm">
          <HStack gap="6px">
            <span>👁</span>
            <Box as="span">{isPreviewMode ? 'Редактор' : 'Предпросмотр'}</Box>
          </HStack>
        </Button>
        <Button onClick={handleExportJSON} colorScheme="blue" size="sm">
          <HStack gap="6px">
            <span>⬇️</span>
            <Box as="span">Экспорт JSON</Box>
          </HStack>
        </Button>
        <Button onClick={triggerImport} colorScheme="teal" size="sm">
          <HStack gap="6px">
            <span>⬆️</span>
            <Box as="span">Импорт JSON</Box>
          </HStack>
        </Button>
        <Input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          display="none"
          onChange={handleImportJSON}
        />
        <Button onClick={handleClear} colorScheme="red" size="sm">
          <HStack gap="6px">
            <span>🧹</span>
            <Box as="span">Очистить</Box>
          </HStack>
        </Button>
      </HStack>
    </Box>
  );
};

