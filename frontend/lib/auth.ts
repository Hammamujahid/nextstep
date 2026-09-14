export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export function googleLoginUrl(): string {
  return `${API_BASE}/auth/google/login`;
}

const TOKEN_KEY = "nextstep_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

type ApiError = {
  message: string;
  details?: string[];
};

async function parseError(res: Response): Promise<ApiError> {
  try {
    const data = await res.json();
    if (typeof data?.message === "string") {
      return {
        message: data.message,
        details: Array.isArray(data.details) ? data.details : undefined,
      };
    }
  } catch {
    // ignore JSON parse errors
  }
  return { message: `Request failed with status ${res.status}` };
}

export async function registerApi(input: {
  username: string;
  email: string;
  password: string;
}): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function loginApi(input: {
  email: string;
  password: string;
}): Promise<{ access_token: string }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function logoutApi(token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw await parseError(res);
}

export type MeProfile = {
  user_id: number;
  username: string;
  email: string;
  photo_profile: string | null;
};

export async function getMeApi(token: string): Promise<MeProfile> {
  const res = await fetch(`${API_BASE}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}
