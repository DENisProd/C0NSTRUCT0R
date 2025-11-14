import { Box, VStack, Text, HStack, Heading, Badge, Skeleton, Spinner } from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { Sparkles } from 'lucide-react';

const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.25); opacity: 1; }
  100% { transform: scale(1); opacity: 0.5; }
`;

interface GenerateLoadingProps {
  hasGeneratedBlocks: boolean;
}

export const GenerateLoading = ({ hasGeneratedBlocks }: GenerateLoadingProps) => {
  if (hasGeneratedBlocks) {
    return (
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        backgroundColor="rgba(0,0,0,0.25)"
        display="flex"
        alignItems="center"
        justifyContent="center"
        zIndex={1000}
      >
        <VStack
          gap="12px"
          backgroundColor="var(--app-surface)"
          padding="16px 20px"
          borderRadius="12px"
          boxShadow="md"
        >
          <HStack gap="10px" align="center">
            <Spinner size="md" />
            <Text>Генерация...</Text>
          </HStack>
          <HStack gap="8px">
            <Box
              width="10px"
              height="10px"
              borderRadius="full"
              backgroundColor="blue.500"
              style={{ animation: `${pulse} 0.9s infinite` }}
            />
            <Box
              width="10px"
              height="10px"
              borderRadius="full"
              backgroundColor="blue.500"
              style={{ animation: `${pulse} 0.9s infinite`, animationDelay: '0.2s' }}
            />
            <Box
              width="10px"
              height="10px"
              borderRadius="full"
              backgroundColor="blue.500"
              style={{ animation: `${pulse} 0.9s infinite`, animationDelay: '0.4s' }}
            />
          </HStack>
        </VStack>
      </Box>
    );
  }

  return (
    <VStack gap="24px" align="stretch" marginTop="32px">
      <Box>
        <HStack gap="12px" align="center" marginBottom="8px">
          <Heading size="lg">
            <HStack gap="8px" align="center">
              <Sparkles size={22} />
              <Text as="span">Предпросмотр генерации</Text>
            </HStack>
          </Heading>
          <Badge colorScheme="blue" fontSize="sm" padding="4px 12px">
            Идёт генерация
          </Badge>
        </HStack>
        <Text color="gray.600">Строим блоки и палитру…</Text>
      </Box>

      <Box
        padding="24px"
        backgroundColor="var(--app-surface)"
        borderRadius="12px"
        border="1px solid var(--app-border)"
        boxShadow="sm"
      >
        <Text mb="16px" fontWeight="medium" fontSize="14px" color="gray.700">
          Предпросмотр блоков
        </Text>
        <VStack gap="12px" align="stretch">
          <Skeleton height="24px" />
          <Skeleton height="180px" />
          <Skeleton height="48px" />
          <Skeleton height="160px" />
        </VStack>
      </Box>
    </VStack>
  );
};

