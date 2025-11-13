import { useState } from 'react';
import {
  Box,
  VStack,
  Heading,
  Input,
  Textarea,
  Button,
  Alert,
  Text,
  HStack,
} from '@chakra-ui/react';
import { Plus, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { uploadBlock } from '../lib/api/library';
import { useLibraryStore } from '../store/useLibraryStore';
import { useProjectStore } from '../store/useProjectStore';
import { BlockRenderer } from '../components/blocks/BlockRenderer';
import type { Block } from '../types';

const RAW_CATEGORIES = (import.meta as any).env?.VITE_BLOCK_CATEGORIES as string | undefined;
const CATEGORIES = RAW_CATEGORIES
  ? RAW_CATEGORIES.split(',').map((s) => s.trim()).filter(Boolean)
  : [
      'hero',
      'features',
      'testimonials',
      'pricing',
      'cta',
      'about',
      'contact',
      'other',
    ];

export const AddBlockPage = () => {
  const navigate = useNavigate();
  const { addUserBlock, setLoading, setError } = useLibraryStore();
  const { project } = useProjectStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [tags, setTags] = useState('');
  const [jsonConfig, setJsonConfig] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [previewBlock, setPreviewBlock] = useState<Block | null>(null);

  const validateAndPreview = () => {
    if (!jsonConfig.trim()) {
      setValidationError('Введите JSON-конфигурацию блока');
      setPreviewBlock(null);
      return;
    }

    try {
      const parsed = JSON.parse(jsonConfig);
      
      // Базовая валидация структуры блока
      if (!parsed.type || !parsed.id) {
        setValidationError('JSON должен содержать поля type и id');
        setPreviewBlock(null);
        return;
      }

      setPreviewBlock(parsed as Block);
      setValidationError(null);
    } catch (err) {
      setValidationError('Неверный формат JSON: ' + (err instanceof Error ? err.message : 'Ошибка парсинга'));
      setPreviewBlock(null);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setValidationError('Введите название блока');
      return;
    }

    if (!previewBlock) {
      setValidationError('Сначала проверьте JSON-конфигурацию');
      return;
    }

    setLoading(true);
    try {
      const block = await uploadBlock({
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        blocks: [previewBlock],
      });

      addUserBlock(block);
      navigate('/library');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки блока');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minHeight="100vh" backgroundColor="#f5f5f5" padding="40px 20px">
      <Box maxWidth="1000px" margin="0 auto">
        <VStack gap="24px" align="stretch">
          <Heading size="xl">
            <HStack gap="10px" align="center">
              <Plus size={22} />
              <Text as="span">Добавить пользовательский блок</Text>
            </HStack>
          </Heading>

          <VStack gap="16px" align="stretch">
            <Box>
              <Text mb="8px" fontWeight="medium">
                Название <Text as="span" color="red.500">*</Text>
              </Text>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Название блока"
                backgroundColor="white"
              />
            </Box>

            <Box>
              <Text mb="8px" fontWeight="medium">Описание</Text>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Описание блока"
                backgroundColor="white"
                minHeight="80px"
              />
            </Box>

            <HStack gap="16px" align="stretch">
              <Box flex="1">
                <Text mb="8px" fontWeight="medium">
                  Категория <Text as="span" color="red.500">*</Text>
                </Text>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    backgroundColor: 'white',
                    padding: '10px',
                    borderRadius: '6px',
                    borderWidth: '1px',
                    borderColor: 'var(--chakra-colors-gray-200)',
                    width: '100%',
                    borderStyle: 'solid',
                  }}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </Box>

              <Box flex="1">
                <Text mb="8px" fontWeight="medium">Теги (через запятую)</Text>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="тег1, тег2, тег3"
                  backgroundColor="white"
                />
              </Box>
            </HStack>

            <Box>
              <Text mb="8px" fontWeight="medium">
                JSON-конфигурация блока <Text as="span" color="red.500">*</Text>
              </Text>
              <Textarea
                value={jsonConfig}
                onChange={(e) => setJsonConfig(e.target.value)}
                placeholder='{"id": "block-1", "type": "text", "content": "Текст", ...}'
                backgroundColor="white"
                minHeight="200px"
                fontFamily="monospace"
                fontSize="14px"
              />
              <Button
                mt="8px"
                size="sm"
                onClick={validateAndPreview}
                colorScheme="blue"
                variant="outline"
              >
                Проверить и предпросмотр
              </Button>
            </Box>

            {validationError && (
              <Alert.Root status="error">
                <Box as="span" marginRight="8px"><AlertTriangle size={16} /></Box>
                <Alert.Description>{validationError}</Alert.Description>
              </Alert.Root>
            )}

            {previewBlock && (
              <Box
                padding="24px"
                backgroundColor="white"
                borderRadius="8px"
                border="2px solid"
                borderColor="green.300"
              >
                <Text mb="16px" fontWeight="bold" color="green.600">
                  ✓ Предпросмотр блока:
                </Text>
                <Box
                  padding="16px"
                  backgroundColor={project.theme.background}
                  borderRadius="4px"
                >
                  <BlockRenderer block={previewBlock} isPreview={true} />
                </Box>
              </Box>
            )}

            <HStack gap="16px">
              <Button
                onClick={handleSubmit}
                colorScheme="blue"
                size="lg"
                flex="1"
                disabled={!name.trim() || !previewBlock}
              >
                Загрузить блок
              </Button>
              <Button
                onClick={() => navigate('/library')}
                variant="outline"
                size="lg"
              >
                Отмена
              </Button>
            </HStack>
          </VStack>
        </VStack>
      </Box>
    </Box>
  );
};

