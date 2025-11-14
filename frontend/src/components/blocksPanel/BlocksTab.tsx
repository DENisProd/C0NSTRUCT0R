import { VStack, Text } from '@chakra-ui/react';
import { Text as TextIcon, Image as ImageIcon, MousePointerClick, Video as VideoIcon, Package, Grid3x3 } from 'lucide-react';
import { DraggableBlockButton } from './DraggableBlockButton';
import type { BlockType } from '../../types';

const blockTypes: { type: BlockType; label: string; icon: JSX.Element }[] = [
  { type: 'text', label: 'Текст', icon: <TextIcon size={16} /> },
  { type: 'image', label: 'Изображение', icon: <ImageIcon size={16} /> },
  { type: 'button', label: 'Кнопка', icon: <MousePointerClick size={16} /> },
  { type: 'video', label: 'Видео', icon: <VideoIcon size={16} /> },
  { type: 'input', label: 'Текстовое поле', icon: <TextIcon size={16} /> },
  { type: 'container', label: 'Контейнер', icon: <Package size={16} /> },
  { type: 'grid', label: 'Сетка', icon: <Grid3x3 size={16} /> },
];

export const BlocksTab = () => {
  return (
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
  );
};