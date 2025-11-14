import { Box, VStack, Text, Button, HStack, Input, Textarea } from '@chakra-ui/react';
import { useState, useEffect, type ChangeEvent, type MouseEvent } from 'react';
import { useFunctionsStore } from '../store/useFunctionsStore';
import type { TriggerType, ActionType } from '../types';
import { getAllActions, getActionDefinition } from '../lib/actions';

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

export const FunctionsPanel = () => {
  const {
    functions,
    selectedFunctionId,
    addFunction,
    updateFunction,
    deleteFunction,
    duplicateFunction,
    selectFunction,
    loadFromLocalStorage,
  } = useFunctionsStore();
  const [editingName, setEditingName] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');

  useEffect(() => {
    loadFromLocalStorage();
  }, [loadFromLocalStorage]);

  const selectedFunction = functions.find((f) => f.id === selectedFunctionId);

  const handleCreateFunction = () => {
    addFunction();
  };

  const handleDeleteFunction = (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить эту функцию?')) {
      deleteFunction(id);
    }
  };

  const handleDuplicateFunction = (id: string) => {
    duplicateFunction(id);
  };

  const handleStartEditName = (id: string, currentName: string) => {
    setEditingName(id);
    setTempName(currentName);
  };

  const handleSaveName = (id: string) => {
    if (tempName.trim()) {
      updateFunction(id, { name: tempName.trim() });
    }
    setEditingName(null);
    setTempName('');
  };

  const handleCancelEdit = () => {
    setEditingName(null);
    setTempName('');
  };

  const handleTriggerChange = (id: string, trigger: TriggerType) => {
    updateFunction(id, { trigger });
  };

  const handleAddAction = (fnId: string, type: ActionType) => {
    const def = getActionDefinition(type);
    const now = Date.now();
    const newAction = {
      id: `action-${now}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      name: def?.name || 'Действие',
      args: (def?.args || []).reduce<Record<string, any>>((acc, argDef) => {
        if (argDef.required && argDef.default === undefined) {
          acc[argDef.name] = '';
        } else if (argDef.default !== undefined) {
          acc[argDef.name] = argDef.default;
        }
        return acc;
      }, {}),
      code: type === 'custom' ? '' : undefined,
    };
    const fn = functions.find((f) => f.id === fnId);
    if (!fn) return;
    updateFunction(fnId, { actions: [...fn.actions, newAction] });
  };

  const handleUpdateAction = (fnId: string, actionId: string, updates: Partial<{ type: ActionType; name: string; args: Record<string, any>; code?: string }>) => {
    const fn = functions.find((f) => f.id === fnId);
    if (!fn) return;
    const actions = fn.actions.map((a) => (a.id === actionId ? { ...a, ...updates } : a));
    updateFunction(fnId, { actions });
  };

  const handleRemoveAction = (fnId: string, actionId: string) => {
    const fn = functions.find((f) => f.id === fnId);
    if (!fn) return;
    const actions = fn.actions.filter((a) => a.id !== actionId);
    updateFunction(fnId, { actions });
  };

  const handleToggleEnabled = (id: string, enabled: boolean) => {
    updateFunction(id, { enabled });
  };


  return (
    <Box
      width="300px"
      height="100vh"
      backgroundColor="#f5f5f5"
      borderRight="1px solid #e0e0e0"
      display="flex"
      flexDirection="column"
    >
      <Box padding="16px" borderBottom="1px solid #e0e0e0">
        <HStack justify="space-between" marginBottom="12px">
          <Text fontSize="18px" fontWeight="bold">
            Логика
          </Text>
        </HStack>
        <Button
          width="100%"
          colorScheme="blue"
          size="sm"
          onClick={handleCreateFunction}
        >
          + Создать функцию
        </Button>
      </Box>

      <Box flex="1" overflowY="auto" padding="12px">
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
                          if (e.key === 'Enter') handleSaveName(fn.id);
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                      />
                      <Button size="xs" onClick={() => handleSaveName(fn.id)}>
                        ✓
                      </Button>
                      <Button size="xs" onClick={handleCancelEdit}>
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
                          handleStartEditName(fn.id, fn.name);
                        }}
                        flex="1"
                        _hover={{ color: 'var(--app-accent)' }}
                      >
                        {fn.name}
                      </Text>
                      <HStack gap="4px">
                        <input
                          type="checkbox"
                          checked={fn.enabled}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleEnabled(fn.id, e.target.checked);
                          }}
                        />
                      </HStack>
                    </HStack>
                  )}

                  <select
                    value={fn.trigger}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                      handleTriggerChange(fn.id, e.target.value as TriggerType);
                    }}
                    onClick={(e: MouseEvent<HTMLSelectElement>) => e.stopPropagation()}
                  >
                    {Object.entries(triggerLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>

                  <Text fontSize="12px" color="#666">
                    Действий: {fn.actions.length}
                  </Text>

                  <HStack gap="4px" justify="flex-end">
                    <Button
                      size="xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateFunction(fn.id);
                      }}
                    >
                      📋
                    </Button>
                    <Button
                      size="xs"
                      colorScheme="red"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFunction(fn.id);
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
      </Box>

      {selectedFunction && (
        <Box
          padding="16px"
          borderTop="1px solid #e0e0e0"
          backgroundColor="white"
          maxHeight="200px"
          overflowY="auto"
        >
          <Text fontSize="14px" fontWeight="bold" marginBottom="8px">
            Детали функции
          </Text>
          <VStack gap="8px" align="stretch">
            <Text fontSize="12px">
              <strong>Триггер:</strong> {triggerLabels[selectedFunction.trigger]}
            </Text>
            <Text fontSize="12px">
              <strong>Действий:</strong> {selectedFunction.actions.length}
            </Text>
            <Text fontSize="12px">
              <strong>Условий:</strong> {selectedFunction.conditions.length}
            </Text>
            <Text fontSize="12px">
              <strong>Статус:</strong> {selectedFunction.enabled ? 'Включена' : 'Отключена'}
            </Text>

            <Box marginTop="12px" padding="12px" border="1px solid #e0e0e0" borderRadius="6px" backgroundColor="#fff">
              <VStack align="stretch" gap="8px">
                <HStack justify="space-between">
                  <Text fontSize="14px" fontWeight="medium">Действия</Text>
                  <HStack>
                    <select
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                        const type = e.target.value as ActionType;
                        if (type) {
                          handleAddAction(selectedFunction.id, type);
                          e.currentTarget.value = '';
                        }
                      }}
                    >
                      <option value="">Выберите действие</option>
                      {getAllActions().map((def) => (
                        <option key={def.type} value={def.type}>{def.name}</option>
                      ))}
                      <option value="custom">Кастомное действие</option>
                    </select>
                    <Button size="sm" onClick={() => handleAddAction(selectedFunction.id, 'log')}>+ Быстрое: Лог</Button>
                  </HStack>
                </HStack>

                {selectedFunction.actions.length === 0 ? (
                  <Text fontSize="12px" color="#666">Действий пока нет. Добавьте действие.</Text>
                ) : (
                  <VStack align="stretch" gap="10px">
                    {selectedFunction.actions.map((action) => (
                      <Box key={action.id} padding="10px" border="1px solid #eee" borderRadius="4px" backgroundColor="#fafafa">
                        <VStack align="stretch" gap="6px">
                          <HStack gap="8px">
                            <select
                              value={action.type}
                              onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                                const newType = e.target.value as ActionType;
                                const def = getActionDefinition(newType);
                                const defaultArgs = (def?.args || []).reduce<Record<string, any>>((acc, argDef) => {
                                  if (argDef.required && argDef.default === undefined) {
                                    acc[argDef.name] = '';
                                  } else if (argDef.default !== undefined) {
                                    acc[argDef.name] = argDef.default;
                                  }
                                  return acc;
                                }, {});
                                handleUpdateAction(selectedFunction.id, action.id, { type: newType, name: def?.name || action.name, args: defaultArgs, code: newType === 'custom' ? '' : undefined });
                              }}
                            >
                              {getAllActions().map((def) => (
                                <option key={def.type} value={def.type}>{def.name}</option>
                              ))}
                              <option value="custom">Кастомное действие</option>
                            </select>
                            <Input size="sm" value={action.name} onChange={(e) => handleUpdateAction(selectedFunction.id, action.id, { name: e.target.value })} placeholder="Название действия" />
                        <Button size="sm" colorScheme="red" variant="ghost" onClick={() => handleRemoveAction(selectedFunction.id, action.id)}>Удалить</Button>
                          </HStack>

                          {action.type === 'custom' ? (
                            <Textarea size="sm" value={action.code || ''} onChange={(e) => handleUpdateAction(selectedFunction.id, action.id, { code: e.target.value })} placeholder="Код кастомного действия (JS)" rows={4} />
                          ) : (
                            <Textarea
                              size="sm"
                              value={(() => {
                                try { return JSON.stringify(action.args ?? {}, null, 2); } catch { return '{}'; }
                              })()}
                              onChange={(e) => {
                                try {
                                  const parsed = JSON.parse(e.target.value || '{}');
                                  handleUpdateAction(selectedFunction.id, action.id, { args: parsed });
                                } catch {
                                }
                              }}
                              placeholder="Аргументы действия (JSON)"
                              rows={4}
                            />
                          )}
                        </VStack>
                      </Box>
                    ))}
                  </VStack>
                )}
              </VStack>
            </Box>
          </VStack>
        </Box>
      )}
    </Box>
  );
};



