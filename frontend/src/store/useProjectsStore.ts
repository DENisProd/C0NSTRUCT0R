import { create } from 'zustand';
import type { ProjectListItem, CreateProjectRequest, UpdateProjectRequest } from '../lib/api/projects';
import { getProjects, createProject as createProjectApi, updateProject as updateProjectApi, deleteProject as deleteProjectApi, getProject } from '../lib/api/projects';
import type { Project } from '../types';

interface ProjectsStore {
  projects: ProjectListItem[];
  isLoading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  createProject: (request: CreateProjectRequest) => Promise<ProjectListItem>;
  updateProject: (id: number, request: UpdateProjectRequest) => Promise<void>;
  deleteProject: (id: number) => Promise<void>;
  loadProject: (id: number) => Promise<Project>;
  clearProjects: () => void;
}

export const useProjectsStore = create<ProjectsStore>((set, get) => ({
  projects: [],
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const projects = await getProjects();
      set({ projects, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки проектов';
      set({ error: errorMessage, isLoading: false });
      console.error('Ошибка загрузки проектов:', error);
    }
  },

  createProject: async (request) => {
    set({ isLoading: true, error: null });
    try {
      const newProject = await createProjectApi(request);
      set((state) => ({
        projects: [...state.projects, newProject],
        isLoading: false,
      }));
      return newProject;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка создания проекта';
      set({ error: errorMessage, isLoading: false });
      console.error('Ошибка создания проекта:', error);
      throw error;
    }
  },

  updateProject: async (id, request) => {
    set({ isLoading: true, error: null });
    try {
      await updateProjectApi(id, request);
      // Обновляем проект в списке
      set((state) => ({
        projects: state.projects.map((p) =>
          p.id === id
            ? {
                ...p,
                name: request.title ?? p.name,
                projectName: request.title ?? p.projectName,
                updatedAt: new Date().toISOString(),
              }
            : p
        ),
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка обновления проекта';
      set({ error: errorMessage, isLoading: false });
      console.error('Ошибка обновления проекта:', error);
      throw error;
    }
  },

  deleteProject: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await deleteProjectApi(id);
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка удаления проекта';
      set({ error: errorMessage, isLoading: false });
      console.error('Ошибка удаления проекта:', error);
      throw error;
    }
  },

  loadProject: async (id) => {
    try {
      return await getProject(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки проекта';
      console.error('Ошибка загрузки проекта:', error);
      throw new Error(errorMessage);
    }
  },

  clearProjects: () => {
    set({ projects: [], error: null });
  },
}));

