import { useState, useEffect, useRef } from 'react';
import { Box, VStack, Heading, Text, HStack, Button } from '@chakra-ui/react';
import { Brain, ArrowLeft, WandSparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateLanding } from '../lib/api/generateLanding';
import { useGenerateStore } from '../store/useGenerateStore';
import { useProjectStore } from '../store/useProjectStore';
import { useAuthStore } from '../store/useAuthStore';
import { applyPaletteToProject } from '../lib/applyPalette';
import { GenerateForm } from '../components/generate/GenerateForm';
import { GenerateLoading } from '../components/generate/GenerateLoading';
import { GeneratePreview } from '../components/generate/GeneratePreview';

export const GeneratePage = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
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
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    }
  }, [generatedBlocks.length]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Введите описание лендинга');
      return;
    }

    setError(null);
    setLoading(true);
    
    // Даем React время на перерисовку перед началом запроса
    await new Promise(resolve => setTimeout(resolve, 50));
    
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
      setError(err instanceof Error ? err.message : 'Ошибка генерации');
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
      navigate('/editor');
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
    <Box minHeight="100vh" backgroundColor="var(--app-bg-muted)" padding="40px 20px" color="inherit">
      <Box maxWidth="800px" margin="0 auto" backgroundColor="var(--app-surface)" border="1px solid var(--app-border)" borderRadius="8px" padding="20px">
        <HStack justify="flex-start" align="center" marginBottom="12px">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            color="var(--app-accent)"
            _hover={{ backgroundColor: 'var(--app-hover)' }}
          >
            <HStack gap="8px" align="center">
              <ArrowLeft size={18} color="var(--app-accent)" />
              <Text as="span">Назад</Text>
            </HStack>
          </Button>
        </HStack>

        <VStack gap="24px" align="stretch">
          <Heading size="xl" textAlign="center" color="inherit">
            <HStack gap="10px" justify="center" align="center">
              <WandSparkles size={24} color="var(--app-accent)" />
              <Text as="span">Генерация лендинга с помощью AI</Text>
            </HStack>
          </Heading>

          <Text color="var(--app-text-muted)" textAlign="center">
            Опишите, какой лендинг вы хотите создать, и AI сгенерирует его для
            вас
          </Text>

          {isLoading ? (
            <GenerateLoading hasGeneratedBlocks={true} />
          ) : (
            !generatedBlocks.length && (
              <GenerateForm
                prompt={prompt}
                setPrompt={setPrompt}
                selectedCategories={selectedCategories}
                toggleCategory={toggleCategory}
                error={error}
                isLoading={isLoading}
                onGenerate={handleGenerate}
                onBackToEditor={() => navigate('/editor')}
              />
            )
          )}

          {!isLoading && generatedBlocks.length > 0 && (
            <Box ref={previewRef}>
              <GeneratePreview
                generatedBlocks={generatedBlocks}
                generatedPalette={generatedPalette}
                generatedMeta={generatedMeta}
                projectTheme={project.theme}
                isLoading={isLoading}
                onRegenerate={handleRegenerate}
                onAddToProject={handleAddToProject}
              />
            </Box>
          )}
        </VStack>
      </Box>
    </Box>
  );
};
