import { Box, VStack, HStack, Text, Button, SimpleGrid, Spinner, Card } from '@chakra-ui/react';
import { Edit, Trash2, Plus, Calendar } from 'lucide-react';
import { useProjectsStore } from '../store/useProjectsStore';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface UserProjectsListProps {
  onCreateClick: () => void;
}

export const UserProjectsList = ({ onCreateClick }: UserProjectsListProps) => {
  const { projects, isLoading, deleteProject: deleteProjectAction } = useProjectsStore();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const navigate = useNavigate();

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Вы уверены, что хотите удалить проект "${name}"?`)) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteProjectAction(id);
    } catch (error) {
      console.error('Ошибка удаления проекта:', error);
      window.alert('Не удалось удалить проект');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (id: number) => {
    navigate(`/editor/${id}`);
  };

  if (isLoading && projects.length === 0) {
    return (
      <Box
        padding="24px"
        backgroundColor="#ffffff"
        borderRadius="8px"
        border="1px solid #e0e0e0"
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <Spinner size="lg" />
      </Box>
    );
  }

  return (
    <VStack gap="16px" align="stretch">
      <HStack justifyContent="space-between">
        <Text fontSize="20px" fontWeight="bold">
          Мои проекты ({projects.length})
        </Text>
        <Button
          size="sm"
          onClick={onCreateClick}
          backgroundColor="var(--app-accent)"
          color="white"
          _hover={{ backgroundColor: 'var(--app-accent)', opacity: 0.9 }}
        >
          <HStack gap="6px">
            <Plus size={16} />
            <Box as="span">Создать проект</Box>
          </HStack>
        </Button>
      </HStack>

      {projects.length === 0 ? (
        <Box
          padding="48px"
          backgroundColor="#ffffff"
          borderRadius="8px"
          border="1px solid #e0e0e0"
          textAlign="center"
        >
          <VStack gap="16px">
            <Text fontSize="16px" color="gray.600">
              У вас пока нет проектов
            </Text>
            <Button
              onClick={onCreateClick}
              backgroundColor="var(--app-accent)"
              color="white"
              _hover={{ backgroundColor: 'var(--app-accent)', opacity: 0.9 }}
            >
              <HStack gap="6px">
                <Plus size={16} />
                <Box as="span">Создать первый проект</Box>
              </HStack>
            </Button>
          </VStack>
        </Box>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="16px">
          {projects.map((project) => (
            <Card.Root key={project.id} padding="16px" border="1px solid #e0e0e0">
              <VStack gap="12px" align="stretch">
                <Text fontSize="18px" fontWeight="bold">
                  {project.name || project.projectName}
                </Text>
                <HStack gap="8px" fontSize="12px" color="gray.600">
                  <Calendar size={14} />
                  <Text>
                    {new Date(project.updatedAt).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </HStack>
                <HStack gap="8px" marginTop="8px">
                  <Button
                    size="sm"
                    variant="outline"
                    flex="1"
                    onClick={() => handleEdit(project.id)}
                  >
                    <HStack gap="4px">
                      <Edit size={14} />
                      <Box as="span">Редактировать</Box>
                    </HStack>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    colorScheme="red"
                    onClick={() => handleDelete(project.id, project.name || project.projectName)}
                    disabled={deletingId === project.id}
                  >
                    {deletingId === project.id ? (
                      <Spinner size="sm" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </Button>
                </HStack>
              </VStack>
            </Card.Root>
          ))}
        </SimpleGrid>
      )}
    </VStack>
  );
};

