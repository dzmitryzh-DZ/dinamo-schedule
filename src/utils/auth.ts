import { APP_PASSWORD_SHA256 } from "../config";

const AUTH_KEY = "dinamo-schedule-auth";
const PASSHASH_KEY = "dinamo-schedule-passhash";

export async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function isAuthenticated(): boolean {
  try {
    return localStorage.getItem(AUTH_KEY) === "1";
  } catch {
    return false;
  }
}

export function markAuthenticated(): void {
  try {
    localStorage.setItem(AUTH_KEY, "1");
  } catch {
    /* storage unavailable */
  }
}

export function logout(): void {
  try {
    localStorage.removeItem(AUTH_KEY);
  } catch {
    /* ignore */
  }
}

function storedHash(): string | null {
  try {
    const value = (localStorage.getItem(PASSHASH_KEY) || "").trim();
    return /^[0-9a-f]{64}$/.test(value) ? value : null;
  } catch {
    return null;
  }
}

/** Действующий хеш пароля: сменённый в настройках или зашитый в код. */
export function effectivePasswordHash(): string {
  return storedHash() ?? APP_PASSWORD_SHA256;
}

export async function checkPassword(password: string): Promise<boolean> {
  if (!password) return false;
  try {
    return (await sha256Hex(password)) === effectivePasswordHash();
  } catch {
    return false;
  }
}

export type ChangePasswordResult = "ok" | "wrong-current" | "weak";

export async function changePassword(
  current: string,
  next: string
): Promise<ChangePasswordResult> {
  if (next.length < 6) return "weak";
  if (!(await checkPassword(current))) return "wrong-current";
  const hash = await sha256Hex(next);
  try {
    localStorage.setItem(PASSHASH_KEY, hash);
  } catch {
    /* ignore */
  }
  return "ok";
}
