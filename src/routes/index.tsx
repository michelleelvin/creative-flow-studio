import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRole } from "@/stores/role";
import type { Role } from "@/data/mock";
import { supabase } from "@/lib/supabase";
import { getTasks } from "@/lib/tasks";
import { useActiveTask } from "@/hooks/useActiveTask";
import logoDark from "@/assets/logo.png";
import logoLight from "@/assets/logo-light.png";

export const Route = createFileRoute("/")({
  component: Login,
});

function Login() {
  const setRole = useRole((s) => s.setRole);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const enter = (r: Role) => {
    setRole(r);

    navigate({
      to:
        r === "employee"
          ? "/employee"
          : r === "manager"
          ? "/manager"
          : "/admin",
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    console.log("EMAIL STATE =", email);
    console.log("PASSWORD STATE =", password);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      alert(error?.message || "Login failed");
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      console.error(profileError);
      alert("Profile not found");
      setLoading(false);
      return;
    }

    const role = profile.role as Role;

    setRole(role);

    setLoading(false);

    switch (role) {
      case "admin":
        navigate({ to: "/admin" });
        break;

      case "manager":
        navigate({ to: "/manager" });
        break;

      default:
        navigate({ to: "/employee" });
        break;
    }
  } catch (err) {
    console.error(err);
    alert("Unexpected error");
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-[radial-gradient(ellipse_at_top,theme(colors.primary/8),transparent_60%)]">
      <Card className="w-full max-w-md p-8 shadow-sm animate-card-rise">
        <div className="flex items-center justify-center mb-6">
          <div className="rounded-full p-2 animate-logo-glow">
            <img
              src={logoLight}
              alt="cntrlm"
              className="h-20 w-auto object-contain block dark:hidden animate-logo-in"
            />
            <img
              src={logoDark}
              alt="cntrlm"
              className="h-20 w-auto object-contain hidden dark:block animate-logo-in"
            />
          </div>
        </div>

        <h1 className="text-xl font-semibold tracking-tight">
          Welcome back
        </h1>

        <p className="text-sm text-muted-foreground mt-1">
          Sign in to your workspace.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleLogin}>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>

            <Input
              id="email"
              type="email"
              placeholder="admin@wwems.co"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pwd">Password</Label>

            <Input
              id="pwd"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t">
          <div className="text-xs text-muted-foreground text-center mb-3">
            Demo — continue as
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => enter("employee")}
            >
              Employee
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => enter("manager")}
            >
              Manager
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => enter("admin")}
            >
              Admin
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}