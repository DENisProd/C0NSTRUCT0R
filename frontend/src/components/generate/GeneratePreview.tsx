import {
  Box,
  VStack,
  Text,
  Button,
  HStack,
  Heading,
  Badge,
} from '@chakra-ui/react';
import { Sparkles, Info } from 'lucide-react';
import { Alert } from '@chakra-ui/react';
import { BlockRenderer } from '../blocks/BlockRenderer';
import type { Block } from '../../types';

interface GeneratePreviewProps {
  generatedBlocks: Block[];
  generatedPalette: any;
  generatedMeta: any;
  projectTheme: any;
  isLoading: boolean;
  onRegenerate: () => void;
  onAddToProject: () => void;
}

export const GeneratePreview = ({
  generatedBlocks,
  generatedPalette,
  generatedMeta,
  projectTheme,
  isLoading,
  onRegenerate,
  onAddToProject,
}: GeneratePreviewProps) => {
  return (
    <VStack gap="24px" align="stretch" marginTop="32px">
      <HStack gap="12px" justify="flex-end">
        <Button
          variant="outline"
          onClick={onRegenerate}
          disabled={isLoading}
        >
          Сгенерировать заново
        </Button>
        <Button
          colorScheme="blue"
          onClick={onAddToProject}
          disabled={isLoading}
        >
          Добавить в проект
        </Button>
      </HStack>
      <Box>
        <HStack gap="12px" align="center" marginBottom="8px">
          <Heading size="lg">
            <HStack gap="8px" align="center">
              <Sparkles size={22} />
              <Text as="span">Результат генерации</Text>
            </HStack>
          </Heading>
          <Badge colorScheme="green" fontSize="sm" padding="4px 12px">
            {generatedBlocks.length}{' '}
            {generatedBlocks.length === 1 ? 'блок' : 'блоков'}
          </Badge>
        </HStack>
        <Text color="gray.600">
          Просмотрите сгенерированные блоки и добавьте их в проект
        </Text>
        {generatedMeta && (
          <Alert.Root
            status={generatedMeta.provider === 'gemini' ? 'info' : 'warning'}
          >
            <Box as="span" marginRight="8px">
              <Info size={16} />
            </Box>
            <Alert.Description>
              {generatedMeta.provider === 'gemini'
                ? `Источник: Gemini (${
                    generatedMeta.model || 'модель неизвестна'
                  })`
                : 'Фолбек: используется моковый генератор'}
              {generatedMeta.gemini_last_error
                ? ` — Ошибка Gemini: ${String(generatedMeta.gemini_last_error)}`
                : ''}
            </Alert.Description>
          </Alert.Root>
        )}
      </Box>

      <Box
        padding="24px"
        backgroundColor="white"
        borderRadius="12px"
        border="1px solid"
        borderColor="gray.200"
        boxShadow="sm"
      >
        <Text
          mb="16px"
          fontWeight="medium"
          fontSize="14px"
          color="gray.700"
        >
          Предпросмотр блоков
        </Text>
        <Box
          width="100%"
          padding="16px"
          backgroundColor={
            generatedPalette?.background || projectTheme.background
          }
          borderRadius="10px"
          border="1px solid"
          borderColor="gray.300"
          boxShadow="sm"
        >
          <VStack gap="16px" align="stretch">
            {generatedBlocks.map((block, idx) => (
              <Box key={block.id}>
                <BlockRenderer block={block} isPreview={true} />
                {idx !== generatedBlocks.length - 1 && (
                  <Box
                    height="1px"
                    backgroundColor="gray.200"
                    marginTop="16px"
                  />
                )}
              </Box>
            ))}
          </VStack>
        </Box>
      </Box>
    </VStack>
  );
};

