import type { Block } from '../../types';

export interface LibraryBlock {
  id: string;
  name: string;
  description?: string;
  category: string;
  tags?: string[];
  author?: string;
  preview?: string;
  blocks: Block[];
  isCustom?: boolean;
  createdAt: number;
}

const RAW_BASE =
  import.meta.env.VITE_LIBRARY_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  '';

// Получаем правильный API URL
function getApiBaseUrl(): string {
  if (RAW_BASE) {
    if (RAW_BASE.startsWith('/')) {
      return `${window.location.origin}${RAW_BASE}`;
    }
    return RAW_BASE;
  }
  
  // Fallback: используем порт бекенда (8000)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    return `${protocol}//${hostname}:8000/api`;
  }
  
  return 'http://localhost:8000/api';
}

const API_BASE_URL = getApiBaseUrl();

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

function mapLibraryBlock(item: any): LibraryBlock {
  return {
    id: String(item.id),
    name: item.name,
    description: item.description,
    category: item.category,
    tags: item.tags,
    author: item.author,
    preview: item.preview,
    blocks: item.blocks ?? [],
    isCustom: item.is_custom ?? item.isCustom ?? false,
    createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
  };
}

export async function getSystemBlocks(): Promise<LibraryBlock[]> {
  const response = await fetch(`${API_BASE_URL}/library/ready`);
  if (!response.ok) {
    throw new Error('Ошибка загрузки системных блоков');
  }
  const data = await response.json();
  return Array.isArray(data) ? data.map(mapLibraryBlock) : [];
}

export async function getUserBlocks(): Promise<LibraryBlock[]> {
  const response = await fetch(`${API_BASE_URL}/library/blocks?is_custom=true`);
  if (!response.ok) {
    throw new Error('Ошибка загрузки пользовательских блоков');
  }
  const data = await response.json();
  return Array.isArray(data) ? data.map(mapLibraryBlock) : [];
}

export async function getCommunityBlocks(): Promise<LibraryBlock[]> {
  const response = await fetch(`${API_BASE_URL}/library/blocks?is_custom=false`);
  if (!response.ok) {
    throw new Error('Ошибка загрузки блоков сообщества');
  }
  const data = await response.json();
  return Array.isArray(data) ? data.map(mapLibraryBlock) : [];
}

export interface UploadBlockRequest {
  name: string;
  description?: string;
  category: string;
  tags?: string[];
  blocks: Block[];
}

export async function uploadBlock(request: UploadBlockRequest): Promise<LibraryBlock> {
  const response = await fetch(`${API_BASE_URL}/library/upload`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Ошибка загрузки блока' }));
    throw new Error(error.detail || error.message || 'Ошибка загрузки блока');
  }

  const data = await response.json();
  return mapLibraryBlock(data);
}

export async function getBlock(blockId: number): Promise<LibraryBlock> {
  const response = await fetch(`${API_BASE_URL}/library/block/${blockId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Ошибка получения блока' }));
    throw new Error(error.detail || 'Ошибка получения блока');
  }

  const data = await response.json();
  return mapLibraryBlock(data);
}

export interface UpdateBlockRequest {
  name?: string;
  description?: string;
  category?: string;
  tags?: string[];
  blocks?: Block[];
  preview?: string;
}

export async function updateBlock(blockId: number, request: UpdateBlockRequest): Promise<LibraryBlock> {
  const response = await fetch(`${API_BASE_URL}/library/block/${blockId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Ошибка обновления блока' }));
    throw new Error(error.detail || 'Ошибка обновления блока');
  }

  const data = await response.json();
  return mapLibraryBlock(data);
}

export async function deleteBlock(blockId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/library/block/${blockId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Ошибка удаления блока' }));
    throw new Error(error.detail || 'Ошибка удаления блока');
  }
}

export async function createReadyBlock(request: UploadBlockRequest): Promise<LibraryBlock> {
  const response = await fetch(`${API_BASE_URL}/library/ready`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Ошибка создания готового блока' }));
    throw new Error(error.detail || 'Ошибка создания готового блока');
  }

  const data = await response.json();
  return mapLibraryBlock(data);
}


