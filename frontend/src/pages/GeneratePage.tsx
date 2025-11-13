import { useState, useEffect, useRef } from "react";
import {
  Box,
  VStack,
  Textarea,
  Button,
  Heading,
  Text,
  Spinner,
  Alert,
  HStack,
  Badge,
  Skeleton,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { Brain, Sparkles, Info, AlertTriangle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { generateLanding } from "../lib/api/generateLanding";
import { useGenerateStore } from "../store/useGenerateStore";
import { useProjectStore } from "../store/useProjectStore";
import { useAuthStore } from "../store/useAuthStore";
import { applyPaletteToProject } from "../lib/applyPalette";
import { BlockRenderer } from "../components/blocks/BlockRenderer";

const RAW_CATEGORIES = (import.meta as any).env?.VITE_BLOCK_CATEGORIES as
  | string
  | undefined;
const DEFAULT_LABELS: Record<string, string> = {
  hero: "Hero секция",
  features: "Особенности",
  testimonials: "Отзывы",
  pricing: "Цены",
  cta: "Призыв к действию",
  about: "О нас",
  contact: "Контакты",
};
const BLOCK_CATEGORIES = (
  RAW_CATEGORIES
    ? RAW_CATEGORIES.split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : ["hero", "features", "testimonials", "pricing", "cta", "about", "contact"]
).map((value) => ({ value, label: DEFAULT_LABELS[value] ?? value }));

const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.25); opacity: 1; }
  100% { transform: scale(1); opacity: 0.5; }
`;

export const GeneratePage = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const {
    isLoading,
    error,
    setLoading,
    setError,
    setGenerated,
    generatedBlocks,
    generatedPalette,
    generatedMeta,
    clearGenerated,
  } = useGenerateStore();
  const { addTemplateBlocks, updateTheme, project } = useProjectStore();
  const { token } = useAuthStore();
  const previewRef = useRef<HTMLDivElement>(null);

  // Автоматическая прокрутка к превью после генерации
  useEffect(() => {
    if (generatedBlocks.length > 0 && previewRef.current) {
      setTimeout(() => {
        previewRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [generatedBlocks.length]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Введите описание лендинга");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await generateLanding(
        {
          prompt: prompt.trim(),
          categories:
            selectedCategories.length > 0 ? selectedCategories : undefined,
        },
        token
      );

      setGenerated(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка генерации");
    }
  };

  const handleAddToProject = () => {
    if (generatedBlocks.length > 0) {
      // Применяем палитру к проекту
      if (generatedPalette) {
        applyPaletteToProject(generatedPalette, updateTheme);
      }

      // Добавляем блоки в проект
      addTemplateBlocks(generatedBlocks);

      // Очищаем сгенерированные данные
      clearGenerated();

      // Переходим в редактор
      navigate("/editor");
    }
  };

  const handleRegenerate = () => {
    clearGenerated();
    setError(null);
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  return (
    <Box minHeight="100vh" backgroundColor="#f5f5f5" padding="40px 20px">
      <Box maxWidth="800px" margin="0 auto">
        <HStack justify="flex-start" align="center" marginBottom="12px">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <HStack gap="8px" align="center">
              <ArrowLeft size={18} />
              <Text as="span">Назад</Text>
            </HStack>
          </Button>
        </HStack>
        {isLoading && generatedBlocks.length > 0 && (
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
              backgroundColor="#fff"
              padding="16px 20px"
              borderRadius="12px"
              boxShadow="md"
            >
              <HStack gap="10px" align="center">
                <Spinner size="md" />
                <Text>Генерация...</Text>
              </HStack>
              <HStack gap="8px">
                <Box width="10px" height="10px" borderRadius="full" backgroundColor="blue.500" style={{ animation: `${pulse} 0.9s infinite` }} />
                <Box width="10px" height="10px" borderRadius="full" backgroundColor="blue.500" style={{ animation: `${pulse} 0.9s infinite`, animationDelay: "0.2s" }} />
                <Box width="10px" height="10px" borderRadius="full" backgroundColor="blue.500" style={{ animation: `${pulse} 0.9s infinite`, animationDelay: "0.4s" }} />
              </HStack>
            </VStack>
          </Box>
        )}
        <VStack gap="24px" align="stretch">
          <Heading size="xl" textAlign="center">
            <HStack gap="10px" justify="center" align="center">
              <Brain size={24} />
              <Text as="span">Генерация лендинга с помощью AI</Text>
            </HStack>
          </Heading>

          <Text color="gray.600" textAlign="center">
            Опишите, какой лендинг вы хотите создать, и AI сгенерирует его для
            вас
          </Text>

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
                        ? "blue.500"
                        : "gray.200"
                    }
                    color={
                      selectedCategories.includes(category.value)
                        ? "white"
                        : "gray.700"
                    }
                    _hover={{
                      backgroundColor: selectedCategories.includes(
                        category.value
                      )
                        ? "blue.600"
                        : "gray.300",
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

            {generatedBlocks.length === 0 && (
              <Button
                onClick={handleGenerate}
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

            {generatedBlocks.length === 0 && (
              <Button
                onClick={() => navigate("/editor")}
                variant="outline"
                size="md"
                width="100%"
              >
                Вернуться в редактор
              </Button>
            )}

            {isLoading && generatedBlocks.length === 0 && (
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
                  backgroundColor="white"
                  borderRadius="12px"
                  border="1px solid"
                  borderColor="gray.200"
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
            )}
          </VStack>

          {/* Превью сгенерированных блоков */}
          {generatedBlocks.length > 0 && (
            <VStack
              gap="24px"
              align="stretch"
              marginTop="32px"
              ref={previewRef}
            >
              <HStack gap="12px" justify="flex-end">
                <Button
                  variant="outline"
                  onClick={handleRegenerate}
                  disabled={isLoading}
                >
                  Сгенерировать заново
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={handleAddToProject}
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
                    {generatedBlocks.length}{" "}
                    {generatedBlocks.length === 1 ? "блок" : "блоков"}
                  </Badge>
                </HStack>
                <Text color="gray.600">
                  Просмотрите сгенерированные блоки и добавьте их в проект
                </Text>
                {generatedMeta && (
                  <Alert.Root
                    status={
                      generatedMeta.provider === "gemini" ? "info" : "warning"
                    }
                  >
                    <Box as="span" marginRight="8px">
                      <Info size={16} />
                    </Box>
                    <Alert.Description>
                      {generatedMeta.provider === "gemini"
                        ? `Источник: Gemini (${
                            generatedMeta.model || "модель неизвестна"
                          })`
                        : "Фолбек: используется моковый генератор"}
                      {generatedMeta.gemini_last_error
                        ? ` — Ошибка Gemini: ${String(
                            generatedMeta.gemini_last_error
                          )}`
                        : ""}
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
                    generatedPalette?.background || project.theme.background
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
          )}
        </VStack>
      </Box>
    </Box>
  );
};


