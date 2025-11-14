import { Box, VStack, Text, Button, HStack, Input, SimpleGrid } from '@chakra-ui/react';
import { useDraggable } from '@dnd-kit/core';
import { useState, useEffect } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { useTemplatesStore } from '../store/useTemplatesStore';
import { useLayoutStore } from '../store/useLayoutStore';
import { useFunctionsStore } from '../store/useFunctionsStore';
import { useLibraryStore } from '../store/useLibraryStore';
import { getCommunityBlocks, getUserBlocks, type LibraryBlock } from '../lib/api/library';
import { BlockCard } from './BlockCard';
import type { BlockType, TriggerType } from '../types';
import { Text as TextIcon, Image as ImageIcon, MousePointerClick, Video as VideoIcon, Package, Grid3x3, Layers, Library as LibraryIcon, Palette, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TabsHeader } from './blocksPanel/TabsHeader';
import { BlocksTab } from './blocksPanel/BlocksTab';
import { LibraryTab } from './blocksPanel/LibraryTab';
import { ThemeTab } from './blocksPanel/ThemeTab';
import { LogicTab } from './blocksPanel/LogicTab';

const blockTypes: { type: BlockType; label: string; icon: JSX.Element }[] = [
  { type: 'text', label: 'Текст', icon: <TextIcon size={16} /> },
  { type: 'image', label: 'Изображение', icon: <ImageIcon size={16} /> },
  { type: 'button', label: 'Кнопка', icon: <MousePointerClick size={16} /> },
  { type: 'video', label: 'Видео', icon: <VideoIcon size={16} /> },
  { type: 'input', label: 'Текстовое поле', icon: <TextIcon size={16} /> },
  { type: 'container', label: 'Контейнер', icon: <Package size={16} /> },
  { type: 'grid', label: 'Сетка', icon: <Grid3x3 size={16} /> },
];

interface DraggableBlockButtonProps {
  type: BlockType;
  label: string;
  icon: JSX.Element;
}

const DraggableBlockButton = ({ type, label, icon }: DraggableBlockButtonProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `new-block-${type}`,
    data: { type },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  return (
    <Button
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      backgroundColor="var(--app-surface)"
      color="black"
      border="1px solid var(--app-border)"
      justifyContent="flex-start"
      cursor="grab"
      _hover={{
        backgroundColor: 'var(--app-hover)',
        borderColor: 'var(--app-accent)',
      }}
      _active={{
        cursor: 'grabbing',
      }}
    >
      <HStack gap="8px" align="center">
        <Box as="span">{icon}</Box>
        <Text>{label}</Text>
      </HStack>
    </Button>
  );
};

const triggerLabels: Record<TriggerType, string> = {
  onClick: 'При клике',
  onHover: 'При наведении',
  onLoad: 'При загрузке',
  onScroll: 'При скролле',
  onFocus: 'При фокусе',
  onBlur: 'При потере фокуса',
  onChange: 'При изменении',
  onSubmit: 'При отправке формы',
};

export const BlocksPanel = () => {
  const { project, updateTheme, addTemplateBlocks } = useProjectStore();
  const { loadFromLocalStorage, addTemplate, getTemplatesByCategory } = useTemplatesStore();
  const navigate = useNavigate();
  const {
    functions,
    selectedFunctionId,
    addFunction,
    updateFunction,
    deleteFunction,
    duplicateFunction,
    selectFunction,
    loadFromLocalStorage: loadFunctions,
  } = useFunctionsStore();
  const [isOpen, setIsOpen] = useState(false);
  const onClose = () => setIsOpen(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'blocks' | 'library' | 'theme' | 'logic'>('blocks');
  const [editingName, setEditingName] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const { blocksPanelWidth, setBlocksPanelWidth } = useLayoutStore();
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const { systemBlocks, communityBlocks, userBlocks, setSystemBlocks, setCommunityBlocks, setUserBlocks, setLoading, setError } = useLibraryStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLibraryTab, setActiveLibraryTab] = useState<'system' | 'community' | 'user'>('system');

  useEffect(() => {
    loadFromLocalStorage();
    loadFunctions();
    const loadLibrary = async () => {
      setLoading(true);
      try {
        const templatesAll = getTemplatesByCategory();
        const mapped: LibraryBlock[] = templatesAll.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          category: t.category || 'other',
          tags: [],
          author: undefined,
          preview: t.preview,
          blocks: t.blocks,
          isCustom: t.isCustom ?? false,
          createdAt: t.createdAt,
        }));
        const [community, user] = await Promise.all([
          getCommunityBlocks(),
          getUserBlocks(),
        ]);
        setSystemBlocks(mapped);
        setCommunityBlocks(community);
        setUserBlocks(user);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки библиотеки');
      } finally {
        setLoading(false);
      }
    };
    loadLibrary();
  }, [loadFromLocalStorage, loadFunctions]);

  const handleSelectLibraryBlock = (block: LibraryBlock) => {
    if (block.blocks && block.blocks.length > 0) {
      addTemplateBlocks(block.blocks);
    }
  };

  const handleSaveAsTemplate = () => {
    if (!templateName.trim() || selectedBlocks.length === 0) {
      alert('Введите название и выберите блоки');
      return;
    }

    const blocksToSave = project.blocks.filter((block) => selectedBlocks.includes(block.id));
    
    addTemplate({
      name: templateName,
      description: templateDescription,
      category: 'Пользовательские',
      blocks: blocksToSave,
    });

    setTemplateName('');
    setTemplateDescription('');
    setSelectedBlocks([]);
    onClose();
  };

  return (
    <Box
      width={`${blocksPanelWidth}px`}
      height="100vh"
      backgroundColor="var(--app-bg-muted)"
      borderRight="1px solid var(--app-border)"
      display="flex"
      flexDirection="column"
      position="relative"
    >
      <Box
        position="absolute"
        right="-3px"
        top={0}
        height="100%"
        width="6px"
        cursor="col-resize"
        backgroundColor={isResizing ? 'var(--app-resize)' : 'transparent'}
        _hover={{ backgroundColor: 'var(--app-hover)' }}
        onMouseDown={(e) => {
          setIsResizing(true);
          setStartX(e.clientX);
          setStartWidth(blocksPanelWidth);
          const onMouseMove = (ev: MouseEvent) => {
            const delta = ev.clientX - startX;
            setBlocksPanelWidth(startWidth + delta);
          };
          const onMouseUp = () => {
            setIsResizing(false);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
          };
          window.addEventListener('mousemove', onMouseMove);
          window.addEventListener('mouseup', onMouseUp);
        }}
      />
      <TabsHeader activeTab={activeTab} onChange={setActiveTab} />

      <Box flex="1" overflowY="auto" padding="20px">
        {activeTab === 'blocks' && <BlocksTab />}

        {activeTab === 'library' && (
          <LibraryTab
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeLibraryTab={activeLibraryTab}
            setActiveLibraryTab={setActiveLibraryTab}
            systemBlocks={systemBlocks}
            communityBlocks={communityBlocks}
            userBlocks={userBlocks}
            onSelectBlock={handleSelectLibraryBlock}
            onNavigateAll={() => navigate('/library')}
          />
        )}

        {activeTab === 'theme' && (
          <ThemeTab projectTheme={project.theme} updateTheme={updateTheme} />
        )}

        {activeTab === 'logic' && (
          <LogicTab
            functions={functions}
            selectedFunctionId={selectedFunctionId}
            addFunction={addFunction}
            updateFunction={updateFunction}
            deleteFunction={deleteFunction}
            duplicateFunction={duplicateFunction}
            selectFunction={(id) => selectFunction(id)}
          />
        )}
      </Box>

      {isOpen && (
        <Box
          position="fixed"
          top="0"
          left="0"
          width="100vw"
          height="100vh"
          backgroundColor="rgba(0, 0, 0, 0.5)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={1000}
        >
          <Box backgroundColor="white" width="90%" maxWidth="520px" borderRadius="8px" boxShadow="md">
            <HStack padding="16px" borderBottom="1px solid #eee" justify="space-between">
              <Text fontWeight="bold">Сохранить как готовый блок</Text>
              <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
            </HStack>
            <Box padding="16px">
              <VStack gap="16px" align="stretch">
                <Box>
                  <Text fontSize="14px" marginBottom="8px">
                    Название *
                  </Text>
                  <Input
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Например: Hero секция"
                  />
                </Box>
                <Box>
                  <Text fontSize="14px" marginBottom="8px">
                    Описание
                  </Text>
                  <Input
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    placeholder="Краткое описание блока"
                  />
                </Box>
                <Box>
                  <Text fontSize="14px" marginBottom="8px">
                    Выберите блоки для сохранения:
                  </Text>
                  <VStack gap="8px" align="stretch" maxHeight="200px" overflowY="auto">
                    {project.blocks.map((block) => (
                      <HStack key={block.id} gap="8px">
                        <input
                          type="checkbox"
                          checked={selectedBlocks.includes(block.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBlocks([...selectedBlocks, block.id]);
                            } else {
                              setSelectedBlocks(selectedBlocks.filter((id) => id !== block.id));
                            }
                          }}
                        />
                        <Text fontSize="12px">
                          {block.type === 'text' && '📝 Текст'}
                          {block.type === 'image' && '🖼️ Изображение'}
                          {block.type === 'button' && '🔘 Кнопка'}
                          {block.type === 'video' && '🎥 Видео'}
                          {' - '}
                          {block.type === 'text' && (block as any).content?.substring(0, 30)}
                          {block.type === 'button' && (block as any).text}
                          {block.type === 'image' && 'Изображение'}
                          {block.type === 'video' && 'Видео'}
                        </Text>
                      </HStack>
                    ))}
                  </VStack>
                  {project.blocks.length === 0 && (
                    <Text fontSize="12px" color="#999">
                      Нет блоков на странице
                    </Text>
                  )}
                </Box>
              </VStack>
            </Box>
            <HStack padding="16px" borderTop="1px solid #eee" justify="flex-end">
              <Button variant="ghost" onClick={onClose} marginRight="8px">
                Отмена
              </Button>
              <Button onClick={handleSaveAsTemplate} backgroundColor="#007bff" color="white">
                Сохранить
              </Button>
            </HStack>
          </Box>
        </Box>
      )}
    </Box>
  );
};

