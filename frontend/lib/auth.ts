import { apiFetch } from "./apiClient";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export function googleLoginUrl(): string {
  return `${API_BASE}/auth/google/login`;
}

const TOKEN_KEY = "nextstep_token";
const REFRESH_KEY = "nextstep_refresh_token";

// Sesi memakai cookie HttpOnly (ns_access/ns_refresh) yang diset server,
// jadi tidak ada token di localStorage. Helper di bawah hanya membersihkan
// sisa token lama bila masih ada (migrasi dari versi sebelumnya).
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
  // credentials:include agar Set-Cookie sesi dari API diterima browser
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

// refresh memakai cookie ns_refresh (tanpa body); server merotasi cookie
export async function refreshApi(): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function logoutApi(): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
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

// Cek sesi pasif: satu request GET /me dengan cookie, tanpa silent-refresh
// dan tanpa redirect. Dipakai halaman publik (/ dan /login) agar tidak
// memicu reload-loop. Return true hanya bila benar-benar terautentikasi.
export async function sessionActive(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/me`, {
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
  }
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
