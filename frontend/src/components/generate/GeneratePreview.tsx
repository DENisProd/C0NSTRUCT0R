import {
  Box,
  Button,
  Heading,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { buildLandingHtml } from "../../lib/htmlLanding";

// Локальное описание пропсов, без ./types
type GeneratePreviewProps = {
  generatedBlocks: any[] | null;
  generatedPalette?: any | null;
  generatedMeta?: any;
  projectTheme?: any;
  isLoading: boolean;
  onRegenerate: () => void;
  onAddToProject: () => void;
};

export const GeneratePreview = ({
  generatedBlocks,
  generatedPalette,
  generatedMeta,
  projectTheme,
  isLoading,
  onRegenerate,
  onAddToProject,
}: GeneratePreviewProps) => {
  const [htmlUrl, setHtmlUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!generatedBlocks || generatedBlocks.length === 0) {
      if (htmlUrl) {
        URL.revokeObjectURL(htmlUrl);
      }
      setHtmlUrl(null);
      return;
    }

    const html = buildLandingHtml(
      generatedBlocks as any[],
      generatedPalette as any
    );
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    setHtmlUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [generatedBlocks, generatedPalette]);

  if (isLoading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4} color="var(--app-text-muted)">
          Генерация лендинга...
        </Text>
      </Box>
    );
  }

  if (!generatedBlocks || generatedBlocks.length === 0) {
    return (
      <Box py={10} textAlign="center">
        <Text color="var(--app-text-muted)">Пока ничего не сгенерировано</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Heading size="md" mb={3}>
        Результат генерации
      </Heading>

      <Text color="var(--app-text-muted)">
        Просмотрите сгенерированные блоки и добавьте их в проект
      </Text>

      {htmlUrl && (
        <Box mt={2}>
          <Button
            variant="outline"
            size="sm"
            borderColor="var(--app-accent)"
            color="var(--app-accent)"
            _hover={{ backgroundColor: 'var(--app-hover)' }}
            onClick={() => {
              if (htmlUrl) {
                window.open(htmlUrl, "_blank", "noopener,noreferrer");
              }
            }}
          >
            Открыть HTML-лендинг
          </Button>
        </Box>
      )}

      <Box
        mt={4}
        display="flex"
        columnGap="16px"
        rowGap="8px"
        flexWrap="wrap"
      >
        <Button
          variant="outline"
          onClick={onRegenerate}
          borderColor="var(--app-accent)"
          color="var(--app-accent)"
          _hover={{ backgroundColor: 'var(--app-hover)' }}
        >
          Перегенерировать
        </Button>
        <Button
          onClick={onAddToProject}
          backgroundColor="var(--app-accent)"
          color="white"
          _hover={{ backgroundColor: 'var(--app-accent)', opacity: 0.9 }}
        >
          Добавить в проект
        </Button>
      </Box>

      <Box mt={6}>
        {(generatedBlocks as any[]).map((block: any) => (
          <Box
            key={block.id}
            p={4}
            borderWidth="1px"
            borderColor="var(--app-border)"
            backgroundColor="var(--app-surface)"
            borderRadius="lg"
            mb={4}
          >
            <Text fontWeight="bold" mb={2} color="var(--app-text-muted)">
              {block.type}
            </Text>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                fontSize: "12px",
                margin: 0,
              }}
            >
              {JSON.stringify(block, null, 2)}
            </pre>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

