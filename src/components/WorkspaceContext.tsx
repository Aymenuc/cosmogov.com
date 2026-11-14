"use client";
import { createContext, useContext, useEffect, useState } from "react";
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
export function WorkspaceProvider({
  user,
  children,
}: {
  user: WorkspaceUser | null;
  children: React.ReactNode;
}) {
  const [saved, setSaved] = useState<string[]>([]);
  const key = `cosmogov:following:${user?.id}`;
  useEffect(() => {
    if (!user) return;
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      setSaved(
        Array.isArray(value)
          ? value.filter((id) => typeof id === "string")
          : [],
      );
    } catch {
      setSaved([]);
    }
  }, [key, user]);
  const toggleSaved = (id: string) =>
    setSaved((current) => {
      const next = current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id];
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {}
      return next;
    });
  return (
    <WorkspaceContext.Provider value={{ user, saved, toggleSaved }}>
      {children}
    </WorkspaceContext.Provider>
  );
}
export const useWorkspace = () => useContext(WorkspaceContext);
