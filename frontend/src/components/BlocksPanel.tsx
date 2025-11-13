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

const blockTypes: { type: BlockType; label: string; icon: JSX.Element }[] = [
  { type: 'text', label: 'Текст', icon: <TextIcon size={16} /> },
  { type: 'image', label: 'Изображение', icon: <ImageIcon size={16} /> },
  { type: 'button', label: 'Кнопка', icon: <MousePointerClick size={16} /> },
  { type: 'video', label: 'Видео', icon: <VideoIcon size={16} /> },
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
      backgroundColor="white"
      color="black"
      border="1px solid #e0e0e0"
      justifyContent="flex-start"
      cursor="grab"
      _hover={{
        backgroundColor: '#f0f0f0',
        borderColor: '#007bff',
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
      backgroundColor="#f5f5f5"
      borderRight="1px solid #e0e0e0"
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
        backgroundColor={isResizing ? '#cde4ff' : 'transparent'}
        _hover={{ backgroundColor: '#eaf3ff' }}
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
      <HStack gap={0} borderBottom="1px solid #e0e0e0">
        <Button
          variant={activeTab === 'blocks' ? 'solid' : 'ghost'}
          borderRadius="0"
          onClick={() => setActiveTab('blocks')}
          flex="1"
          fontSize="12px"
        >
          <Layers size={16} />
        </Button>
        <Button
          variant={activeTab === 'library' ? 'solid' : 'ghost'}
          borderRadius="0"
          onClick={() => setActiveTab('library')}
          flex="1"
          fontSize="12px"
        >
          <LibraryIcon size={16} />
        </Button>
        <Button
          variant={activeTab === 'theme' ? 'solid' : 'ghost'}
          borderRadius="0"
          onClick={() => setActiveTab('theme')}
          flex="1"
          fontSize="12px"
        >
          <Palette size={16} />
        </Button>
        <Button
          variant={activeTab === 'logic' ? 'solid' : 'ghost'}
          borderRadius="0"
          onClick={() => setActiveTab('logic')}
          flex="1"
          fontSize="12px"
        >
          <Cpu size={16} />
        </Button>
      </HStack>

      <Box flex="1" overflowY="auto" padding="20px">
        {activeTab === 'blocks' && (
          <>
            <Text fontSize="18px" fontWeight="bold" marginBottom="20px">
              Базовые блоки
            </Text>
              <VStack gap="10px" align="stretch">
                {blockTypes.map(({ type, label, icon }) => (
                  <DraggableBlockButton key={type} type={type} label={label} icon={icon} />
                ))}
              </VStack>
          </>
        )}

        {activeTab === 'library' && (
          <VStack gap="12px" align="stretch">
            <Text fontSize="18px" fontWeight="bold">Библиотека блоков</Text>
            <Button onClick={() => navigate('/library')} colorScheme="orange" size="sm">
                          <HStack gap="6px">
                            <span>📚</span>
                            <Box as="span">Все</Box>
                          </HStack>
                        </Button>
            <Input
              placeholder="Поиск по названию, описанию или категории..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="sm"
              backgroundColor="white"
            />

            <HStack gap="4px">
              <Button size="xs" variant={activeLibraryTab === 'system' ? 'solid' : 'ghost'} onClick={() => setActiveLibraryTab('system')}>Системные ({systemBlocks.length})</Button>
              <Button size="xs" variant={activeLibraryTab === 'community' ? 'solid' : 'ghost'} onClick={() => setActiveLibraryTab('community')}>Сообщество ({communityBlocks.length})</Button>
              <Button size="xs" variant={activeLibraryTab === 'user' ? 'solid' : 'ghost'} onClick={() => setActiveLibraryTab('user')}>Мои ({userBlocks.length})</Button>
            </HStack>

            {(() => {
              const filter = (list: LibraryBlock[]) => list.filter((block) =>
                block.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                block.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                block.category.toLowerCase().includes(searchQuery.toLowerCase())
              );
              const source = activeLibraryTab === 'system' ? filter(systemBlocks) : activeLibraryTab === 'community' ? filter(communityBlocks) : filter(userBlocks);
              if (source.length === 0) {
                return <Text fontSize="14px" color="#666" textAlign="center" padding="12px">Блоки не найдены</Text>;
              }
              return (
                <SimpleGrid columns={1} gap="12px">
                  {source.map((block) => (
                    <BlockCard
                      key={block.id}
                      block={block}
                      draggable
                      onSelect={() => {
                        if (block.blocks && block.blocks.length > 0) {
                          addTemplateBlocks(block.blocks);
                        }
                      }}
                    />
                  ))}
                </SimpleGrid>
              );
            })()}
          </VStack>
        )}

        {activeTab === 'theme' && (
          <VStack gap="16px" align="stretch">
            <Text fontSize="18px" fontWeight="bold">Тема проекта</Text>
            <HStack gap="12px">
              <label>
                <input
                  type="radio"
                  name="theme-mode"
                  checked={project.theme.mode === 'light'}
                  onChange={() => updateTheme({ mode: 'light' })}
                />{' '}
                Светлая
              </label>
              <label>
                <input
                  type="radio"
                  name="theme-mode"
                  checked={project.theme.mode === 'dark'}
                  onChange={() => updateTheme({ mode: 'dark' })}
                />{' '}
                Тёмная
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={project.theme.mode === 'dark'}
                  onChange={(e) => updateTheme({ mode: e.target.checked ? 'dark' : 'light' })}
                />{' '}
                Темный режим
              </label>
            </HStack>
            <VStack gap="10px" align="stretch">
              <HStack justify="space-between">
                <Text>Акцент</Text>
                <Input type="color" value={project.theme.accent} onChange={(e) => updateTheme({ accent: e.target.value })} width="60px" padding={0} />
              </HStack>
              <HStack justify="space-between">
                <Text>Текст</Text>
                <Input type="color" value={project.theme.text} onChange={(e) => updateTheme({ text: e.target.value })} width="60px" padding={0} />
              </HStack>
              <HStack justify="space-between">
                <Text>Заголовки</Text>
                <Input type="color" value={project.theme.heading} onChange={(e) => updateTheme({ heading: e.target.value })} width="60px" padding={0} />
              </HStack>
              <HStack justify="space-between">
                <Text>Фон страницы</Text>
                <Input type="color" value={project.theme.background} onChange={(e) => updateTheme({ background: e.target.value })} width="60px" padding={0} />
              </HStack>
              <HStack justify="space-between">
                <Text>Поверхность панелей</Text>
                <Input type="color" value={project.theme.surface} onChange={(e) => updateTheme({ surface: e.target.value })} width="60px" padding={0} />
              </HStack>
              <HStack justify="space-between">
                <Text>Цвет границ</Text>
                <Input type="color" value={project.theme.border} onChange={(e) => updateTheme({ border: e.target.value })} width="60px" padding={0} />
              </HStack>
            </VStack>
          </VStack>
        )}

        {activeTab === 'logic' && (
          <VStack gap="12px" align="stretch">
            <HStack justify="space-between" marginBottom="8px">
              <Text fontSize="18px" fontWeight="bold">
                Функции
              </Text>
              <Button size="sm" colorScheme="blue" onClick={addFunction}>
                + Создать
              </Button>
            </HStack>

            {functions.length === 0 ? (
              <Text fontSize="14px" color="#666" textAlign="center" padding="20px">
                Нет функций. Создайте первую функцию.
              </Text>
            ) : (
              <VStack gap="8px" align="stretch">
                {functions.map((fn) => (
                  <Box
                    key={fn.id}
                    backgroundColor={selectedFunctionId === fn.id ? '#e3f2fd' : 'white'}
                    border="1px solid #e0e0e0"
                    borderRadius="4px"
                    padding="12px"
                    cursor="pointer"
                    onClick={() => selectFunction(fn.id)}
                    _hover={{ borderColor: '#007bff' }}
                  >
                    <VStack gap="8px" align="stretch">
                      {editingName === fn.id ? (
                        <HStack gap="4px">
                          <Input
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            size="sm"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                if (tempName.trim()) {
                                  updateFunction(fn.id, { name: tempName.trim() });
                                }
                                setEditingName(null);
                                setTempName('');
                              }
                              if (e.key === 'Escape') {
                                setEditingName(null);
                                setTempName('');
                              }
                            }}
                          />
                          <Button
                            size="xs"
                            onClick={() => {
                              if (tempName.trim()) {
                                updateFunction(fn.id, { name: tempName.trim() });
                              }
                              setEditingName(null);
                              setTempName('');
                            }}
                          >
                            ✓
                          </Button>
                          <Button
                            size="xs"
                            onClick={() => {
                              setEditingName(null);
                              setTempName('');
                            }}
                          >
                            ✕
                          </Button>
                        </HStack>
                      ) : (
                        <HStack justify="space-between">
                          <Text
                            fontSize="14px"
                            fontWeight="bold"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingName(fn.id);
                              setTempName(fn.name);
                            }}
                            flex="1"
                            _hover={{ color: '#007bff' }}
                          >
                            {fn.name}
                          </Text>
                          <HStack gap="4px">
                            <input
                              type="checkbox"
                              checked={fn.enabled}
                              onChange={(e) => {
                                e.stopPropagation();
                                updateFunction(fn.id, { enabled: e.target.checked });
                              }}
                            />
                          </HStack>
                        </HStack>
                      )}

                      <select
                        style={{
                          padding: '6px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '4px',
                          fontSize: '12px',
                          backgroundColor: 'white',
                          width: '100%',
                        }}
                        value={fn.trigger}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                          updateFunction(fn.id, { trigger: e.target.value as TriggerType });
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {Object.entries(triggerLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>

                      <select
                        style={{
                          padding: '6px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '4px',
                          fontSize: '12px',
                          backgroundColor: 'white',
                          width: '100%',
                        }}
                        value={fn.blockId || ''}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                          updateFunction(fn.id, { blockId: e.target.value || null });
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="">Глобальная функция</option>
                        {(() => {
                          const blocks: Array<{ id: string; label: string }> = [];
                          const traverse = (block: any, prefix = '') => {
                            const label =
                              prefix +
                              (block.type === 'text'
                                ? '📝 Текст'
                                : block.type === 'image'
                                  ? '🖼️ Изображение'
                                  : block.type === 'button'
                                    ? '🔘 Кнопка'
                                    : block.type === 'video'
                                      ? '🎥 Видео'
                                      : block.type === 'container'
                                        ? '📦 Контейнер'
                                        : block.type === 'grid'
                                          ? '🔳 Сетка'
                                          : 'Блок');
                            blocks.push({ id: block.id, label });
                            if (block.type === 'container' && block.children) {
                              block.children.forEach((child: any) => traverse(child, prefix + '  '));
                            }
                            if (block.type === 'grid' && block.cells) {
                              block.cells.forEach((cell: any, index: number) => {
                                if (cell.block) {
                                  traverse(cell.block, prefix + `  [${index + 1}] `);
                                }
                              });
                            }
                          };
                          project.blocks.forEach((block) => traverse(block));
                          return blocks;
                        })().map((block) => (
                          <option key={block.id} value={block.id}>
                            {block.label}
                          </option>
                        ))}
                      </select>

                      <Text fontSize="12px" color="#666">
                        Действий: {fn.actions.length} | Условий: {fn.conditions.length}
                      </Text>

                      <HStack gap="4px" justify="flex-end">
                        <Button
                          size="xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateFunction(fn.id);
                          }}
                        >
                          📋
                        </Button>
                        <Button
                          size="xs"
                          colorScheme="red"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Вы уверены, что хотите удалить эту функцию?')) {
                              deleteFunction(fn.id);
                            }
                          }}
                        >
                          🗑️
                        </Button>
                      </HStack>
                    </VStack>
                  </Box>
                ))}
              </VStack>
            )}
          </VStack>
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

