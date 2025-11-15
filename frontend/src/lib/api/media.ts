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

export interface ProjectMedia {
  id: number;
  project_id: number;
  bucket: string;
  object_name: string;
  etag: string | null;
  version_id: string | null;
  content_type: string | null;
  file_url: string | null;
  created_at: string | null;
}

function getAuthToken(): string | null {
  return typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
}

function getAuthHeaders(includeContentType: boolean = true): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function uploadProjectMedia(
  projectId: number,
  file: File
): Promise<ProjectMedia> {
  const formData = new FormData();
  formData.append('file', file);

  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}api/projects/${projectId}/media`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Ошибка загрузки изображения' }));
    throw new Error(error.detail || 'Ошибка загрузки изображения');
  }

  const data = await response.json();
  return {
    id: data.id,
    project_id: data.project_id,
    bucket: data.bucket,
    object_name: data.object_name,
    etag: data.etag,
    version_id: data.version_id,
    content_type: data.content_type,
    file_url: data.file_url,
    created_at: data.created_at,
  };
}

export async function listProjectMedia(projectId: number): Promise<ProjectMedia[]> {
  const response = await fetch(`${API_BASE_URL}api/projects/${projectId}/media`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Ошибка получения списка медиа' }));
    throw new Error(error.detail || 'Ошибка получения списка медиа');
  }

  const data = await response.json();
  return Array.isArray(data) ? data.map((item: any) => ({
    id: item.id,
    project_id: item.project_id,
    bucket: item.bucket,
    object_name: item.object_name,
    etag: item.etag,
    version_id: item.version_id,
    content_type: item.content_type,
    file_url: item.file_url,
    created_at: item.created_at,
  })) : [];
}

export function getMediaUrlByEtag(etag: string): string {
  return `${API_BASE_URL}api/projects/media/by-etag/${etag}`;
}

export async function deleteProjectMedia(projectId: number, mediaId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}api/projects/${projectId}/media/${mediaId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Ошибка удаления медиа' }));
    throw new Error(error.detail || 'Ошибка удаления медиа');
  }
}

