import type { Project } from '../../types';
import { getUserProfile } from './user';

const RAW_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '';

function getApiBaseUrl(): string {
  if (RAW_BASE) {
    if (RAW_BASE.startsWith('/')) {
      return `${window.location.origin}${RAW_BASE}`;
    }
    return RAW_BASE;
  }
  
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    return `${protocol}//${hostname}:8000`;
  }
  
  return 'http://localhost:8000';
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
  const url = new URL(`${API_BASE_URL}/api/projects`);
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
  const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
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

export async function createProject(request: CreateProjectRequest): Promise<ProjectListItem> {
  const response = await fetch(`${API_BASE_URL}/api/projects`, {
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
  const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      title: request.title,
      data: request.data,
      preview_url: request.previewUrl,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Ошибка обновления проекта' }));
    throw new Error(error.detail || 'Ошибка обновления проекта');
  }
}

export async function deleteProject(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Ошибка удаления проекта' }));
    throw new Error(error.detail || 'Ошибка удаления проекта');
  }
}

