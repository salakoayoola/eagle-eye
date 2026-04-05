/**
 * Companion API client for drive management.
 * In production, nginx proxies /api/drives → companion API.
 * In dev, VITE_COMPANION_URL can point directly.
 */

const BASE = import.meta.env.VITE_COMPANION_URL || "/api/drives";

export interface Drive {
  label: string;
  device: string;
  mountpoint: string;
  fstype: string;
  size: string;
  used: string;
  available: string;
  mounted: boolean;
}

export async function listDrives(): Promise<Drive[]> {
  try {
    const res = await fetch(BASE);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    // Companion API may not be running — that's fine
    return [];
  }
}

export async function mountDrive(
  device: string
): Promise<{ success: boolean; mountpoint: string }> {
  const res = await fetch(`${BASE}/mount`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ device }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Mount failed");
  }
  return res.json();
}

export async function ejectDrive(
  device: string
): Promise<{ success: boolean }> {
  const res = await fetch(`${BASE}/eject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ device }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Eject failed");
  }
  return res.json();
}

export function formatDriveSize(bytes: string | number): string {
  const b = typeof bytes === "string" ? parseInt(bytes, 10) : bytes;
  if (!b || isNaN(b)) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return `${(b / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
