import type { Project } from '../../types';
import { updateProject, getProject } from '../../lib/api/projects';

const STORAGE_KEY = 'landing-constructor-project';

const defaultProject: Project = {
  projectName: 'Новый лендинг',
  header: {
    logoUrl: '',
    companyName: 'Моя компания',
    backgroundColor: '#ffffff',
    textColor: '#000000',
  },
  blocks: [],
  footer: {
    text: '© 2025 My Landing',
    backgroundColor: '#f5f5f5',
    textColor: '#000000',
  },
  theme: {
    mode: 'light',
    accent: '#007bff',
    text: '#000000',
    heading: '#000000',
    background: '#ffffff',
    surface: '#f5f5f5',
    border: '#e0e0e0',
  },
};

export const getDefaultProject = (): Project => ({ ...defaultProject });

export const saveToLocalStorage = (project: Project): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  } catch (error) {
    console.error('Ошибка сохранения в LocalStorage:', error);
  }
};

export const loadFromLocalStorage = (): Project | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const project = JSON.parse(stored) as Project;
      return {
        ...defaultProject,
        ...project,
        theme: {
          ...defaultProject.theme,
          ...(project as any).theme || {},
        },
      };
    }
  } catch (error) {
    console.error('Ошибка загрузки из LocalStorage:', error);
  }
  return null;
};

export const saveProjectToApi = async (
  project: Project,
  currentProjectId: number | null
): Promise<void> => {
  if (!currentProjectId) {
    // Если нет ID проекта, сохраняем только в localStorage
    saveToLocalStorage(project);
    return;
  }

  try {
    await updateProject(currentProjectId, {
      title: project.projectName,
      data: project,
    });
    // Также сохраняем в localStorage для офлайн-доступа
    saveToLocalStorage(project);
  } catch (error) {
    console.error('Ошибка сохранения на сервер:', error);
    // В случае ошибки сохраняем в localStorage
    saveToLocalStorage(project);
    throw error;
  }
};

export const loadProjectFromApi = async (id: number): Promise<Project> => {
  try {
    const response = await getProject(id);
    // API возвращает { id, title, data, preview_url, updated_at }
    // где data содержит сам проект (Project объект)
    const apiResponse = response as any;
    
    // Извлекаем данные проекта из поля data
    // Если data есть, используем его, иначе считаем что response уже является проектом
    const projectData = apiResponse.data !== undefined ? apiResponse.data : apiResponse;
    
    return {
      ...defaultProject,
      ...projectData,
      projectName: projectData.projectName || apiResponse.title || defaultProject.projectName,
      header: {
        ...defaultProject.header,
        ...(projectData.header || {}),
      },
      footer: {
        ...defaultProject.footer,
        ...(projectData.footer || {}),
      },
      theme: {
        ...defaultProject.theme,
        ...(projectData.theme || {}),
      },
    };
  } catch (error) {
    console.error('Ошибка загрузки проекта с сервера:', error);
    throw error;
  }
};

