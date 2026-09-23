import { apiFetch } from "./apiClient";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export function googleLoginUrl(): string {
  return `${API_BASE}/auth/google/login`;
}

const TOKEN_KEY = "nextstep_token";
const REFRESH_KEY = "nextstep_refresh_token";

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

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setRefreshToken(token: string) {
  localStorage.setItem(REFRESH_KEY, token);
}

// hapus kedua token (dipakai saat logout / sesi mati total)
export function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
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
}): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function refreshApi(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function logoutApi(): Promise<void> {
  const refresh = getRefreshToken();
  await apiFetch("/auth/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(refresh ? { refresh_token: refresh } : {}),
  });
}

export type MeProfile = {
  user_id: number;
  username: string;
  email: string;
  photo_profile: string | null;
  active_workspace_id: number | null;
};

export async function getMeApi(): Promise<MeProfile> {
  const json = (await apiFetch("/me")) as MeProfile;
  return json;
}

export async function updateProfileApi(input: {
  username?: string;
  email?: string;
}): Promise<MeProfile> {
  const json = (await apiFetch("/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })) as MeProfile & { message?: string };
  return json;
}
