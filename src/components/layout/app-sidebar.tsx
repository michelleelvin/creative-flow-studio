import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, ListTodo, Clock, Bell, FolderKanban, CheckSquare,
  Users as UsersIcon, BarChart3, ScrollText, Settings, Eye, Briefcase, UserSquare2, Gamepad2,
} from "lucide-react";
import { useRole } from "@/stores/role";
import { cn } from "@/lib/utils";
import type { Role } from "@/data/mock";
import logoDark from "@/assets/logo.png";
import logoLight from "@/assets/logo-light.png";

const NAV: Record<Role, { to: string; label: string; icon: typeof LayoutDashboard }[]> = {
  employee: [
    { to: "/employee", label: "Dashboard", icon: LayoutDashboard },
    { to: "/my-tasks", label: "My Tasks", icon: ListTodo },
    { to: "/timesheet", label: "Timesheet", icon: Clock },
    { to: "/team", label: "Team", icon: UsersIcon },
    { to: "/games", label: "Games", icon: Gamepad2 },
    { to: "/notifications", label: "Notifications", icon: Bell },
  ],
  manager: [
    { to: "/manager", label: "Dashboard", icon: LayoutDashboard },
    { to: "/projects", label: "Deliverables", icon: FolderKanban },
    { to: "/tasks", label: "Tasks", icon: ListTodo },
    { to: "/reviews", label: "Reviews", icon: Eye },
    { to: "/team", label: "Team", icon: UsersIcon },
    { to: "/clients", label: "Clients", icon: Briefcase },
    { to: "/employees", label: "Employees", icon: UserSquare2 },
    { to: "/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/notifications", label: "Notifications", icon: Bell },
  ],
  admin: [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { to: "/projects", label: "Deliverables", icon: FolderKanban },
    { to: "/clients", label: "Clients", icon: Briefcase },
    { to: "/employees", label: "Employees", icon: UserSquare2 },
    { to: "/audit", label: "Audit Log", icon: ScrollText },
    { to: "/settings", label: "Settings", icon: Settings },
  ],
};

export function AppSidebar() {
  const role = useRole((s) => s.role);
  const path = useRouterState({ select: (r) => r.location.pathname });
  const items = NAV[role];

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="h-14 px-4 border-b flex items-center justify-center">
        <img src={logoLight} alt="cntrlm" className="h-9 w-auto object-contain block dark:hidden animate-logo-breathe" />
        <img src={logoDark} alt="cntrlm" className="h-9 w-auto object-contain hidden dark:block animate-logo-breathe" />
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <div className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {role}
        </div>
        {items.map(({ to, label, icon: Icon }) => {
          const active = path === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                active
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-3 border-t text-xs text-muted-foreground">
        v0.1 · UI preview
      </div>
    </aside>
  );
}
