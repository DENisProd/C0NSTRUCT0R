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
}

const API_BASE_URL =
  import.meta.env.VITE_ML_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:3000';

export async function generateLanding(
  request: GenerateLandingRequest
): Promise<GenerateLandingResponse> {
  const response = await fetch(`${API_BASE_URL}/api/ai/generate-landing`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Ошибка генерации лендинга' }));
    throw new Error(error.message || 'Ошибка генерации лендинга');
  }

  return response.json();
}


