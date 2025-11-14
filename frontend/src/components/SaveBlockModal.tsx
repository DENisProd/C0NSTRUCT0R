import { Box, VStack, HStack, Text, Input, Button, Dialog } from '@chakra-ui/react';
import { useState } from 'react';
import { Save, X } from 'lucide-react';
import { uploadBlock, type UploadBlockRequest } from '../lib/api/library';
import type { Block } from '../types';

interface SaveBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  block: Block;
  onSaved?: () => void;
}

const CATEGORIES = [
  'header',
  'hero',
  'features',
  'gallery',
  'testimonials',
  'pricing',
  'contact',
  'footer',
  'other',
];

export const SaveBlockModal = ({ isOpen, onClose, block, onSaved }: SaveBlockModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [tags, setTags] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Название обязательно');
      return;
    }

    if (!category) {
      setError('Категория обязательна');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const tagsArray = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const request: UploadBlockRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        blocks: [block],
      };

      await uploadBlock(request);
      
      // Сбрасываем форму
      setName('');
      setDescription('');
      setCategory('other');
      setTags('');
      
      onSaved?.();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка сохранения блока';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      setName('');
      setDescription('');
      setCategory('other');
      setTags('');
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && handleClose()}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content maxW="500px" backgroundColor="var(--app-surface)" border="1px solid var(--app-border)" color="inherit">
          <Dialog.Header>
            <Dialog.Title>Сохранить блок в библиотеку</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
          <VStack gap="16px" align="stretch">
            {error && (
              <Box
                padding="12px"
                backgroundColor="var(--app-bg-muted)"
                border="1px solid var(--app-border)"
                borderRadius="6px"
              >
                <Text color="var(--app-text-muted)" fontSize="14px">
                  {error}
                </Text>
              </Box>
            )}

            <Box>
              <Text marginBottom="6px" fontSize="14px" fontWeight="medium">
                Название <Text as="span" color="var(--app-accent)">*</Text>
              </Text>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например: Красивый заголовок"
                disabled={isSaving}
                color="inherit"
              />
            </Box>

            <Box>
              <Text marginBottom="6px" fontSize="14px" fontWeight="medium">
                Описание
              </Text>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Краткое описание блока"
                disabled={isSaving}
                color="inherit"
              />
            </Box>

            <Box>
              <Text marginBottom="6px" fontSize="14px" fontWeight="medium">
                Категория <Text as="span" color="var(--app-accent)">*</Text>
              </Text>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isSaving}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--app-border)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--app-surface)',
                  color: 'inherit',
                  fontSize: '14px',
                }}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'header' && 'Шапка'}
                    {cat === 'hero' && 'Главный экран'}
                    {cat === 'features' && 'Особенности'}
                    {cat === 'gallery' && 'Галерея'}
                    {cat === 'testimonials' && 'Отзывы'}
                    {cat === 'pricing' && 'Цены'}
                    {cat === 'contact' && 'Контакты'}
                    {cat === 'footer' && 'Подвал'}
                    {cat === 'other' && 'Другое'}
                  </option>
                ))}
              </select>
            </Box>

            <Box>
              <Text marginBottom="6px" fontSize="14px" fontWeight="medium">
                Теги
              </Text>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Например: заголовок, синий, современный"
                disabled={isSaving}
                color="inherit"
              />
              <Text fontSize="12px" color="var(--app-text-muted)" marginTop="4px">
                Разделяйте теги запятыми
              </Text>
            </Box>
          </VStack>
          </Dialog.Body>
          <Dialog.Footer>
            <HStack gap="8px" width="100%" justify="flex-end">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isSaving}
                borderColor="var(--app-border)"
                color="inherit"
                _hover={{ backgroundColor: 'var(--app-hover)' }}
              >
                <HStack gap="6px" align="center">
                  <X size={16} />
                  <Box as="span">Отмена</Box>
                </HStack>
              </Button>
              <Button
                backgroundColor="var(--app-accent)"
                onClick={handleSave}
                loading={isSaving}
                color="white"
                _hover={{ backgroundColor: 'var(--app-accent)', opacity: 0.9 }}
              >
                <HStack gap="6px" align="center">
                  <Save size={16} />
                  <Box as="span">Сохранить</Box>
                </HStack>
              </Button>
            </HStack>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

