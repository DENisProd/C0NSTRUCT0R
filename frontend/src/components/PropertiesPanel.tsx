import { Box, VStack, Text, Input, HStack, Button, Badge, NativeSelect } from '@chakra-ui/react';
import { useState } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { useLayoutStore } from '../store/useLayoutStore';
import { useFunctionsStore } from '../store/useFunctionsStore';
import { useResponsiveStore, type Breakpoint } from '../store/useResponsiveStore';
import { isDifferentFromDesktop } from '../lib/responsiveUtils';
import type { Block, GridBlock, TriggerType, ResponsiveStyle } from '../types';

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
    default:
      return ['onClick', 'onHover', 'onLoad'];
  }
};

export const PropertiesPanel = () => {
  const { project, selectedBlockId, updateBlock, updateHeader, updateFooter } = useProjectStore();
  const { functions, addFunction } = useFunctionsStore();
  const { propertiesPanelWidth, setPropertiesPanelWidth } = useLayoutStore();
  const { currentBreakpoint } = useResponsiveStore();
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  
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
    
    updateBlock(blockId, {
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
        height="100vh"
        backgroundColor="#f5f5f5"
        borderLeft="1px solid #e0e0e0"
        padding="20px"
        position="relative"
      >
        <Box
          position="absolute"
          left="-3px"
          top={0}
          height="100%"
          width="6px"
          cursor="col-resize"
          backgroundColor={isResizing ? '#cde4ff' : 'transparent'}
          _hover={{ backgroundColor: '#eaf3ff' }}
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
        <Text color="#999">Выберите блок для редактирования</Text>
      </Box>
    );
  }

  return (
    <Box
      width={`${propertiesPanelWidth}px`}
      height="100vh"
      backgroundColor="#f5f5f5"
      borderLeft="1px solid #e0e0e0"
      padding="20px"
      overflowY="auto"
      position="relative"
    >
      <Box
        position="absolute"
        left="-3px"
        top={0}
        height="100%"
        width="6px"
        cursor="col-resize"
        backgroundColor={isResizing ? '#cde4ff' : 'transparent'}
        _hover={{ backgroundColor: '#eaf3ff' }}
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
      <Text fontSize="18px" fontWeight="bold" marginBottom="20px">
        Свойства
      </Text>
      
      {isHeaderSelected && (
        <VStack gap="15px" align="stretch">
          <Box>
            <Text marginBottom="5px">URL логотипа</Text>
            <Input
              value={project.header.logoUrl || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateHeader({ logoUrl: e.target.value })}
              placeholder="https://example.com/logo.png"
            />
          </Box>
          <Box>
            <Text marginBottom="5px">Название компании</Text>
            <Input
              value={project.header.companyName || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateHeader({ companyName: e.target.value })}
              placeholder="Моя компания"
            />
          </Box>
          <Box>
            <Text marginBottom="5px">Цвет фона</Text>
            <Input
              type="color"
              value={project.header.backgroundColor || '#ffffff'}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateHeader({ backgroundColor: e.target.value })}
            />
          </Box>
          <Box>
            <Text marginBottom="5px">Цвет текста</Text>
            <Input
              type="color"
              value={project.header.textColor || '#000000'}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateHeader({ textColor: e.target.value })}
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFooter({ text: e.target.value })}
              placeholder="© 2025 My Landing"
            />
          </Box>
          <Box>
            <Text marginBottom="5px">Цвет фона</Text>
            <Input
              type="color"
              value={project.footer.backgroundColor || '#f5f5f5'}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFooter({ backgroundColor: e.target.value })}
            />
          </Box>
          <Box>
            <Text marginBottom="5px">Цвет текста</Text>
            <Input
              type="color"
              value={project.footer.textColor || '#000000'}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFooter({ textColor: e.target.value })}
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    useProjectStore.getState().updateGridSettings(selectedBlock.id, { columns: parseInt(e.target.value || '1', 10) || 1 })
                  }
                  min="1"
                />
              </Box>
              <Box>
                <Text marginBottom="5px">Ряды</Text>
                <Input
                  type="number"
                  value={(selectedBlock as GridBlock).settings.rows}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    useProjectStore.getState().updateGridSettings(selectedBlock.id, { rows: parseInt(e.target.value || '1', 10) || 1 })
                  }
                  min="1"
                />
              </Box>
              <Box>
                <Text marginBottom="5px">Отступ по X (px)</Text>
                <Input
                  type="number"
                  value={(selectedBlock as GridBlock).settings.gapX}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    useProjectStore.getState().updateGridSettings(selectedBlock.id, { gapX: parseInt(e.target.value || '0', 10) || 0 })
                  }
                  min="0"
                />
              </Box>
              <Box>
                <Text marginBottom="5px">Отступ по Y (px)</Text>
                <Input
                  type="number"
                  value={(selectedBlock as GridBlock).settings.gapY}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    useProjectStore.getState().updateGridSettings(selectedBlock.id, { gapY: parseInt(e.target.value || '0', 10) || 0 })
                  }
                  min="0"
                />
              </Box>
              <Box>
                <Text marginBottom="5px">Границы ячеек</Text>
                <HStack gap="8px">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="checkbox"
                      checked={(selectedBlock as GridBlock).settings.showCellBorders ?? false}
                      onChange={(e) => useProjectStore.getState().updateGridSettings(selectedBlock.id, { showCellBorders: e.target.checked })}
                    />
                    <span>Показывать</span>
                  </label>
                  <Input
                    type="color"
                    value={(selectedBlock as GridBlock).settings.cellBorderColor || '#e0e0e0'}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      useProjectStore.getState().updateGridSettings(selectedBlock.id, { cellBorderColor: e.target.value })
                    }
                  />
                  <Input
                    type="number"
                    min="0"
                    width="80px"
                    value={String((selectedBlock as GridBlock).settings.cellBorderWidth ?? 1)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      useProjectStore.getState().updateGridSettings(selectedBlock.id, { cellBorderWidth: parseInt(e.target.value || '1', 10) || 1 })
                    }
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
                  updateBlock(selectedBlock.id, {
                    style: { ...selectedBlock.style, width: e.target.value },
                  })
                }
                style={{
                  padding: '8px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  backgroundColor: '#fff',
                }}
              >
                <option value="fit-content">fit-content</option>
                <option value="100%">100%</option>
              </select>
              <Text fontSize="12px" color="#666" marginTop="6px">
                При 100% контейнер растягивается до ширины родителя/ячейки сетки.
              </Text>
            </Box>
          )}
          <Box>
            <Text marginBottom="5px">HTML id</Text>
            <Input
              value={selectedBlock.htmlId || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateBlock(selectedBlock.id, { htmlId: e.currentTarget.value.trim() || undefined })
              }
              placeholder="Например: hero-section"
            />
            <Text fontSize="12px" color="#666" marginTop="6px">
              Указывайте уникальный id для прокрутки и связывания функций.
            </Text>
          </Box>
          <Box>
            <Text marginBottom="5px">Отступ (margin)</Text>
            <Input
              value={selectedBlock.style.margin || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateBlock(selectedBlock.id, {
                  style: { ...selectedBlock.style, margin: e.target.value },
                })
              }
              placeholder="10px 0"
            />
          </Box>
          <Box>
            <Text marginBottom="5px">Внутренний отступ (padding)</Text>
            <Input
              value={selectedBlock.style.padding || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateBlock(selectedBlock.id, {
                  style: { ...selectedBlock.style, padding: e.target.value },
                })
              }
              placeholder="10px"
            />
          </Box>
          {selectedBlock.type !== 'text' && (
            <Box>
              <Text marginBottom="5px">Закругление углов (px)</Text>
              <Input
                type="number"
                value={parseInt(selectedBlock.style.borderRadius || '0')}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  updateBlock(selectedBlock.id, {
                    style: { ...selectedBlock.style, borderRadius: `${e.target.value || '0'}px` },
                  })
                }
                min="0"
              />
              <HStack gap="8px" marginTop="8px">
                {[0, 4, 8, 12, 16, 24].map((val) => (
                  <Button
                    key={`br-${val}`}
                    size="xs"
                    variant="outline"
                    onClick={() =>
                      updateBlock(selectedBlock.id, {
                        style: { ...selectedBlock.style, borderRadius: `${val}px` },
                      })
                    }
                  >
                    {val}px
                  </Button>
                ))}
              </HStack>
            </Box>
          )}
          <Box>
            <Text marginBottom="5px">Цвет фона</Text>
            <Input
              type="color"
              value={selectedBlock.style.backgroundColor || '#ffffff'}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                updateBlock(selectedBlock.id, {
                  style: { ...selectedBlock.style, backgroundColor: e.target.value },
                })
              }
            />
          </Box>
          <Box>
            <Text marginBottom="5px">Выравнивание</Text>
            <select
              value={selectedBlock.style.textAlign || 'left'}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                updateBlock(selectedBlock.id, {
                  style: {
                    ...selectedBlock.style,
                    textAlign: e.target.value as 'left' | 'center' | 'right',
                  },
                })
              }
              style={{
                padding: '8px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                backgroundColor: '#fff',
              }}
            >
              <option value="left">Слева</option>
              <option value="center">По центру</option>
              <option value="right">Справа</option>
            </select>
          </Box>

          {selectedBlock.type === 'text' && (
            <>
              <Box>
                <Text marginBottom="5px">Цвет текста</Text>
                <Input
                  type="color"
                  value={selectedBlock.style.color || '#000000'}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateBlock(selectedBlock.id, {
                      style: { ...selectedBlock.style, color: e.target.value },
                    })
                  }
                />
              </Box>
              <Box>
                <Text marginBottom="5px">Размер шрифта</Text>
                <Input
                  value={selectedBlock.style.fontSize || '16px'}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateBlock(selectedBlock.id, {
                      style: { ...selectedBlock.style, fontSize: e.target.value },
                    })
                  }
                  placeholder="16px"
                />
              </Box>
              <Box>
                <Text marginBottom="5px">Жирность</Text>
                <select
                  value={selectedBlock.style.fontWeight || 'normal'}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    updateBlock(selectedBlock.id, {
                      style: {
                        ...selectedBlock.style,
                        fontWeight: e.target.value as 'normal' | 'bold',
                      },
                    })
                  }
                  style={{
                    padding: '8px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    backgroundColor: '#fff',
                  }}
                >
                  <option value="normal">Обычный</option>
                  <option value="bold">Жирный</option>
                </select>
              </Box>
            </>
          )}

          {selectedBlock.type === 'image' && (
            <>
              <Box>
                <Text marginBottom="5px">URL изображения</Text>
                <Input
                  value={selectedBlock.url}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateBlock(selectedBlock.id, { url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </Box>
              <Box>
                <Text marginBottom="5px">Ширина (%)</Text>
                <Input
                  type="number"
                  value={parseInt(selectedBlock.style.width || '100')}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateBlock(selectedBlock.id, {
                      style: {
                        ...selectedBlock.style,
                        width: `${e.target.value}%`,
                      },
                    })
                  }
                  min="1"
                  max="100"
                />
              </Box>
            </>
          )}

          {(() => {
            if (!selectedBlock || selectedBlock.type === 'grid') return null;
            const state = useProjectStore.getState();
            const { project } = state;
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
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                              state.updateGridCellAlign(gb.id, idx, { justify: e.target.value as any })
                            }
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
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                              state.updateGridCellAlign(gb.id, idx, { align: e.target.value as any })
                            }
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

      <Box borderTop="1px solid #e0e0e0" marginY="15px" />
          <Box>
            <Text fontSize="16px" fontWeight="bold" marginBottom="12px">
              📱 Адаптивность
            </Text>
            <Text fontSize="12px" color="#666" marginBottom="12px">
              Настройте параметры для разных устройств. Текущий режим: <strong>{currentBreakpoint === 'desktop' ? 'Desktop' : currentBreakpoint === 'tablet' ? 'Tablet' : 'Mobile'}</strong>
            </Text>
            
            {(['tablet', 'mobile'] as Breakpoint[]).map((breakpoint) => {
              const breakpointLabel = breakpoint === 'tablet' ? '📱 Tablet' : '📱 Mobile';
              const responsiveStyle = selectedBlock.style.responsive?.[breakpoint] || {};
              
              return (
                <Box key={breakpoint} marginBottom="20px" padding="12px" backgroundColor="#f9f9f9" borderRadius="6px">
                  <Text fontWeight="bold" marginBottom="10px" fontSize="14px">
                    {breakpointLabel}
                  </Text>
                  
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
                    <NativeSelect.Root size="sm">
                      <NativeSelect.Field
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
                        <NativeSelect.Root size="sm">
                          <NativeSelect.Field
                            value={responsiveStyle.flexDirection || (breakpoint === 'mobile' ? 'column' : 'row') || 'row'}
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
                          <Text fontSize="13px">Перенос элементов</Text>
                          {isDifferentFromDesktop(selectedBlock.style, breakpoint, 'flexWrap') && (
                            <Badge colorScheme="blue" fontSize="10px">Отличается</Badge>
                          )}
                        </HStack>
                        <NativeSelect.Root size="sm">
                          <NativeSelect.Field
                            value={responsiveStyle.flexWrap || (breakpoint === 'mobile' ? 'wrap' : 'nowrap') || 'nowrap'}
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
                        <NativeSelect.Root size="sm">
                          <NativeSelect.Field
                            value={responsiveStyle.display || 'block'}
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
            })}
          </Box>

          {selectedBlock && (
            <Box
              borderTop="1px solid #e0e0e0"
              borderBottom="1px solid #e0e0e0"
              paddingTop="15px"
              paddingBottom="15px"
              marginTop="10px"
              marginBottom="10px"
            >
              <Text fontSize="16px" fontWeight="bold" marginBottom="12px">
                Поведение
              </Text>
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
                          updateBlock(selectedBlock.id, { events: newEvents });
                        }}
                        style={{
                          padding: '8px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '4px',
                          backgroundColor: '#fff',
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
                              <HStack key={functionId} justify="space-between" fontSize="12px" color="#666">
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
                                    updateBlock(selectedBlock.id, { events: newEvents });
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
                  onClick={() => {
                    addFunction();
                  }}
                >
                  + Создать новую функцию
                </Button>
              </VStack>
            </Box>
          )}

          {selectedBlock.type === 'button' && (
            <>
              <Box>
                <Text marginBottom="5px">Текст кнопки</Text>
                <Input
                  value={selectedBlock.text}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateBlock(selectedBlock.id, { text: e.target.value })}
                  placeholder="Кнопка"
                />
              </Box>
              <Box>
                <Text marginBottom="5px">Тип кнопки</Text>
                <select
                  value={selectedBlock.variant || 'solid'}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateBlock(selectedBlock.id, { variant: e.target.value as any })}
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateBlock(selectedBlock.id, { link: e.target.value })}
                  placeholder="#"
                />
              </Box>
              <Box>
                <Text marginBottom="5px">Цвет кнопки</Text>
                <Input
                  type="color"
                  value={selectedBlock.buttonColor || project.theme.accent}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateBlock(selectedBlock.id, { buttonColor: e.target.value })}
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateBlock(selectedBlock.id, { url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </Box>
              <Box>
                <Text marginBottom="5px">Ширина (%)</Text>
                <Input
                  type="number"
                  value={parseInt(selectedBlock.style.width || '100')}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateBlock(selectedBlock.id, {
                      style: {
                        ...selectedBlock.style,
                        width: `${e.target.value}%`,
                      },
                    })
                  }
                  min="1"
                  max="100"
                />
              </Box>
            </>
          )}
        </VStack>
      )}
    </Box>
  );
};

