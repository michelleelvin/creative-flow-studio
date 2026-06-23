import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Search, Plus, MoreHorizontal, Copy, Pencil, Trash2, Eye } from "lucide-react";
import { useRoles } from "@/stores/roles";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { DeleteRoleDialog } from "@/components/roles/DeleteRoleDialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/employees/roles")({ component: RolesList });

type SortKey = "name" | "role";

function RolesList() {
  const roles = useRoles((s) => s.roles).filter((r) => !r.archived);
  const cloneRole = useRoles((s) => s.cloneRole);
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<any[]>([]);

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("name");
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);

  const rows = useMemo(() => {
    let list = [...employees];

    if (query.trim()) {
      const q = query.toLowerCase();

      list = list.filter(
        (e) =>
          e.name?.toLowerCase().includes(q) ||
          e.email?.toLowerCase().includes(q) ||
          e.position?.toLowerCase().includes(q)
      );
    }

    if (sort === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    if (sort === "role") {
      list.sort((a, b) => a.position.localeCompare(b.position));
    }

    return list;
  }, [employees, query, sort]);

  const onClone = (id: string) => {
    const rec = cloneRole(id);
    if (!rec) return;
    toast.success(`Cloned. Customize and save.`);
    navigate({ to: "/employees/roles/$id", params: { id: rec.id } });
  };
  useEffect(() => {
    async function loadEmployees() {
      const { data, error } = await supabase
        .from("users")
        .select("*");

      console.log("EMPLOYEES:", data);
      console.log("EMPLOYEE ERROR:", error);

      setEmployees(data || []);
    }

    loadEmployees();
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Manage Roles</h1>
          <p className="text-sm text-muted-foreground">Your team and the roles they hold</p>
        </div>
        <Button asChild>
          <Link to="/employees/roles/new"><Plus className="size-4" /> Add New Team Mate</Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="relative w-[240px]">
          <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search team..."
            className="pl-8 h-9"
          />
        </div>
        <Select value={sort} onValueChange={(v: SortKey) => setSort(v)}>
          <SelectTrigger className="w-[180px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name A–Z</SelectItem>
            <SelectItem value="role">Role A–Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <TooltipProvider delayDuration={150}>
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b">
                <tr className="text-left">
                  <th className="px-4 py-2.5 font-medium">Name</th>
                  <th className="px-4 py-2.5 font-medium">Role</th>
                  <th className="px-4 py-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((employee) => (
                  <tr
                    key={employee.id}
                    className={cn("border-b last:border-b-0 hover:bg-muted/30 cursor-pointer")}
                    onClick={() => navigate({ to: "/employees/roles/$id", params: { id: employee.id } })}
                  >
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-7">
                          <AvatarImage src={employee.avatar_url} />
                          <AvatarFallback>{(employee.full_name || employee.name || employee.email)?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium truncate">{employee.full_name}</div>
                          <div className="text-[11px] text-muted-foreground truncate">{employee.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span className="text-muted-foreground">{employee.position}</span>
                    </td>
                    <td className="px-4 py-3 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8"><MoreHorizontal className="size-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate({ to: "/employees/roles/$id", params: { id: employee.id } })}>
                            <Eye className="size-4" /> View Role
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => navigate({ to: "/employees/roles/$id", params: { id: employee.id }, search: { edit: true } as never })}
                          >
                            <Pencil className="size-4" /> Edit Role
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onClone(employee.id)}>
                            <Copy className="size-4" /> Clone Role
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={false}
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteRoleId(employee.id)}
                          >
                            <Trash2 className="size-4" /> Delete Role
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      No team members found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </TooltipProvider>
        </div>
      </Card>

      {deleteRoleId && (
        <DeleteRoleDialog roleId={deleteRoleId} onClose={() => setDeleteRoleId(null)} />
      )}
    </div>
  );
}
