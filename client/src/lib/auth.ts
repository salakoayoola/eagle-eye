import { apiFetch, UnauthorizedError } from "@/lib/api";

const AUTH_BASE = "/api/auth";

export interface AuthUser {
  username: string;
}

interface LoginResult {
  authenticated: boolean;
  username: string;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const res = await apiFetch(`${AUTH_BASE}/me`).catch((err) => {
    if (err instanceof UnauthorizedError) return null;
    throw err;
  });

  if (!res) return null;
  if (!res.ok) return null;

  const data = (await res.json()) as LoginResult;
  if (!data.authenticated) return null;

  return { username: data.username };
}

export async function login(username: string, password: string): Promise<AuthUser> {
  const res = await apiFetch(`${AUTH_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Login failed");
  }

  const data = (await res.json()) as LoginResult;
  if (!data.authenticated || !data.username) {
    throw new Error("Login failed");
  }

  return { username: data.username };
}

export async function logout(): Promise<void> {
  const res = await apiFetch(`${AUTH_BASE}/logout`, {
    method: "POST",
  });

  if (!res.ok) {
    throw new Error("Logout failed");
  }
}
