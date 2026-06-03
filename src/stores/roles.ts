import { create } from "zustand";
import { INITIAL_ROLES, type RoleRecord } from "@/data/mockRoles";
import { applyDependencies, type PermissionMap } from "@/data/permissions";

interface RolesState {
  roles: RoleRecord[];
  upsertRole: (r: RoleRecord) => void;
  createRole: (r: Omit<RoleRecord, "id" | "createdAt" | "type" | "assignedIds"> & { permissions: PermissionMap }) => RoleRecord;
  cloneRole: (sourceId: string) => RoleRecord | null;
  archiveRole: (id: string, reassignments: Record<string, string>) => void;
  deleteEmpty: (id: string) => void;
}

export const useRoles = create<RolesState>((set, get) => ({
  roles: INITIAL_ROLES,
  upsertRole: (r) => set((s) => ({
    roles: s.roles.map((x) => (x.id === r.id ? { ...r, permissions: applyDependencies(r.permissions) } : x)),
  })),
  createRole: (r) => {
    const rec: RoleRecord = {
      id: `cus-${Date.now()}`,
      type: "custom",
      createdAt: new Date().toISOString(),
      assignedIds: [],
      ...r,
      permissions: applyDependencies(r.permissions),
    };
    set((s) => ({ roles: [rec, ...s.roles] }));
    return rec;
  },
  cloneRole: (sourceId) => {
    const src = get().roles.find((r) => r.id === sourceId);
    if (!src) return null;
    const rec: RoleRecord = {
      id: `cus-${Date.now()}`,
      type: "custom",
      name: `${src.name} (Copy)`,
      level: src.level,
      description: src.description,
      permissions: JSON.parse(JSON.stringify(src.permissions)),
      createdAt: new Date().toISOString(),
      assignedIds: [],
      clonedFrom: src.name,
    };
    set((s) => ({ roles: [rec, ...s.roles] }));
    return rec;
  },
  archiveRole: (id, reassignments) => set((s) => {
    const role = s.roles.find((r) => r.id === id);
    if (!role) return s;
    const roles = s.roles.map((r) => {
      if (r.id === id) return { ...r, archived: true, assignedIds: [] };
      const incoming = role.assignedIds.filter((eid) => reassignments[eid] === r.id);
      if (incoming.length) return { ...r, assignedIds: [...r.assignedIds, ...incoming] };
      return r;
    });
    return { roles };
  }),
  deleteEmpty: (id) => set((s) => ({ roles: s.roles.map((r) => (r.id === id ? { ...r, archived: true } : r)) })),
}));
