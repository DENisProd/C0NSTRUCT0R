import type { Project, ProjectFunction, BlockTemplate } from '../types';

export interface ProjectBundle {
  version: number;
  exportedAt: number;
  project: Project;
  functions: ProjectFunction[];
  templates: BlockTemplate[];
}

export const exportProjectToJSON = (
  project: Project,
  functions: ProjectFunction[],
  templates: BlockTemplate[]
): void => {
  try {
    const customTemplates = (templates || []).filter((t) => t.isCustom);
    const bundle: ProjectBundle = {
      version: 1,
      exportedAt: Date.now(),
      project,
      functions,
      templates: customTemplates,
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const name = (project?.projectName || 'landing-project')
      .replace(/\s+/g, '-')
      .toLowerCase();
    a.href = url;
    a.download = `${name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Ошибка экспорта JSON:', error);
    throw new Error('Не удалось экспортировать проект в JSON');
  }
};

export const importProjectFromJSON = async (
  file: File
): Promise<{
  project?: Project;
  functions?: ProjectFunction[];
  templates?: BlockTemplate[];
}> => {
  try {
    const text = await file.text();
    const data = JSON.parse(text) as ProjectBundle;
    return {
      project: data?.project,
      functions: Array.isArray(data?.functions) ? data.functions : [],
      templates: Array.isArray(data?.templates) ? data.templates : [],
    };
  } catch (error) {
    console.error('Ошибка импорта JSON:', error);
    throw new Error('Не удалось импортировать проект из JSON');
  }
};

