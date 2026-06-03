import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role } from "@/data/mock";

interface RoleState {
  role: Role;
  setRole: (role: Role) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
}

export const useRole = create<RoleState>()(
  persist(
    (set) => ({
      role: "employee",
      setRole: (role) => set({ role }),
      theme: "light",
      toggleTheme: () => set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),
    }),
    { name: "wwems-role" }
  )
);
