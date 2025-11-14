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
    if (isCreating) {
      return;
    }
    if (!projectName.trim()) {
      window.alert('Введите название проекта');
      return;
    }

    setIsCreating(true);
    try {
      const newProject = await createProject({
        title: projectName.trim(),
        data: {
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
        <Dialog.Content backgroundColor="var(--app-surface)" border="1px solid var(--app-border)" color="inherit" padding="6">
          <Dialog.Header>
            <Dialog.Title color="inherit">Создать новый проект</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            <VStack gap="16px" align="stretch">
              <Text fontSize="14px" color="var(--app-text-muted)">
                Введите название для нового проекта
              </Text>
              <Input
                placeholder="Название проекта"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isCreating) {
                    handleCreate();
                  }
                }}
                autoFocus
                disabled={isCreating}
                backgroundColor="var(--app-surface)"
                border="1px solid var(--app-border)"
                color="inherit"
                _placeholder={{ color: 'var(--app-text-muted)' }}
              />
            </VStack>
          </Dialog.Body>
          <Dialog.Footer>
            <HStack gap="8px" justify="flex-end">
              <Button variant="outline" onClick={onClose} disabled={isCreating} borderColor="var(--app-border)" color="inherit" _hover={{ backgroundColor: 'var(--app-hover)' }}>
                Отмена
              </Button>
              <Button
                onClick={handleCreate}
                loading={isCreating}
                disabled={isCreating}
                backgroundColor="var(--app-accent)"
                color="white"
                _hover={{ backgroundColor: 'var(--app-accent)', opacity: 0.9 }}
              >
                Создать
              </Button>
            </HStack>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};

