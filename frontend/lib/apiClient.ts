import {
  API_BASE,
  clearTokens,
  getRefreshToken,
  getToken,
  refreshApi,
  setRefreshToken,
  setToken,
} from "./auth";

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
        const refresh = getRefreshToken();
        if (!refresh) return false;
        const pair = await refreshApi(refresh);
        setToken(pair.access_token);
        setRefreshToken(pair.refresh_token);
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
 * fetch terpusat untuk API terproteksi:
 * - pasang Bearer otomatis
 * - sekali 401 -> coba silent refresh (rotasi) lalu ulangi request sekali
 * - refresh gagal -> bersihkan token dan lempar unauthorized (pemanggil arahkan ke /login)
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<unknown> {
  const doFetch = async (token: string | null) =>
    fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

  let token = getToken();
  if (!token) throw { message: "You are not logged in.", unauthorized: true };

  let res = await doFetch(token);
  if (res.status !== 401) {
    if (!res.ok) throw await parseError(res);
    return res.json();
  }

  // access token mati (kedaluwarsa/blacklist) -> coba perpanjang diam-diam
  const refreshed = await tryRefresh();
  if (!refreshed) {
    clearTokens();
    throw { message: "Session expired, please log in again.", unauthorized: true };
  }
  token = getToken();
  res = await doFetch(token);
  if (res.status === 401) {
    clearTokens();
    throw { message: "Session expired, please log in again.", unauthorized: true };
  }
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export { goLogin };
