import { Box, HStack, Button, Input, NativeSelect, Menu } from '@chakra-ui/react';
import { Brain, Monitor, Tablet, Smartphone, Save, Eye, Download, Upload, User } from 'lucide-react';
import { useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProjectStore } from '../store/useProjectStore';
import { useFunctionsStore } from '../store/useFunctionsStore';
import { useTemplatesStore } from '../store/useTemplatesStore';
import { useResponsiveStore, type Breakpoint } from '../store/useResponsiveStore';

export const Toolbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { project, saveToLocalStorage, setPreviewMode, isPreviewMode, setProject } =
    useProjectStore();
  const { functions, setFunctions } = useFunctionsStore();
  const { templates, importCustomTemplates } = useTemplatesStore();
  const { currentBreakpoint, setBreakpoint } = useResponsiveStore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const breakpointIcon =
    currentBreakpoint === 'desktop'
      ? <Monitor size={16} />
      : currentBreakpoint === 'tablet'
        ? <Tablet size={16} />
        : <Smartphone size={16} />;

  const { saveToApi } = useProjectStore();

  const handleSave = async () => {
    try {
      await saveToApi();
      window.alert('Изменения сохранены');
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      window.alert('Не удалось сохранить изменения на сервер. Изменения сохранены локально.');
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
            <Box>
              <HStack gap="8px" align="center">
                {breakpointIcon}
                <NativeSelect.Root size="sm" width="140px" backgroundColor="#fff">
                  <NativeSelect.Field
                    value={currentBreakpoint}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setBreakpoint(e.target.value as Breakpoint)
                    }
                  >
                    <option value="desktop">Desktop</option>
                    <option value="tablet">Tablet</option>
                    <option value="mobile">Mobile</option>
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </HStack>
            </Box>
            <Button onClick={() => navigate('/generate')} colorScheme="purple" size="sm">
              <HStack gap="6px">
                <Brain size={16} />
                <Box as="span">Генерация AI</Box>
              </HStack>
            </Button>
          </>
        )}
        <Button onClick={handlePreview} colorScheme={isPreviewMode ? 'gray' : 'green'} size="sm">
          <HStack gap="6px">
            <Eye size={16} />
            <Box as="span">{isPreviewMode ? 'Редактор' : 'Предпросмотр'}</Box>
          </HStack>
        </Button>
        <Button onClick={() => navigate('/profile')} variant="outline" size="sm">
          <HStack gap="6px">
            <User size={16} />
            <Box as="span">Профиль</Box>
          </HStack>
        </Button>
        <Menu.Root>
          <Menu.Trigger asChild>
            <Button variant="outline" size="sm">Ещё</Button>
          </Menu.Trigger>
          <Menu.Positioner>
            <Menu.Content>
              <Menu.Item value="export_json" onClick={handleExportJSON}>
                <HStack gap="6px">
                  <Download size={16} />
                  <Box as="span">Экспорт JSON</Box>
                </HStack>
              </Menu.Item>
              <Menu.Item value="import_json" onClick={triggerImport}>
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
          onChange={handleImportJSON}
        />
      </HStack>
    </Box>
  );
};

