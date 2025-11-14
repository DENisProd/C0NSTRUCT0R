import type { Block } from '../../types';

export interface GenerateLandingRequest {
  prompt: string;
  categories?: string[];
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
}

export interface GenerateLandingResponse {
  blocks: Block[];
  palette: ColorPalette;
  meta?: Record<string, any>;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function generateLanding(
  request: GenerateLandingRequest,
  token?: string | null
): Promise<GenerateLandingResponse> {
  const url = `${API_BASE_URL}/api/ai/generate-landing`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Ошибка генерации лендинга' }));
    throw new Error(error.message || 'Ошибка генерации лендинга');
  }

  return response.json();
}

export async function getRandomPalette(token?: string | null): Promise<ColorPalette> {
  const url = `${API_BASE_URL}/api/palette/random`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(url, {
    method: 'GET',
    headers,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Ошибка получения палитры' }));
    throw new Error(error.message || 'Ошибка получения палитры');
  }
  return response.json();
}


