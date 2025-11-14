import { Box, VStack, Tabs, Container, Spinner } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useUserStore } from '../store/useUserStore';
import { useProjectsStore } from '../store/useProjectsStore';
import { UserInfoCard } from '../components/UserInfoCard';
import { UserProjectsList } from '../components/UserProjectsList';
import { UserBlocksList } from '../components/UserBlocksList';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { HeaderService } from '../components/Header';
import { useNavigate, useLocation } from 'react-router-dom';

export const ProfilePage = () => {
  const { profile, fetchProfile, isLoading: userLoading } = useUserStore();
  const { fetchProjects, isLoading: projectsLoading } = useProjectsStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const initialTab = new URLSearchParams(location.search).get('tab') || 'projects';

  useEffect(() => {
    fetchProfile();
    fetchProjects();
  }, [fetchProfile, fetchProjects]);

  const handleAddBlock = () => {
    navigate('/library/add');
  };

  if (userLoading && !profile) {
    return (
      <Box minHeight="100vh" display="flex" flexDirection="column">
        <HeaderService />
        <Box flex="1" display="flex" justifyContent="center" alignItems="center">
          <Spinner size="lg" />
        </Box>
      </Box>
    );
  }

  return (
    <Box minHeight="100vh" display="flex" flexDirection="column">
      <HeaderService />
      <Box flex="1" backgroundColor="var(--app-bg-muted)" padding={{ base: '16px', md: '24px' }}>
        <Container maxWidth="1200px" paddingX={{ base: '8px', md: '16px' }}>
          <VStack gap={{ base: '16px', md: '24px' }} align="stretch">
            <UserInfoCard />

            <Tabs.Root defaultValue={initialTab} variant="enclosed">
              <Tabs.List
                backgroundColor="var(--app-surface)"
                border="1px solid var(--app-border)"
                borderRadius="8px"
                padding="6px"
                gap="8px"
              >
                <Tabs.Trigger
                  value="projects"
                  color="inherit"
                  border="1px solid var(--app-border)"
                  borderRadius="6px"
                  padding="8px 12px"
                  _hover={{ backgroundColor: 'var(--app-hover)' }}
                  _selected={{ backgroundColor: 'var(--app-selected)', color: 'inherit', borderColor: 'var(--app-accent)' }}
                >
                  Мои проекты
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="blocks"
                  color="inherit"
                  border="1px solid var(--app-border)"
                  borderRadius="6px"
                  padding="8px 12px"
                  _hover={{ backgroundColor: 'var(--app-hover)' }}
                  _selected={{ backgroundColor: 'var(--app-selected)', color: 'inherit', borderColor: 'var(--app-accent)' }}
                >
                  Мои блоки
                </Tabs.Trigger>
              </Tabs.List>

              <Box 
                padding={{ base: '16px', md: '24px' }} 
                backgroundColor="var(--app-surface)" 
                borderRadius="8px" 
                border="1px solid var(--app-border)" 
                marginTop="16px"
                color="inherit"
              >
                <Tabs.Content value="projects">
                  <UserProjectsList onCreateClick={() => setIsCreateModalOpen(true)} />
                </Tabs.Content>
                <Tabs.Content value="blocks">
                  <UserBlocksList onAddClick={handleAddBlock} />
                </Tabs.Content>
              </Box>
            </Tabs.Root>
          </VStack>
        </Container>
      </Box>

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </Box>
  );
};

