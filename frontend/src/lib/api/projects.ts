import type { Project } from '../../types';
import { getUserProfile } from './user';

const RAW_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '';

function getApiBaseUrl(): string {
  let base = '';
  if (RAW_BASE) {
    if (RAW_BASE.startsWith('/')) {
      base = `${window.location.origin}${RAW_BASE}`;
    } else {
      base = RAW_BASE;
    }
  } else if (typeof window !== 'undefined') {
    base = window.location.origin;
  } else {
    base = 'http://localhost';
  }
  if (!base.endsWith('/')) base += '/';
  return base;
}

const API_BASE_URL = getApiBaseUrl();

export interface ProjectListItem {
  id: number;
  name: string;
  projectName: string;
  createdAt: string;
  updatedAt: string;
  preview?: string | null;
}

export interface CreateProjectRequest {
  title: string;
  data: Project;
  previewUrl?: string | null;
}

export interface UpdateProjectRequest {
  title?: string;
  data?: Project;
  previewUrl?: string | null;
  isPublic?: boolean;
}

function getAuthToken(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
}

function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function getProjects(): Promise<ProjectListItem[]> {
  const profile = await getUserProfile();
  const url = new URL(`${API_BASE_URL}api/projects`);
  url.searchParams.set('userId', String(profile.id));

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 404) {
      // Mock данные для разработки
      return [];
    }
    const error = await response.json().catch(() => ({ detail: 'Ошибка получения проектов' }));
    throw new Error(error.detail || 'Ошибка получения проектов');
  }

  const data = await response.json();
  return Array.isArray(data) ? data.map((item: any) => ({
    id: item.id,
    name: item.title ?? item.name ?? item.projectName,
    projectName: item.title ?? item.projectName ?? item.name,
    createdAt: (item.created_at ?? item.createdAt ?? new Date().toISOString()),
    updatedAt: (item.updated_at ?? item.updatedAt ?? new Date().toISOString()),
    preview: item.preview_url ?? item.preview ?? null,
  })) : [];
}

export async function getProject(id: number): Promise<Project> {
  const response = await fetch(`${API_BASE_URL}api/projects/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Ошибка получения проекта' }));
    throw new Error(error.detail || 'Ошибка получения проекта');
  }

  const data = await response.json();
  return data.project ?? data;
}

export async function getPublicProject(id: number): Promise<Project> {
  const response = await fetch(`${API_BASE_URL}api/projects/public/${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Ошибка получения публичного проекта' }));
    throw new Error(error.detail || 'Ошибка получения публичного проекта');
  }

  const data = await response.json();
  const raw = data?.data ?? data?.project ?? data;
  const defaults = {
    projectName: 'Новый лендинг',
    header: {
      logoUrl: '',
      companyName: 'Моя компания',
      backgroundColor: '#ffffff',
      textColor: '#213547',
    },
    blocks: [],
    footer: {
      text: '© 2025 My Landing',
      backgroundColor: '#ffffff',
      textColor: '#213547',
    },
    theme: {
      mode: 'light',
      accent: '#4200FF',
      text: '#213547',
      heading: '#213547',
      background: '#ffffff',
      surface: '#ffffff',
      border: '#DCDEE1',
    },
  } as Project;

  const merged: Project = {
    ...defaults,
    ...raw,
    header: { ...defaults.header, ...(raw?.header || {}) },
    footer: { ...defaults.footer, ...(raw?.footer || {}) },
    theme: { ...defaults.theme, ...(raw?.theme || {}) },
    blocks: Array.isArray(raw?.blocks) ? raw.blocks : [],
  };

  return merged;
}

export async function createProject(request: CreateProjectRequest): Promise<ProjectListItem> {
  const response = await fetch(`${API_BASE_URL}api/projects`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      title: request.title,
      data: request.data,
      preview_url: request.previewUrl ?? null,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Ошибка создания проекта' }));
    throw new Error(error.detail || 'Ошибка создания проекта');
  }

  const data = await response.json();
  return {
    id: data.id,
    name: data.title ?? data.projectName ?? data.name,
    projectName: data.title ?? data.projectName ?? data.name,
    createdAt: (data.created_at ?? data.createdAt ?? new Date().toISOString()),
    updatedAt: (data.updated_at ?? data.updatedAt ?? new Date().toISOString()),
    preview: data.preview_url ?? data.preview ?? null,
  };
}

export async function updateProject(id: number, request: UpdateProjectRequest): Promise<void> {
  const response = await fetch(`${API_BASE_URL}api/projects/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      title: request.title,
      data: request.data,
      preview_url: request.previewUrl,
      is_public: request.isPublic,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Ошибка обновления проекта' }));
    throw new Error(error.detail || 'Ошибка обновления проекта');
  }
}

export async function deleteProject(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}api/projects/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Ошибка удаления проекта' }));
    throw new Error(error.detail || 'Ошибка удаления проекта');
  }
}

