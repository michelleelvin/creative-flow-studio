import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRole } from "@/stores/role";
import type { Role } from "@/data/mock";
import logoDark from "@/assets/logo.png";
import logoLight from "@/assets/logo-light.png";

export const Route = createFileRoute("/")({ component: Login });

function Login() {
  const setRole = useRole((s) => s.setRole);
  const navigate = useNavigate();

  const enter = (r: Role) => {
    setRole(r);
    navigate({ to: r === "employee" ? "/employee" : r === "manager" ? "/manager" : "/admin" });
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-[radial-gradient(ellipse_at_top,theme(colors.primary/8),transparent_60%)]">
      <Card className="w-full max-w-md p-8 shadow-sm animate-card-rise">
        <div className="flex items-center justify-center mb-6">
          <div className="rounded-full p-2 animate-logo-glow">
            <img src={logoLight} alt="cntrlm" className="h-20 w-auto object-contain block dark:hidden animate-logo-in" />
            <img src={logoDark} alt="cntrlm" className="h-20 w-auto object-contain hidden dark:block animate-logo-in" />
          </div>
        </div>

        <h1 className="text-xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground mt-1">Sign in to your workspace.</p>

        <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); enter("employee"); }}>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@wwems.co" defaultValue="aria.patel@wwems.co" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pwd">Password</Label>
            <Input id="pwd" type="password" defaultValue="••••••••" />
          </div>
          <Button type="submit" className="w-full">Sign in</Button>
        </form>

        <div className="mt-6 pt-6 border-t">
          <div className="text-xs text-muted-foreground text-center mb-3">Demo — continue as</div>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" onClick={() => enter("employee")}>Employee</Button>
            <Button variant="outline" size="sm" onClick={() => enter("manager")}>Manager</Button>
            <Button variant="outline" size="sm" onClick={() => enter("admin")}>Admin</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
