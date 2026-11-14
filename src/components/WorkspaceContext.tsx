"use client";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
export interface WorkspaceUser {
  id: string;
  name: string | null;
  email: string;
  plan: string;
  role: string;
  totalXp: number;
  level: number;
  streak: number;
}
const WorkspaceContext = createContext<{
  user: WorkspaceUser | null;
  saved: string[];
  toggleSaved: (id: string) => void;
}>({ user: null, saved: [], toggleSaved: () => {} });
const followingListeners = new Set<() => void>();
const transientFollowing = new Map<string, string>();
const emptyFollowing = () => "[]";
function readFollowing(key: string) {
  if (transientFollowing.has(key)) return transientFollowing.get(key)!;
  try {
    return localStorage.getItem(key) || "[]";
  } catch {
    return "[]";
  }
}
function parseFollowing(raw: string): string[] {
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value)
      ? value.filter((id) => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}
function subscribeFollowing(listener: () => void) {
  followingListeners.add(listener);
  const changed = (event: StorageEvent) => {
    if (event.key) transientFollowing.delete(event.key);
    else transientFollowing.clear();
    listener();
  };
  window.addEventListener("storage", changed);
  return () => {
    followingListeners.delete(listener);
    window.removeEventListener("storage", changed);
  };
}
export function WorkspaceProvider({
  user,
  children,
}: {
  user: WorkspaceUser | null;
  children: React.ReactNode;
}) {
  const key = `cosmogov:following:${user?.id}`;
  const snapshot = useSyncExternalStore(
    subscribeFollowing,
    useCallback(() => (user ? readFollowing(key) : "[]"), [key, user]),
    emptyFollowing,
  );
  const saved = useMemo(() => parseFollowing(snapshot), [snapshot]);
  const toggleSaved = (id: string) => {
    if (!user) return;
    const current = parseFollowing(readFollowing(key));
    const next = current.includes(id)
      ? current.filter((value) => value !== id)
      : [...current, id];
    const raw = JSON.stringify(next);
    transientFollowing.set(key, raw);
    try {
      localStorage.setItem(key, raw);
      transientFollowing.delete(key);
    } catch {}
    followingListeners.forEach((listener) => listener());
  };
  return (
    <WorkspaceContext.Provider value={{ user, saved, toggleSaved }}>
      {children}
    </WorkspaceContext.Provider>
  );
}
export const useWorkspace = () => useContext(WorkspaceContext);
