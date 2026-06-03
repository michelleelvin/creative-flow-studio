import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/employees/")({
  beforeLoad: () => {
    throw redirect({ to: "/employees/roles" });
  },
});
