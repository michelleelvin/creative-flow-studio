import { createFileRoute } from "@tanstack/react-router";
import { RoleEditor } from "@/components/roles/RoleEditor";

export const Route = createFileRoute("/employees/roles_/new")({ component: NewRole });

function NewRole() {
  return <RoleEditor mode="create" />;
}
