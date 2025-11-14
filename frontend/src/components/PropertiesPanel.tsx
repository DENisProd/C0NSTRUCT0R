import { Box, VStack, Text, Input, HStack, Button, Badge, NativeSelect } from '@chakra-ui/react';
import { useState } from 'react';
import { Save, Move, PaintBucket, Type as TypeIcon, AlignCenter } from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { useLayoutStore } from '../store/useLayoutStore';
import { useFunctionsStore } from '../store/useFunctionsStore';
import { useResponsiveStore, type Breakpoint } from '../store/useResponsiveStore';
import { isDifferentFromDesktop } from '../lib/responsiveUtils';
import type { Block, GridBlock, TriggerType, ResponsiveStyle, BlockStyle } from '../types';
import { ImageUploader } from './ImageUploader';
import { SaveBlockModal } from './SaveBlockModal';

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

const getAvailableTriggers = (blockType: string): TriggerType[] => {
  switch (blockType) {
    case 'button':
      return ['onClick', 'onHover', 'onFocus', 'onBlur'];
    case 'image':
      return ['onClick', 'onHover', 'onLoad'];
    case 'container':
      return ['onClick', 'onHover', 'onLoad'];
    case 'text':
      return ['onClick', 'onHover'];
    case 'input':
      return ['onChange', 'onFocus', 'onBlur'];
    default:
      return ['onClick', 'onHover', 'onLoad'];
  }
};

export const PropertiesPanel = () => {
  const { project, selectedBlockId, updateBlock, updateHeader, updateFooter, updateGridSettings, updateGridCellAlign, saveToLocalStorage, currentProjectId } = useProjectStore();
  const { functions, addFunction } = useFunctionsStore();
  const { propertiesPanelWidth, setPropertiesPanelWidth } = useLayoutStore();
  const { currentBreakpoint } = useResponsiveStore();
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const [isResponsiveOpen, setIsResponsiveOpen] = useState(false);
  const [isBehaviorOpen, setIsBehaviorOpen] = useState(false);
  const [isSaveBlockModalOpen, setIsSaveBlockModalOpen] = useState(false);
  const [isLayoutOpen, setIsLayoutOpen] = useState(true);
  const [isBackgroundOpen, setIsBackgroundOpen] = useState(true);
  const [isAlignmentOpen, setIsAlignmentOpen] = useState(true);
  const [isTypographyOpen, setIsTypographyOpen] = useState(true);
  
  // Обертка для updateBlock с автоматическим сохранением
  const updateBlockAndSave = (id: string, updates: Parameters<typeof updateBlock>[1]) => {
    updateBlock(id, updates);
    saveToLocalStorage();
  };
  const parseColor = (color: string) => {
    const c = (color || '').trim();
    if (!c) return { r: 255, g: 255, b: 255, a: 1 };
    if (c.startsWith('#')) {
      let hex = c.slice(1);
      if (hex.length === 3) {
        hex = hex.split('').map((ch) => ch + ch).join('');
      }
      if (hex.length === 6) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return { r, g, b, a: 1 };
      }
      if (hex.length === 8) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        const a = parseInt(hex.slice(6, 8), 16) / 255;
        return { r, g, b, a };
      }
    }
    const rgbaMatch = c.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)/i);
    if (rgbaMatch) {
      const r = parseInt(rgbaMatch[1], 10);
      const g = parseInt(rgbaMatch[2], 10);
      const b = parseInt(rgbaMatch[3], 10);
      const a = Math.max(0, Math.min(1, parseFloat(rgbaMatch[4])));
      return { r, g, b, a };
    }
    const rgbMatch = c.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1], 10);
      const g = parseInt(rgbMatch[2], 10);
      const b = parseInt(rgbMatch[3], 10);
      return { r, g, b, a: 1 };
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  };
  const rgbToHex = (r: number, g: number, b: number) =>
    '#' + [r, g, b].map((n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0')).join('');
  const hexToRgb = (hex: string) => {
    const c = hex.trim();
    let h = c.startsWith('#') ? c.slice(1) : c;
    if (h.length === 3) h = h.split('').map((ch) => ch + ch).join('');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return { r, g, b };
  };
  const rgbaString = (r: number, g: number, b: number, a: number) =>
    `rgba(${Math.max(0, Math.min(255, r))},${Math.max(0, Math.min(255, g))},${Math.max(0, Math.min(255, b))},${Math.max(0, Math.min(1, a))})`;
  const getHexFromColor = (color: string) => {
    const { r, g, b } = parseColor(color);
    return rgbToHex(r, g, b);
  };
  const getAlphaFromColor = (color: string) => {
    const { a } = parseColor(color);
    return a;
  };
  const getRgbFromColor = (color: string) => {
    const { r, g, b } = parseColor(color);
    return { r, g, b };
  };
  
  const updateResponsiveProperty = <K extends keyof ResponsiveStyle>(
    blockId: string,
    breakpoint: Breakpoint,
    property: K,
    value: ResponsiveStyle[K] | undefined
  ) => {
    const block = findBlockById(project.blocks, blockId);
    if (!block) return;
    
    const currentResponsive = block.style.responsive || {};
    const breakpointStyle = currentResponsive[breakpoint] || {};
    
    const newBreakpointStyle: ResponsiveStyle = { ...breakpointStyle } as ResponsiveStyle;
    if (value === undefined || value === '') {
      delete (newBreakpointStyle as any)[property];
    } else {
      (newBreakpointStyle as any)[property] = value;
    }
    
    const newResponsive = {
      ...currentResponsive,
      [breakpoint]: Object.keys(newBreakpointStyle).length > 0 ? newBreakpointStyle : undefined,
    };
    
    if (!newResponsive[breakpoint]) {
      delete newResponsive[breakpoint];
    }
    
    updateBlockAndSave(blockId, {
      style: {
        ...block.style,
        responsive: Object.keys(newResponsive).length > 0 ? newResponsive : undefined,
      },
    });
  };
  
  const findBlockById = (blocks: Block[], id: string | null): Block | undefined => {
    if (!id) return undefined;
    for (const b of blocks) {
      if (b.id === id) return b;
      if (b.type === 'container' && (b as any).children) {
        const children = (b as any).children as Block[];
        const childDirect = children.find((c) => c.id === id);
        if (childDirect) return childDirect;
        const deep = findBlockById(children, id);
        if (deep) return deep;
      }
      if (b.type === 'grid') {
        const gb = b as GridBlock;
        for (const cell of gb.cells) {
          const inner = cell?.block;
          if (!inner) continue;
          if (inner.id === id) return inner;
          const deep = findBlockById([inner], id);
          if (deep) return deep;
        }
      }
    }
    return undefined;
  };

  const selectedBlock = findBlockById(project.blocks, selectedBlockId);
  const isHeaderSelected = selectedBlockId === 'header';
  const isFooterSelected = selectedBlockId === 'footer';

  if (!selectedBlock && !isHeaderSelected && !isFooterSelected) {
    return (
      <Box
        width={`${propertiesPanelWidth}px`}
        height="calc(100vh - 60px)"
        backgroundColor="var(--app-surface)"
        borderLeft="1px solid var(--app-border)"
        padding="20px"
        position="fixed"
        top="60px"
        right={0}
        zIndex={60}
        color="inherit"
        boxShadow="0 0 0 1px var(--app-border), 0 8px 20px rgba(0,0,0,0.08)"
      >
        <Box
          position="absolute"
          left="-3px"
          top={0}
          height="100%"
          width="6px"
          cursor="col-resize"
          backgroundColor={isResizing ? 'var(--app-resize)' : 'transparent'}
          _hover={{ backgroundColor: 'var(--app-hover)' }}
          onMouseDown={(e) => {
            setIsResizing(true);
            setStartX(e.clientX);
            setStartWidth(propertiesPanelWidth);
            const onMouseMove = (ev: MouseEvent) => {
              const delta = startX - ev.clientX;
              setPropertiesPanelWidth(startWidth + delta);
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
        <Text color="var(--app-text-muted)">Выберите блок для редактирования</Text>
      </Box>
    );
  }

  return (
    <Box
      width={`${propertiesPanelWidth}px`}
      height="calc(100vh - 60px)"
      backgroundColor="var(--app-surface)"
      borderLeft="1px solid var(--app-border)"
      padding="20px"
      overflowY="auto"
      position="fixed"
      top="60px"
      right={0}
      zIndex={60}
      color="inherit"
      boxShadow="0 0 0 1px var(--app-border), 0 8px 20px rgba(0,0,0,0.08)"
    >
      <Box
        position="absolute"
        left="-3px"
        top={0}
        height="100%"
        width="6px"
        cursor="col-resize"
        backgroundColor={isResizing ? 'var(--app-resize)' : 'transparent'}
        _hover={{ backgroundColor: 'var(--app-hover)' }}
        onMouseDown={(e) => {
          setIsResizing(true);
          setStartX(e.clientX);
          setStartWidth(propertiesPanelWidth);
          const onMouseMove = (ev: MouseEvent) => {
            const delta = startX - ev.clientX;
            setPropertiesPanelWidth(startWidth + delta);
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
      <HStack justify="space-between" marginBottom="20px">
        <Text fontSize="18px" fontWeight="bold">
          Свойства
        </Text>
        {selectedBlock && selectedBlock.type !== 'grid' && (
          <Button
            size="sm"
            variant="outline"
            colorScheme="blue"
            color="inherit"
            borderColor="var(--app-border)"
            _hover={{ backgroundColor: 'var(--app-hover)', borderColor: 'var(--app-accent)' }}
            onClick={() => setIsSaveBlockModalOpen(true)}
          >
            <HStack gap="6px" align="center">
              <Save size={14} />
              <Box as="span">Сохранить блок</Box>
            </HStack>
          </Button>
        )}
      </HStack>
      
      {isHeaderSelected && (
        <VStack gap="15px" align="stretch">
          <Box>
            <Text marginBottom="5px">URL логотипа</Text>
            <Input
              value={project.header.logoUrl || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                updateHeader({ logoUrl: e.target.value });
                saveToLocalStorage();
              }}
              placeholder="https://example.com/logo.png"
              color="inherit"
            />
          </Box>
          <Box>
            <Text marginBottom="5px">Название компании</Text>
            <Input
              value={project.header.companyName || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                updateHeader({ companyName: e.target.value });
                saveToLocalStorage();
              }}
              placeholder="Моя компания"
              color="inherit"
            />
          </Box>
          <Box>
            <Text marginBottom="5px">Цвет фона</Text>
            <Input
              type="color"
              value={project.header.backgroundColor || '#ffffff'}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                updateHeader({ backgroundColor: e.target.value });
                saveToLocalStorage();
              }}
              color="inherit"
            />
          </Box>
          <Box>
            <Text marginBottom="5px">Цвет текста</Text>
            <Input
              type="color"
              value={project.header.textColor || '#000000'}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                updateHeader({ textColor: e.target.value });
                saveToLocalStorage();
              }}
              color="inherit"
            />
          </Box>
        </VStack>
      )}

      {isFooterSelected && (
        <VStack gap="15px" align="stretch">
          <Box>
            <Text marginBottom="5px">Текст</Text>
            <Input
              value={project.footer.text}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                updateFooter({ text: e.target.value });
                saveToLocalStorage();
              }}
              placeholder="© 2025 My Landing"
              color="inherit"
            />
          </Box>
          <Box>
            <Text marginBottom="5px">Цвет фона</Text>
            <Input
              type="color"
              value={project.footer.backgroundColor || '#f5f5f5'}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                updateFooter({ backgroundColor: e.target.value });
                saveToLocalStorage();
              }}
              color="inherit"
            />
          </Box>
          <Box>
            <Text marginBottom="5px">Цвет текста</Text>
            <Input
              type="color"
              value={project.footer.textColor || '#000000'}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                updateFooter({ textColor: e.target.value });
                saveToLocalStorage();
              }}
              color="inherit"
            />
          </Box>
        </VStack>
      )}

      {selectedBlock && (
        <VStack gap="15px" align="stretch">
          {selectedBlock.type === 'grid' && (
            <>
              <Box>
            <Text marginBottom="5px">Колонки</Text>
            <Input
              type="number"
              value={(selectedBlock as GridBlock).settings.columns}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                updateGridSettings(selectedBlock.id, { columns: parseInt(e.target.value || '1', 10) || 1 });
                saveToLocalStorage();
              }}
              min="1"
              color="inherit"
            />
              </Box>
              <Box>
            <Text marginBottom="5px">Ряды</Text>
            <Input
              type="number"
              value={(selectedBlock as GridBlock).settings.rows}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                updateGridSettings(selectedBlock.id, { rows: parseInt(e.target.value || '1', 10) || 1 });
                saveToLocalStorage();
              }}
              min="1"
              color="inherit"
            />
              </Box>
              <Box>
            <Text marginBottom="5px">Отступ по X (px)</Text>
            <Input
              type="number"
              value={(selectedBlock as GridBlock).settings.gapX}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                updateGridSettings(selectedBlock.id, { gapX: parseInt(e.target.value || '0', 10) || 0 });
                saveToLocalStorage();
              }}
              min="0"
              color="inherit"
            />
              </Box>
              <Box>
            <Text marginBottom="5px">Отступ по Y (px)</Text>
            <Input
              type="number"
              value={(selectedBlock as GridBlock).settings.gapY}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                updateGridSettings(selectedBlock.id, { gapY: parseInt(e.target.value || '0', 10) || 0 });
                saveToLocalStorage();
              }}
              min="0"
              color="inherit"
            />
              </Box>
              <Box>
                <Text marginBottom="5px">Границы ячеек</Text>
                <HStack gap="8px">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="checkbox"
                      checked={(selectedBlock as GridBlock).settings.showCellBorders ?? false}
                      onChange={(e) => {
                        updateGridSettings(selectedBlock.id, { showCellBorders: e.target.checked });
                        saveToLocalStorage();
                      }}
                    />
                    <span>Показывать</span>
                  </label>
                  <Input
                    type="color"
                    value={(selectedBlock as GridBlock).settings.cellBorderColor || '#e0e0e0'}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      updateGridSettings(selectedBlock.id, { cellBorderColor: e.target.value });
                      saveToLocalStorage();
                    }}
                    color="inherit"
                  />
                  <Input
                    type="number"
                    min="0"
                    width="80px"
                    value={String((selectedBlock as GridBlock).settings.cellBorderWidth ?? 1)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      updateGridSettings(selectedBlock.id, { cellBorderWidth: parseInt(e.target.value || '1', 10) || 1 });
                      saveToLocalStorage();
                    }}
                    color="inherit"
                  />
                </HStack>
              </Box>
            </>
          )}
          {selectedBlock.type === 'container' && (
            <Box>
              <Text marginBottom="5px">Ширина контейнера</Text>
              <select
                value={selectedBlock.style.width || 'fit-content'}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  updateBlockAndSave(selectedBlock.id, {
                    style: { ...selectedBlock.style, width: e.target.value },
                  })
                }
                style={{
                  padding: '8px',
                  border: '1px solid var(--app-border)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--app-surface)',
                  color: 'inherit',
                }}
              >
                <option value="fit-content">fit-content</option>
                <option value="100%">100%</option>
              </select>
              <Text fontSize="12px" color="var(--app-text-muted)" marginTop="6px">
                При 100% контейнер растягивается до ширины родителя/ячейки сетки.
              </Text>
              <Box marginTop="12px">
                <Text marginBottom="5px">Выравнивание по вертикали</Text>
                <select
                  value={selectedBlock.style.alignItems || 'stretch'}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    updateBlockAndSave(selectedBlock.id, {
                      style: { ...selectedBlock.style, alignItems: e.target.value as BlockStyle['alignItems'] },
                    })
                  }
                style={{
                  padding: '8px',
                  border: '1px solid var(--app-border)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--app-surface)',
                  color: 'inherit',
                }}
              >
                  <option value="stretch">Растянуть</option>
                  <option value="flex-start">Сверху</option>
                  <option value="center">По центру</option>
                  <option value="flex-end">Снизу</option>
                  <option value="baseline">Базовая линия</option>
                </select>
              </Box>
              <Box marginTop="12px">
                <Text marginBottom="5px">Горизонтальное выравнивание</Text>
                <select
                  value={selectedBlock.style.justifyContent || 'flex-start'}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    updateBlockAndSave(selectedBlock.id, {
                      style: { ...selectedBlock.style, justifyContent: e.target.value as BlockStyle['justifyContent'] },
                    })
                  }
                  style={{
                    padding: '8px',
                    border: '1px solid var(--app-border)',
                    borderRadius: '4px',
                    backgroundColor: 'var(--app-surface)',
                    color: 'inherit',
                  }}
                >
                  <option value="flex-start">Слева</option>
                  <option value="center">По центру</option>
                  <option value="flex-end">Справа</option>
                  <option value="space-between">Space-between</option>
                  <option value="space-around">Space-around</option>
                  <option value="space-evenly">Space-evenly</option>
                </select>
              </Box>
            </Box>
          )}
          <Box>
            <Text marginBottom="5px">HTML id</Text>
            <Input
              value={selectedBlock.htmlId || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateBlockAndSave(selectedBlock.id, { htmlId: e.currentTarget.value.trim() || undefined })
              }
              placeholder="Например: hero-section"
              color="inherit"
            />
              <Text fontSize="12px" color="var(--app-text-muted)" marginTop="6px">
                Указывайте уникальный id для прокрутки и связывания функций.
              </Text>
          </Box>
          <Box>
            <HStack justify="space-between" width="100%" marginBottom="12px" cursor="pointer" onClick={() => setIsLayoutOpen((v) => !v)}>
              <HStack gap="8px" align="center">
                <Move size={16} />
                <Text fontSize="16px" fontWeight="bold">Отступы и размеры</Text>
              </HStack>
              <Badge colorScheme="gray">{isLayoutOpen ? 'скрыть' : 'раскрыть'}</Badge>
            </HStack>
            {isLayoutOpen && (
              <>
            <Box>
            <Text marginBottom="5px">Отступ (margin)</Text>
            <Input
              value={selectedBlock.style.margin || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateBlockAndSave(selectedBlock.id, {
                  style: { ...selectedBlock.style, margin: e.target.value },
                })
              }
              placeholder="10px 0"
              color="inherit"
            />
            <HStack gap="8px" marginTop="8px" flexWrap="wrap">
              {['0', '8px', '16px', '24px', '10px 0', '0 auto'].map((val) => (
                <Button
                  key={`mg-${val}`}
                  size="xs"
                  variant="outline"
                  color="inherit"
                  onClick={() =>
                    updateBlockAndSave(selectedBlock.id, {
                      style: { ...selectedBlock.style, margin: val },
                    })
                  }
                >
                  {val}
                </Button>
              ))}
            </HStack>
            <Box borderTop="1px solid var(--app-border)" margin="12px 0" />
          </Box>
          <Box>
            <Text marginBottom="5px">Внутренний отступ (padding)</Text>
            <Input
              value={selectedBlock.style.padding || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateBlockAndSave(selectedBlock.id, {
                  style: { ...selectedBlock.style, padding: e.target.value },
                })
              }
              placeholder="10px"
              color="inherit"
            />
            <Box borderTop="1px solid var(--app-border)" margin="12px 0" />
          </Box>
          {selectedBlock.type !== 'text' && (
            <Box>
            <Text marginBottom="5px">Закругление углов (px)</Text>
            <Input
              type="number"
              value={parseInt(selectedBlock.style.borderRadius || '0')}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateBlockAndSave(selectedBlock.id, {
                  style: { ...selectedBlock.style, borderRadius: `${e.target.value || '0'}px` },
                })
              }
              min="0"
              color="inherit"
            />
              <HStack gap="8px" marginTop="8px" flexWrap="wrap">
                {[0, 4, 8, 12, 16, 24].map((val) => (
                  <Button
                    key={`br-${val}`}
                    size="xs"
                    variant="outline"
                    color="inherit"
                    onClick={() =>
                      updateBlockAndSave(selectedBlock.id, {
                        style: { ...selectedBlock.style, borderRadius: `${val}px` },
                      })
                    }
                  >
                    {val}px
                  </Button>
                ))}
              </HStack>
              <Box borderTop="1px solid var(--app-border)" margin="12px 0" />
            </Box>
          )}
              </>
            )}
          </Box>
          <Box>
            <HStack justify="space-between" width="100%" marginBottom="12px" cursor="pointer" onClick={() => setIsBackgroundOpen((v) => !v)}>
              <HStack gap="8px" align="center">
                <PaintBucket size={16} />
                <Text fontSize="16px" fontWeight="bold">Фон</Text>
              </HStack>
              <Badge colorScheme="gray">{isBackgroundOpen ? 'скрыть' : 'раскрыть'}</Badge>
            </HStack>
            {isBackgroundOpen && (
              <>
            <Text marginBottom="5px">Цвет фона</Text>
                <Input
                  type="color"
                  value={getHexFromColor(selectedBlock.style.backgroundColor || '#ffffff')}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const a = getAlphaFromColor(selectedBlock.style.backgroundColor || '#ffffff');
                    const { r, g, b } = hexToRgb(e.target.value);
                    updateBlockAndSave(selectedBlock.id, {
                      style: { ...selectedBlock.style, backgroundColor: rgbaString(r, g, b, a) },
                    });
                  }}
                  color="inherit"
                />
            {selectedBlock.type === 'container' && (
              <Box marginTop="8px">
                <Text marginBottom="5px">Прозрачность</Text>
                <HStack gap="8px">
                  <Input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(getAlphaFromColor(selectedBlock.style.backgroundColor || '#ffffff') * 100)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const percent = parseInt(e.target.value || '100', 10) || 0;
                      const a = Math.max(0, Math.min(1, percent / 100));
                      const { r, g, b } = getRgbFromColor(selectedBlock.style.backgroundColor || '#ffffff');
                      updateBlockAndSave(selectedBlock.id, {
                        style: { ...selectedBlock.style, backgroundColor: rgbaString(r, g, b, a) },
                      });
                    }}
                  />
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    width="80px"
                    value={String(Math.round(getAlphaFromColor(selectedBlock.style.backgroundColor || '#ffffff') * 100))}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const percent = parseInt(e.target.value || '100', 10) || 0;
                      const a = Math.max(0, Math.min(1, percent / 100));
                      const { r, g, b } = getRgbFromColor(selectedBlock.style.backgroundColor || '#ffffff');
                      updateBlockAndSave(selectedBlock.id, {
                        style: { ...selectedBlock.style, backgroundColor: rgbaString(r, g, b, a) },
                      });
                    }}
                    color="inherit"
                  />
                </HStack>
              </Box>
            )}
            <Box borderTop="1px solid var(--app-border)" margin="12px 0" />
              </>
            )}
          </Box>
          <Box>
            <HStack justify="space-between" width="100%" marginBottom="12px" cursor="pointer" onClick={() => setIsAlignmentOpen((v) => !v)}>
              <HStack gap="8px" align="center">
                <AlignCenter size={16} />
                <Text fontSize="16px" fontWeight="bold">Выравнивание</Text>
              </HStack>
              <Badge colorScheme="gray">{isAlignmentOpen ? 'скрыть' : 'раскрыть'}</Badge>
            </HStack>
            {isAlignmentOpen && (
              <>
            <Text marginBottom="5px">Выравнивание</Text>
            <select
              value={selectedBlock.style.textAlign || 'left'}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                updateBlockAndSave(selectedBlock.id, {
                  style: {
                    ...selectedBlock.style,
                    textAlign: e.target.value as 'left' | 'center' | 'right',
                  },
                })
              }
              style={{
                padding: '8px',
                border: '1px solid var(--app-border)',
                borderRadius: '4px',
                backgroundColor: 'var(--app-surface)',
                color: 'inherit',
              }}
            >
              <option value="left">Слева</option>
              <option value="center">По центру</option>
              <option value="right">Справа</option>
            </select>
            <Box borderTop="1px solid var(--app-border)" margin="12px 0" />
              </>
            )}
          </Box>

          {selectedBlock.type === 'text' && (
            <>
              <HStack justify="space-between" width="100%" marginBottom="12px" cursor="pointer" onClick={() => setIsTypographyOpen((v) => !v)}>
                <HStack gap="8px" align="center">
                  <TypeIcon size={16} />
                  <Text fontSize="16px" fontWeight="bold">Типографика</Text>
                </HStack>
                <Badge colorScheme="gray">{isTypographyOpen ? 'скрыть' : 'раскрыть'}</Badge>
              </HStack>
              {isTypographyOpen && (
                <>
              <Box>
                <Text marginBottom="5px">Цвет текста</Text>
                <Input
                  type="color"
                  value={selectedBlock.style.color || '#000000'}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateBlockAndSave(selectedBlock.id, {
                      style: { ...selectedBlock.style, color: e.target.value },
                    })
                  }
                  color="inherit"
                />
              </Box>
              <Box>
                <Text marginBottom="5px">Размер шрифта</Text>
                <Input
                  value={selectedBlock.style.fontSize || '16px'}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateBlockAndSave(selectedBlock.id, {
                      style: { ...selectedBlock.style, fontSize: e.target.value },
                    })
                  }
                  placeholder="16px"
                  color="inherit"
                />
              </Box>
              <Box>
                <Text marginBottom="5px">Жирность</Text>
                <select
                  value={selectedBlock.style.fontWeight || 'normal'}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    updateBlockAndSave(selectedBlock.id, {
                      style: {
                        ...selectedBlock.style,
                        fontWeight: e.target.value as 'normal' | 'bold',
                      },
                    })
                  }
                  style={{
                    padding: '8px',
                    border: '1px solid var(--app-border)',
                    borderRadius: '4px',
                    backgroundColor: 'var(--app-surface)',
                  }}
                >
                  <option value="normal">Обычный</option>
                  <option value="bold">Жирный</option>
                </select>
              </Box>
                </>
              )}
            </>
          )}

          {selectedBlock.type === 'image' && (
            <>
              <Box>
                <Text marginBottom="5px" fontSize="14px" fontWeight="medium">
                  Изображение
                </Text>
                {currentProjectId ? (
                  <ImageUploader
                    projectId={currentProjectId}
                    currentUrl={selectedBlock.url}
                    currentEtag={selectedBlock.mediaEtag}
                    onImageSelected={(etag, url) => {
                      updateBlock(selectedBlock.id, {
                        mediaEtag: etag,
                        url: undefined,
                      });
                      saveToLocalStorage();
                    }}
                    onRemove={() => {
                      updateBlock(selectedBlock.id, {
                        mediaEtag: undefined,
                        url: undefined,
                      });
                      saveToLocalStorage();
                    }}
                    cropAspectRatio={undefined}
                  />
                ) : (
                  <Box
                    border="1px solid var(--app-border)"
                    borderRadius="8px"
                    padding="12px"
                    backgroundColor="var(--app-bg-muted)"
                  >
                    <Text fontSize="12px" color="var(--app-text-muted)">
                      Сохраните проект для загрузки изображений
                    </Text>
                  </Box>
                )}
              </Box>
              <Box>
                <Text marginBottom="5px">URL изображения (альтернатива)</Text>
                <Input
                  value={selectedBlock.url || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    updateBlock(selectedBlock.id, {
                      url: e.target.value || undefined,
                      mediaEtag: e.target.value ? undefined : selectedBlock.mediaEtag, // Очищаем mediaEtag при использовании URL
                    });
                    saveToLocalStorage();
                  }}
                  placeholder="https://example.com/image.jpg"
                  color="inherit"
                />
                <Text fontSize="12px" color="var(--app-text-muted)" marginTop="6px">
                  Используйте URL, если проект еще не сохранен
                </Text>
              </Box>
              <Box>
                <Text marginBottom="5px">Ширина (%)</Text>
                <Input
                  type="number"
                  value={parseInt(selectedBlock.style.width || '100')}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateBlockAndSave(selectedBlock.id, {
                      style: {
                        ...selectedBlock.style,
                        width: `${e.target.value}%`,
                      },
                    })
                  }
                  min="1"
                  max="100"
                  color="inherit"
                />
              </Box>
            </>
          )}

          {(() => {
            if (!selectedBlock || selectedBlock.type === 'grid') return null;
            for (const b of project.blocks) {
              if (b.type === 'grid') {
                const gb = b as GridBlock;
                const idx = gb.cells.findIndex((c) => c.block && c.block.id === selectedBlock.id);
                if (idx >= 0) {
                  const cell = gb.cells[idx];
                  return (
                    <Box>
                      <Text fontWeight="bold" marginBottom="8px">Выравнивание ячейки</Text>
                      <HStack gap="8px" align="center">
                        <Box>
                          <Text marginBottom="5px">Горизонталь</Text>
                          <select
                            value={cell.justify ?? 'start'}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                              updateGridCellAlign(gb.id, idx, { justify: e.target.value as any });
                              saveToLocalStorage();
                            }}
                          >
                            <option value="start">Слева</option>
                            <option value="center">По центру</option>
                            <option value="end">Справа</option>
                            <option value="stretch">Растянуть</option>
                          </select>
                        </Box>
                        <Box>
                          <Text marginBottom="5px">Вертикаль</Text>
                          <select
                            value={cell.align ?? 'stretch'}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                              updateGridCellAlign(gb.id, idx, { align: e.target.value as any });
                              saveToLocalStorage();
                            }}
                          >
                            <option value="start">Сверху</option>
                            <option value="center">По центру</option>
                            <option value="end">Снизу</option>
                            <option value="stretch">Растянуть</option>
                          </select>
                        </Box>
                      </HStack>
                    </Box>
                  );
                }
              }
            }
            return null;
          })()}

      <Box borderTop="1px solid var(--app-border)" marginY="15px" />
          <Box>
            <HStack justify="space-between" width="100%" marginBottom="12px" cursor="pointer" onClick={() => setIsResponsiveOpen((v) => !v)}>
              <Text fontSize="16px" fontWeight="bold">📱 Адаптивность</Text>
              <Badge colorScheme="gray">{isResponsiveOpen ? 'скрыть' : 'раскрыть'}</Badge>
            </HStack>
            {isResponsiveOpen && (
              <Box>
                <Text fontSize="12px" color="var(--app-text-muted)" marginBottom="12px">
                  Текущий режим: <strong>{currentBreakpoint === 'desktop' ? 'Desktop' : currentBreakpoint === 'tablet' ? 'Tablet' : 'Mobile'}</strong>
                </Text>
                {currentBreakpoint === 'desktop' ? (
                  <Text fontSize="12px" color="var(--app-text-muted)">Переключите устройство на Tablet или Mobile, чтобы настроить адаптивные свойства.</Text>
                ) : (
                  (() => {
                    const breakpoint = currentBreakpoint as Breakpoint;
                    const responsiveStyle = selectedBlock.style.responsive?.[breakpoint] || {};
                    return (
                      <Box marginBottom="20px" padding="12px" backgroundColor="var(--app-bg-muted)" borderRadius="6px">
                        {selectedBlock.type === 'text' && (
                          <Box marginBottom="10px">
                            <HStack justify="space-between" marginBottom="5px">
                              <Text fontSize="13px">Размер шрифта</Text>
                              {isDifferentFromDesktop(selectedBlock.style, breakpoint, 'fontSize') && (
                                <Badge colorScheme="blue" fontSize="10px">Отличается</Badge>
                              )}
                            </HStack>
                            <Input
                              size="sm"
                              value={responsiveStyle.fontSize || ''}
                              onChange={(e) =>
                                updateResponsiveProperty(selectedBlock.id, breakpoint, 'fontSize', e.target.value || undefined)
                              }
                              placeholder={selectedBlock.style.fontSize || '16px'}
                            />
                          </Box>
                        )}
                        <Box marginBottom="10px">
                          <HStack justify="space-between" marginBottom="5px">
                            <Text fontSize="13px">Внутренний отступ</Text>
                            {isDifferentFromDesktop(selectedBlock.style, breakpoint, 'padding') && (
                              <Badge colorScheme="blue" fontSize="10px">Отличается</Badge>
                            )}
                          </HStack>
                          <Input
                            size="sm"
                            value={responsiveStyle.padding || ''}
                            onChange={(e) =>
                              updateResponsiveProperty(selectedBlock.id, breakpoint, 'padding', e.target.value || undefined)
                            }
                            placeholder={selectedBlock.style.padding || '10px'}
                          />
                        </Box>
                        <Box marginBottom="10px">
                          <HStack justify="space-between" marginBottom="5px">
                            <Text fontSize="13px">Внешний отступ</Text>
                            {isDifferentFromDesktop(selectedBlock.style, breakpoint, 'margin') && (
                              <Badge colorScheme="blue" fontSize="10px">Отличается</Badge>
                            )}
                          </HStack>
                          <Input
                            size="sm"
                            value={responsiveStyle.margin || ''}
                            onChange={(e) =>
                              updateResponsiveProperty(selectedBlock.id, breakpoint, 'margin', e.target.value || undefined)
                            }
                            placeholder={selectedBlock.style.margin || '10px 0'}
                          />
                        </Box>
                        <Box marginBottom="10px">
                          <HStack justify="space-between" marginBottom="5px">
                            <Text fontSize="13px">Ширина</Text>
                            {isDifferentFromDesktop(selectedBlock.style, breakpoint, 'width') && (
                              <Badge colorScheme="blue" fontSize="10px">Отличается</Badge>
                            )}
                          </HStack>
                          <Input
                            size="sm"
                            value={responsiveStyle.width || ''}
                            onChange={(e) =>
                              updateResponsiveProperty(selectedBlock.id, breakpoint, 'width', e.target.value || undefined)
                            }
                            placeholder={selectedBlock.style.width || '100%'}
                          />
                        </Box>
                        <Box marginBottom="10px">
                          <HStack justify="space-between" marginBottom="5px">
                            <Text fontSize="13px">Выравнивание</Text>
                            {isDifferentFromDesktop(selectedBlock.style, breakpoint, 'textAlign') && (
                              <Badge colorScheme="blue" fontSize="10px">Отличается</Badge>
                            )}
                          </HStack>
                          <NativeSelect.Root size="sm" color="inherit">
                            <NativeSelect.Field
                              color="inherit"
                              value={responsiveStyle.textAlign || selectedBlock.style.textAlign || 'left'}
                              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                updateResponsiveProperty(
                                  selectedBlock.id,
                                  breakpoint,
                                  'textAlign',
                                  e.target.value !== selectedBlock.style.textAlign
                                    ? (e.target.value as ResponsiveStyle['textAlign'])
                                    : undefined
                                )
                              }
                            >
                              <option value="left">Слева</option>
                              <option value="center">По центру</option>
                              <option value="right">Справа</option>
                            </NativeSelect.Field>
                            <NativeSelect.Indicator />
                          </NativeSelect.Root>
                        </Box>
                        {selectedBlock.type !== 'text' && (
                          <Box marginBottom="10px">
                            <HStack justify="space-between" marginBottom="5px">
                              <Text fontSize="13px">Закругление углов</Text>
                              {isDifferentFromDesktop(selectedBlock.style, breakpoint, 'borderRadius') && (
                                <Badge colorScheme="blue" fontSize="10px">Отличается</Badge>
                              )}
                            </HStack>
                            <Input
                              size="sm"
                              type="number"
                              value={parseInt(responsiveStyle.borderRadius || selectedBlock.style.borderRadius || '0')}
                              onChange={(e) =>
                                updateResponsiveProperty(
                                  selectedBlock.id,
                                  breakpoint,
                                  'borderRadius',
                                  e.target.value !== (selectedBlock.style.borderRadius || '0') ? `${e.target.value}px` : undefined
                                )
                              }
                              placeholder={selectedBlock.style.borderRadius || '0'}
                            />
                          </Box>
                        )}
                        {selectedBlock.type === 'container' && (
                          <>
                            <Box marginBottom="10px">
                              <HStack justify="space-between" marginBottom="5px">
                                <Text fontSize="13px">Направление размещения</Text>
                                {isDifferentFromDesktop(selectedBlock.style, breakpoint, 'flexDirection') && (
                                  <Badge colorScheme="blue" fontSize="10px">Отличается</Badge>
                                )}
                              </HStack>
                              <NativeSelect.Root size="sm" color="inherit">
                                <NativeSelect.Field
                                  color="inherit"
                                  value={responsiveStyle.flexDirection || selectedBlock.style.flexDirection || 'column'}
                                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                    updateResponsiveProperty(
                                      selectedBlock.id,
                                      breakpoint,
                                      'flexDirection',
                                      e.target.value as ResponsiveStyle['flexDirection']
                                    )
                                  }
                                >
                                  <option value="row">Горизонтально (row)</option>
                                  <option value="column">Вертикально (column)</option>
                                  <option value="row-reverse">Горизонтально (обратный)</option>
                                  <option value="column-reverse">Вертикально (обратный)</option>
                                </NativeSelect.Field>
                                <NativeSelect.Indicator />
                              </NativeSelect.Root>
                            </Box>
                            <Box marginBottom="10px">
                              <HStack justify="space-between" marginBottom="5px">
                                <Text fontSize="13px">Вертикальное выравнивание</Text>
                                {isDifferentFromDesktop(selectedBlock.style, breakpoint, 'alignItems') && (
                                  <Badge colorScheme="blue" fontSize="10px">Отличается</Badge>
                                )}
                              </HStack>
                              <NativeSelect.Root size="sm" color="inherit">
                                <NativeSelect.Field
                                  color="inherit"
                                  value={responsiveStyle.alignItems || selectedBlock.style.alignItems || 'stretch'}
                                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                    updateResponsiveProperty(
                                      selectedBlock.id,
                                      breakpoint,
                                      'alignItems',
                                      e.target.value as ResponsiveStyle['alignItems']
                                    )
                                  }
                                >
                                  <option value="stretch">Растянуть</option>
                                  <option value="flex-start">Сверху</option>
                                  <option value="center">По центру</option>
                                  <option value="flex-end">Снизу</option>
                                  <option value="baseline">Базовая линия</option>
                                </NativeSelect.Field>
                                <NativeSelect.Indicator />
                              </NativeSelect.Root>
                            </Box>
                            <Box marginBottom="10px">
                              <HStack justify="space-between" marginBottom="5px">
                                <Text fontSize="13px">Горизонтальное выравнивание</Text>
                                {isDifferentFromDesktop(selectedBlock.style, breakpoint, 'justifyContent') && (
                                  <Badge colorScheme="blue" fontSize="10px">Отличается</Badge>
                                )}
                              </HStack>
                              <NativeSelect.Root size="sm" color="inherit">
                                <NativeSelect.Field
                                  color="inherit"
                                  value={responsiveStyle.justifyContent || selectedBlock.style.justifyContent || 'flex-start'}
                                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                    updateResponsiveProperty(
                                      selectedBlock.id,
                                      breakpoint,
                                      'justifyContent',
                                      e.target.value as ResponsiveStyle['justifyContent']
                                    )
                                  }
                                >
                                  <option value="flex-start">Слева</option>
                                  <option value="center">По центру</option>
                                  <option value="flex-end">Справа</option>
                                  <option value="space-between">Space-between</option>
                                  <option value="space-around">Space-around</option>
                                  <option value="space-evenly">Space-evenly</option>
                                </NativeSelect.Field>
                                <NativeSelect.Indicator />
                              </NativeSelect.Root>
                            </Box>
                            <Box marginBottom="10px">
                              <HStack justify="space-between" marginBottom="5px">
                                <Text fontSize="13px">Перенос элементов</Text>
                                {isDifferentFromDesktop(selectedBlock.style, breakpoint, 'flexWrap') && (
                                  <Badge colorScheme="blue" fontSize="10px">Отличается</Badge>
                                )}
                              </HStack>
                              <NativeSelect.Root size="sm" color="inherit">
                                <NativeSelect.Field
                                  color="inherit"
                                  value={responsiveStyle.flexWrap || selectedBlock.style.flexWrap || 'nowrap'}
                                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                    updateResponsiveProperty(
                                      selectedBlock.id,
                                      breakpoint,
                                      'flexWrap',
                                      e.target.value as ResponsiveStyle['flexWrap']
                                    )
                                  }
                                >
                                  <option value="nowrap">Без переноса</option>
                                  <option value="wrap">С переносом</option>
                                  <option value="wrap-reverse">С переносом (обратный)</option>
                                </NativeSelect.Field>
                                <NativeSelect.Indicator />
                              </NativeSelect.Root>
                            </Box>
                            <Box marginBottom="10px">
                              <HStack justify="space-between" marginBottom="5px">
                                <Text fontSize="13px">Тип отображения</Text>
                                {isDifferentFromDesktop(selectedBlock.style, breakpoint, 'display') && (
                                  <Badge colorScheme="blue" fontSize="10px">Отличается</Badge>
                                )}
                              </HStack>
                              <NativeSelect.Root size="sm" color="inherit">
                                <NativeSelect.Field
                                  color="inherit"
                                  value={responsiveStyle.display || selectedBlock.style.display || 'block'}
                                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                    updateResponsiveProperty(
                                      selectedBlock.id,
                                      breakpoint,
                                      'display',
                                      e.target.value as ResponsiveStyle['display']
                                    )
                                  }
                                >
                                  <option value="block">Блок</option>
                                  <option value="flex">Flex</option>
                                  <option value="grid">Grid</option>
                                </NativeSelect.Field>
                                <NativeSelect.Indicator />
                              </NativeSelect.Root>
                            </Box>
                          </>
                        )}
                      </Box>
                    );
                  })()
                )}
              </Box>
            )}
          </Box>

          {selectedBlock && (
            <Box
              borderTop="1px solid var(--app-border)"
              borderBottom="1px solid var(--app-border)"
              paddingTop="15px"
              paddingBottom="15px"
              marginTop="10px"
              marginBottom="10px"
            >
              <HStack justify="space-between" width="100%" marginBottom="12px" cursor="pointer" onClick={() => setIsBehaviorOpen((v) => !v)}>
                <Text fontSize="16px" fontWeight="bold">Поведение</Text>
                <Badge colorScheme="gray">{isBehaviorOpen ? 'скрыть' : 'раскрыть'}</Badge>
              </HStack>
              {isBehaviorOpen && (
              <VStack gap="12px" align="stretch">
                {getAvailableTriggers(selectedBlock.type).map((trigger) => {
                  const currentFunctionIds = selectedBlock.events?.[trigger] || [];
                  const availableFunctions = functions.filter(
                    (fn) => fn.enabled && fn.trigger === trigger
                  );

                  return (
                    <Box key={trigger}>
                      <Text fontSize="14px" fontWeight="medium" marginBottom="6px">
                        {triggerLabels[trigger]}
                      </Text>
                      <select
                        value={currentFunctionIds[0] || ''}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                          const functionId = e.currentTarget.value;
                          const newEvents = {
                            ...selectedBlock.events,
                            [trigger]: functionId ? [functionId] : [],
                          };
                          if (!newEvents[trigger] || newEvents[trigger]!.length === 0) {
                            delete newEvents[trigger];
                          }
                          updateBlockAndSave(selectedBlock.id, { events: newEvents });
                        }}
                        style={{
                          padding: '8px',
                          border: '1px solid var(--app-border)',
                          borderRadius: '4px',
                          backgroundColor: 'var(--app-surface)',
                          color: 'inherit',
                          fontSize: '14px',
                        }}
                      >
                        <option value="">— Не назначено —</option>
                        {availableFunctions.map((fn) => (
                          <option key={fn.id} value={fn.id}>
                            {fn.name} {fn.description ? `(${fn.description})` : ''}
                          </option>
                        ))}
                      </select>
                      {currentFunctionIds.length > 0 && (
                        <VStack gap="4px" align="stretch" marginTop="6px">
                          {currentFunctionIds.map((functionId) => {
                            const fn = functions.find((f) => f.id === functionId);
                            if (!fn) {
                              return (
                                <Badge key={functionId} colorScheme="red" fontSize="11px" padding="4px 8px">
                                  ⚠️ Функция удалена
                                </Badge>
                              );
                            }
                            return (
                              <HStack key={functionId} justify="space-between" fontSize="12px" color="var(--app-text-muted)">
                                <Text>{fn.name}</Text>
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  onClick={() => {
                                    const newFunctionIds = currentFunctionIds.filter((id) => id !== functionId);
                                    const newEvents = {
                                      ...selectedBlock.events,
                                      [trigger]: newFunctionIds.length > 0 ? newFunctionIds : undefined,
                                    };
                                    if (!newEvents[trigger]) {
                                      delete newEvents[trigger];
                                    }
                                    updateBlockAndSave(selectedBlock.id, { events: newEvents });
                                  }}
                                >
                                  ✕
                                </Button>
                              </HStack>
                            );
                          })}
                        </VStack>
                      )}
                    </Box>
                  );
                })}
                <Button
                  size="sm"
                  colorScheme="blue"
                  variant="outline"
                  color="inherit"
                  onClick={() => {
                    addFunction();
                  }}
                >
                  + Создать новую функцию
                </Button>
              </VStack>
              )}
            </Box>
          )}

          {selectedBlock.type === 'button' && (
            <>
              <Box>
                <Text marginBottom="5px">Текст кнопки</Text>
                <Input
                  value={selectedBlock.text}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    updateBlock(selectedBlock.id, { text: e.target.value });
                    saveToLocalStorage();
                  }}
                  placeholder="Кнопка"
                  color="inherit"
                />
              </Box>
              <Box>
                <Text marginBottom="5px">Тип кнопки</Text>
                <select
                  value={selectedBlock.variant || 'solid'}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    updateBlock(selectedBlock.id, { variant: e.target.value as any });
                    saveToLocalStorage();
                  }}
                  style={{
                    padding: '8px',
                    border: '1px solid var(--app-border)',
                    borderRadius: '4px',
                    backgroundColor: 'var(--app-surface)',
                    color: 'inherit',
                  }}
                >
                  <option value="solid">Обычная</option>
                  <option value="radio">Радио</option>
                  <option value="checkbox">Чекбокс</option>
                </select>
              </Box>
              <Box>
                <Text marginBottom="5px">Ссылка</Text>
                <Input
                  value={selectedBlock.link}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    updateBlock(selectedBlock.id, { link: e.target.value });
                    saveToLocalStorage();
                  }}
                  placeholder="#"
                  color="inherit"
                />
              </Box>
              <Box>
                <Text marginBottom="5px">Цвет кнопки</Text>
                <Input
                  type="color"
                  value={selectedBlock.buttonColor || project.theme.accent}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    updateBlock(selectedBlock.id, { buttonColor: e.target.value });
                    saveToLocalStorage();
                  }}
                  color="inherit"
                />
              </Box>
            </>
          )}

          {selectedBlock.type === 'video' && (
            <>
              <Box>
                <Text marginBottom="5px">YouTube URL</Text>
                <Input
                  value={selectedBlock.url}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    updateBlock(selectedBlock.id, { url: e.target.value });
                    saveToLocalStorage();
                  }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  color="inherit"
                />
              </Box>
              <Box>
                <Text marginBottom="5px">Ширина (%)</Text>
                <Input
                  type="number"
                  value={parseInt(selectedBlock.style.width || '100')}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateBlockAndSave(selectedBlock.id, {
                      style: {
                        ...selectedBlock.style,
                        width: `${e.target.value}%`,
                      },
                    })
                  }
                  min="1"
                  max="100"
                  color="inherit"
                />
              </Box>
            </>
          )}

          {selectedBlock.type === 'input' && (
            <>
              <Box>
                <Text marginBottom="5px">Placeholder</Text>
                <Input
                  value={selectedBlock.placeholder || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    updateBlock(selectedBlock.id, { placeholder: e.target.value } as any);
                    saveToLocalStorage();
                  }}
                  placeholder="Введите текст"
                  color="inherit"
                />
              </Box>
              <Box>
                <Text marginBottom="5px">Имя поля</Text>
                <Input
                  value={selectedBlock.name || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    updateBlock(selectedBlock.id, { name: e.target.value } as any);
                    saveToLocalStorage();
                  }}
                  placeholder="input"
                  color="inherit"
                />
              </Box>
              <Box>
                <Text marginBottom="5px">Значение</Text>
                <Input
                  value={selectedBlock.value || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    updateBlock(selectedBlock.id, { value: e.target.value } as any);
                    saveToLocalStorage();
                  }}
                  placeholder=""
                  color="inherit"
                />
              </Box>
            </>
          )}
        </VStack>
      )}

      {selectedBlock && (
        <SaveBlockModal
          isOpen={isSaveBlockModalOpen}
          onClose={() => setIsSaveBlockModalOpen(false)}
          block={selectedBlock}
          onSaved={() => {
            // Можно показать уведомление об успешном сохранении
            console.log('Блок успешно сохранен');
          }}
        />
      )}
    </Box>
  );
};

