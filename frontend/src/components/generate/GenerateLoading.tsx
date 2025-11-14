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
        backgroundColor="rgba(0,0,0,0.4)"
        display="flex"
        alignItems="center"
        justifyContent="center"
        zIndex={1000}
        backdropFilter="blur(2px)"
      >
        <VStack
          gap="16px"
          backgroundColor="var(--app-surface)"
          padding="24px 32px"
          borderRadius="16px"
          boxShadow="xl"
          minWidth="280px"
        >
          <Spinner size="lg" />
          <VStack gap="8px" align="center">
            <Text fontWeight="medium" fontSize="md">
              Генерация...
            </Text>
            <HStack gap="8px">
              <Box
                width="8px"
                height="8px"
                borderRadius="full"
                backgroundColor="var(--app-accent)"
                style={{ animation: `${pulse} 0.9s infinite` }}
              />
              <Box
                width="8px"
                height="8px"
                borderRadius="full"
                backgroundColor="var(--app-accent)"
                style={{ animation: `${pulse} 0.9s infinite`, animationDelay: '0.2s' }}
              />
              <Box
                width="8px"
                height="8px"
                borderRadius="full"
                backgroundColor="var(--app-accent)"
                style={{ animation: `${pulse} 0.9s infinite`, animationDelay: '0.4s' }}
              />
            </HStack>
          </VStack>
        </VStack>
      </Box>
    );
  }

  return (
    <VStack gap="32px" align="center" marginTop="48px" marginBottom="48px">
      <VStack gap="20px" align="center">
        <Spinner size="xl" />
        <VStack gap="8px" align="center">
          <Heading size="lg">
            <HStack gap="8px" align="center">
              <Sparkles size={22} color="var(--app-accent)" />
              <Text as="span">Генерация лендинга</Text>
            </HStack>
          </Heading>
          <Text color="var(--app-text-muted)" fontSize="md">
            Строим блоки и палитру…
          </Text>
        </VStack>
        <HStack gap="8px" marginTop="8px">
          <Box
            width="10px"
            height="10px"
            borderRadius="full"
            backgroundColor="var(--app-accent)"
            style={{ animation: `${pulse} 0.9s infinite` }}
          />
          <Box
            width="10px"
            height="10px"
            borderRadius="full"
            backgroundColor="var(--app-accent)"
            style={{ animation: `${pulse} 0.9s infinite`, animationDelay: '0.2s' }}
          />
          <Box
            width="10px"
            height="10px"
            borderRadius="full"
            backgroundColor="var(--app-accent)"
            style={{ animation: `${pulse} 0.9s infinite`, animationDelay: '0.4s' }}
          />
        </HStack>
      </VStack>

      <Box
        padding="24px"
        backgroundColor="var(--app-surface)"
        borderRadius="12px"
        border="1px solid var(--app-border)"
        boxShadow="sm"
        width="100%"
        maxWidth="600px"
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

