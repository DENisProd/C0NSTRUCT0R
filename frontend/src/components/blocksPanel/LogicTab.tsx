import { VStack, Box, HStack, Text, Button, Input } from '@chakra-ui/react';
import { useState } from 'react';
import type { ProjectFunction, TriggerType } from '../../types';

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

interface LogicTabProps {
  functions: ProjectFunction[];
  selectedFunctionId: string | null;
  addFunction: () => void;
  updateFunction: (id: string, updates: Partial<ProjectFunction>) => void;
  deleteFunction: (id: string) => void;
  duplicateFunction: (id: string) => void;
  selectFunction: (id: string) => void;
}

export const LogicTab = ({
  functions,
  selectedFunctionId,
  addFunction,
  updateFunction,
  deleteFunction,
  duplicateFunction,
  selectFunction,
}: LogicTabProps) => {
  const [editingName, setEditingName] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');

  return (
    <VStack gap="12px" align="stretch">
      <HStack justify="space-between" marginBottom="8px">
        <Text fontSize="18px" fontWeight="bold">Функции</Text>
        <Button size="sm" onClick={addFunction} backgroundColor="var(--app-accent)" color="white" _hover={{ backgroundColor: 'var(--app-accent)', opacity: 0.9 }}>
          + Создать
        </Button>
      </HStack>

      {functions.length === 0 ? (
        <Text fontSize="14px" color="#666" textAlign="center" padding="20px">Нет функций. Создайте первую функцию.</Text>
      ) : (
        <VStack gap="8px" align="stretch">
          {functions.map((fn) => (
            <Box
              key={fn.id}
              backgroundColor={selectedFunctionId === fn.id ? 'var(--app-selected)' : 'var(--app-surface)'}
              border="1px solid var(--app-border)"
              borderRadius="4px"
              padding="12px"
              cursor="pointer"
              onClick={() => selectFunction(fn.id)}
              _hover={{ borderColor: 'var(--app-accent)' }}
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
                    <Button size="xs" onClick={() => {
                      if (tempName.trim()) {
                        updateFunction(fn.id, { name: tempName.trim() });
                      }
                      setEditingName(null);
                      setTempName('');
                    }}>✓</Button>
                    <Button size="xs" onClick={() => {
                      setEditingName(null);
                      setTempName('');
                    }}>✕</Button>
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
                >
                  {Object.entries(triggerLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>

                <HStack gap="6px" justify="flex-end">
                  <Button size="xs" onClick={(e) => { e.stopPropagation(); duplicateFunction(fn.id); }}>Дублировать</Button>
                  <Button size="xs" onClick={(e) => { e.stopPropagation(); deleteFunction(fn.id); }}>Удалить</Button>
                </HStack>
              </VStack>
            </Box>
          ))}
        </VStack>
      )}
    </VStack>
  );
};