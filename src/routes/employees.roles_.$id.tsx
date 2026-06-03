import { createFileRoute, Link } from "@tanstack/react-router";
import { useRoles } from "@/stores/roles";
import { RoleEditor } from "@/components/roles/RoleEditor";
import { Button } from "@/components/ui/button";
import { z } from "zod";

const searchSchema = z.object({ edit: z.boolean().optional() });

export const Route = createFileRoute("/employees/roles_/$id")({
  component: RoleDetailPage,
  validateSearch: searchSchema,
});

function RoleDetailPage() {
  const { id } = Route.useParams();
  const { edit } = Route.useSearch();
  const role = useRoles((s) => s.roles.find((r) => r.id === id));

  if (!role) {
    return (
      <div className="p-10 text-center">
        <div className="text-sm text-muted-foreground">Role not found.</div>
        <Button asChild variant="outline" className="mt-3"><Link to="/employees/roles">Back to Roles</Link></Button>
      </div>
    );
  }

  const mode = edit ? "edit" : "view";
  return <RoleEditor mode={mode} initial={role} />;
}
