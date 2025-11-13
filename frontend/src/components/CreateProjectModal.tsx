import { Dialog, Input, Button, VStack, HStack, Text } from '@chakra-ui/react';
import { useState } from 'react';
import { useProjectsStore } from '../store/useProjectsStore';
import { useProjectStore } from '../store/useProjectStore';
import { useNavigate } from 'react-router-dom';
import type { Project } from '../types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateProjectModal = ({ isOpen, onClose }: CreateProjectModalProps) => {
  const [projectName, setProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { createProject } = useProjectsStore();
  const { project: defaultProject, setCurrentProjectId } = useProjectStore();
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!projectName.trim()) {
      window.alert('Введите название проекта');
      return;
    }

    setIsCreating(true);
    try {
      const newProject = await createProject({
        name: projectName.trim(),
        project: {
          ...defaultProject,
          projectName: projectName.trim(),
        },
      });
      setCurrentProjectId(newProject.id);
      onClose();
      setProjectName('');
      navigate(`/editor/${newProject.id}`);
    } catch (error) {
      console.error('Ошибка создания проекта:', error);
      window.alert('Не удалось создать проект');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>Создать новый проект</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            <VStack gap="16px" align="stretch">
              <Text fontSize="14px" color="gray.600">
                Введите название для нового проекта
              </Text>
              <Input
                placeholder="Название проекта"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreate();
                  }
                }}
                autoFocus
              />
            </VStack>
          </Dialog.Body>
          <Dialog.Footer>
            <HStack gap="8px">
              <Button variant="outline" onClick={onClose} disabled={isCreating}>
                Отмена
              </Button>
              <Button colorScheme="blue" onClick={handleCreate} loading={isCreating}>
                Создать
              </Button>
            </HStack>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

