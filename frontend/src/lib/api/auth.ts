const RAW_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '';

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
    return `${protocol}//${hostname}:8000`;
  }
  
  return 'http://localhost:8000';
}

const API_BASE_URL = getApiBaseUrl();

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  expires_in: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

export async function registerUser(payload: RegisterRequest): Promise<void> {
  const resp = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const e = await resp.json().catch(() => ({}));
    throw new Error(e.detail || 'Ошибка регистрации');
  }
}

export async function login(payload: LoginRequest): Promise<TokenResponse> {
  const resp = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const e = await resp.json().catch(() => ({}));
    throw new Error(e.detail || 'Ошибка входа');
  }
  return resp.json();
}

export async function changePassword(payload: ChangePasswordRequest, token: string): Promise<void> {
  const resp = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const e = await resp.json().catch(() => ({}));
    throw new Error(e.detail || 'Ошибка смены пароля');
  }
}