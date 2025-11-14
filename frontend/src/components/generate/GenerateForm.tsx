import { Box, VStack, Textarea, Button, Text, HStack, Badge } from '@chakra-ui/react';
import { AlertTriangle } from 'lucide-react';
import { Alert } from '@chakra-ui/react';

const RAW_CATEGORIES = (import.meta as any).env?.VITE_BLOCK_CATEGORIES as
  | string
  | undefined;
const DEFAULT_LABELS: Record<string, string> = {
  hero: 'Hero секция',
  features: 'Особенности',
  testimonials: 'Отзывы',
  pricing: 'Цены',
  cta: 'Призыв к действию',
  about: 'О нас',
  contact: 'Контакты',
};
const BLOCK_CATEGORIES = (
  RAW_CATEGORIES
    ? RAW_CATEGORIES.split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : ['hero', 'features', 'testimonials', 'pricing', 'cta', 'about', 'contact']
).map((value) => ({ value, label: DEFAULT_LABELS[value] ?? value }));

interface GenerateFormProps {
  prompt: string;
  setPrompt: (value: string) => void;
  selectedCategories: string[];
  toggleCategory: (category: string) => void;
  error: string | null;
  isLoading: boolean;
  onGenerate: () => void;
  onBackToEditor: () => void;
}

export const GenerateForm = ({
  prompt,
  setPrompt,
  selectedCategories,
  toggleCategory,
  error,
  isLoading,
  onGenerate,
  onBackToEditor,
}: GenerateFormProps) => {
  return (
    <VStack gap="16px" align="stretch">
      <Box>
        <Text mb="8px" fontWeight="medium">
          Описание лендинга
        </Text>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Например: Создай лендинг для интернет-магазина электроники с hero-секцией, каталогом товаров и формой обратной связи"
          minHeight="120px"
          backgroundColor="white"
        />
      </Box>

      <Box>
        <Text mb="8px" fontWeight="medium">
          Категории блоков (опционально)
        </Text>
        <HStack gap="8px" flexWrap="wrap">
          {BLOCK_CATEGORIES.map((category) => (
            <Badge
              key={category.value}
              as="button"
              onClick={() => toggleCategory(category.value)}
              padding="8px 16px"
              borderRadius="full"
              cursor="pointer"
              backgroundColor={
                selectedCategories.includes(category.value)
                  ? 'blue.500'
                  : 'gray.200'
              }
              color={
                selectedCategories.includes(category.value)
                  ? 'white'
                  : 'gray.700'
              }
              _hover={{
                backgroundColor: selectedCategories.includes(category.value)
                  ? 'blue.600'
                  : 'gray.300',
              }}
            >
              {category.label}
            </Badge>
          ))}
        </HStack>
      </Box>

      {error && (
        <Alert.Root status="error">
          <Box as="span" marginRight="8px">
            <AlertTriangle size={16} />
          </Box>
          <Alert.Description>{error}</Alert.Description>
        </Alert.Root>
      )}

      {!isLoading && (
        <Button
          onClick={onGenerate}
          loading={isLoading}
          loadingText="Генерация..."
          colorScheme="blue"
          size="lg"
          width="100%"
          disabled={!prompt.trim() || isLoading}
        >
          Сгенерировать лендинг
        </Button>
      )}

      {!isLoading && (
        <Button
          onClick={onBackToEditor}
          variant="outline"
          size="md"
          width="100%"
        >
          Вернуться в редактор
        </Button>
      )}
    </VStack>
  );
};

