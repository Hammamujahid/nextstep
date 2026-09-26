import { API_BASE, refreshApi } from "./auth";

// inflight refresh bersama agar 401 berbarengan tidak menembak /auth/refresh berkali-kali
let refreshPromise: Promise<boolean> | null = null;

function goLogin() {
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

async function tryRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        // refresh token dibawa cookie HttpOnly (credentials include),
        // tidak perlu body
        await refreshApi();
        return true;
      } catch {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

type ApiErrorShape = { message: string; details?: string[]; unauthorized?: boolean };

async function parseError(res: Response): Promise<ApiErrorShape> {
  if (res.status === 401) {
    return { message: "Session expired, please log in again.", unauthorized: true };
  }
  try {
    const data = await res.json();
    if (typeof data?.message === "string") {
      return {
        message: data.message,
        details: Array.isArray(data.details) ? data.details : undefined,
      };
    }
  } catch {
    // abaikan, pakai pesan default di bawah
  }
  return { message: `Request failed with status ${res.status}` };
}

/**
 * fetch terpusat untuk API terproteksi (sesi cookie HttpOnly):
 * - selalu credentials:include agar cookie ns_access/ns_refresh terkirim
 * - tanpa Authorization header / localStorage (kebal XSS pencuri token)
 * - sekali 401 -> coba silent refresh (rotasi cookie) lalu ulangi request sekali
 * - refresh gagal -> arahkan ke /login
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<unknown> {
  const doFetch = () =>
    fetch(`${API_BASE}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        ...(init?.headers ?? {}),
      },
    });

  let res = await doFetch();
  if (res.status !== 401) {
    if (!res.ok) throw await parseError(res);
    return res.json();
  }

  // sesi cookie kedaluwarsa/dicabut -> coba perpanjang diam-diam
  const refreshed = await tryRefresh();
  if (!refreshed) {
    goLogin();
    throw { message: "Session expired, please log in again.", unauthorized: true };
  }
  res = await doFetch();
  if (res.status === 401) {
    goLogin();
    throw { message: "Session expired, please log in again.", unauthorized: true };
  }
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export { goLogin };
