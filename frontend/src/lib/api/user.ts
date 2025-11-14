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

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  hasAvatar: boolean;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  projectsCount?: number;
  blocksCount?: number;
}

export interface UpdateUserProfileRequest {
  username?: string;
  avatar?: File;
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

export async function getUserProfile(): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/api/user/me`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      try {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          window.location.assign('/auth/login');
        }
      } catch {}
      throw new Error('Unauthorized');
    }
    if (response.status === 404) {
      // Mock данные для разработки, если endpoint не реализован
      const token = getAuthToken();
      if (token) {
        // Парсим username из токена или используем дефолтные значения
        return {
          id: 1,
          username: 'user',
          email: 'user@example.com',
          hasAvatar: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          projectsCount: 0,
          blocksCount: 0,
        };
      }
    }
    const error = await response.json().catch(() => ({ detail: 'Ошибка получения профиля' }));
    throw new Error(error.detail || 'Ошибка получения профиля');
  }

  const data = await response.json();
  return {
    id: data.id,
    username: data.username,
    email: data.email,
    hasAvatar: data.has_avatar ?? data.hasAvatar ?? false,
    avatarUrl: data.avatar_url ?? data.avatarUrl,
    createdAt: data.created_at ?? data.createdAt,
    updatedAt: data.updated_at ?? data.updatedAt,
    projectsCount: data.projects_count ?? data.projectsCount,
    blocksCount: data.blocks_count ?? data.blocksCount,
  };
}

export async function updateUserProfile(request: UpdateUserProfileRequest): Promise<UserProfile> {
  const token = getAuthToken();
  const formData = new FormData();
  
  if (request.username) {
    formData.append('username', request.username);
  }
  if (request.avatar) {
    formData.append('avatar', request.avatar);
  }

  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/user/me`, {
    method: 'PUT',
    headers,
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 401) {
      try {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          window.location.assign('/auth/login');
        }
      } catch {}
      throw new Error('Unauthorized');
    }
    const error = await response.json().catch(() => ({ detail: 'Ошибка обновления профиля' }));
    throw new Error(error.detail || 'Ошибка обновления профиля');
  }

  const data = await response.json();
  return {
    id: data.id,
    username: data.username,
    email: data.email,
    hasAvatar: data.has_avatar ?? data.hasAvatar ?? false,
    avatarUrl: data.avatar_url ?? data.avatarUrl,
    createdAt: data.created_at ?? data.createdAt,
    updatedAt: data.updated_at ?? data.updatedAt,
    projectsCount: data.projects_count ?? data.projectsCount,
    blocksCount: data.blocks_count ?? data.blocksCount,
  };
}

