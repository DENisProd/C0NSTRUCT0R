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

const API_BASE_URL =
  import.meta.env.VITE_LIBRARY_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8001';

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
  const response = await fetch(`${API_BASE_URL}/api/library/ready`);
  if (!response.ok) {
    throw new Error('Ошибка загрузки системных блоков');
  }
  const data = await response.json();
  return Array.isArray(data) ? data.map(mapLibraryBlock) : [];
}

export async function getUserBlocks(): Promise<LibraryBlock[]> {
  const response = await fetch(`${API_BASE_URL}/api/library/blocks?is_custom=true`);
  if (!response.ok) {
    throw new Error('Ошибка загрузки пользовательских блоков');
  }
  const data = await response.json();
  return Array.isArray(data) ? data.map(mapLibraryBlock) : [];
}

export async function getCommunityBlocks(): Promise<LibraryBlock[]> {
  const response = await fetch(`${API_BASE_URL}/api/library/blocks?is_custom=false`);
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
  const response = await fetch(`${API_BASE_URL}/api/library/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Ошибка загрузки блока' }));
    throw new Error(error.message || 'Ошибка загрузки блока');
  }

  const data = await response.json();
  return mapLibraryBlock(data);
}


