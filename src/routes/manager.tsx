import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowUpRight, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { StatusBadge } from "@/components/badges";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useRole } from "@/stores/role";
import { IncomingProjectsStrip } from "@/components/setup/IncomingProjectsStrip";

export const Route = createFileRoute("/manager")({ component: ManagerDashboard });


function ManagerDashboard() {
  const setRole = useRole((s) => s.setRole);
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  useEffect(() => {
  async function loadData() {
    const { data: tasksData } = await supabase
      .from("tasks")
      .select("*");

    const { data: projectsData } = await supabase
      .from("projects")
      .select("*");

    const { data: employeesData } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "employee");

    setTasks(tasksData || []);
    setProjects(projectsData || []);
    setEmployees(employeesData || []);
  }

  loadData();
}, []);
  useEffect(() => { setRole("manager"); }, [setRole]);

  const reviewQueue = tasks.filter((t) => t.status === "review").slice(0, 6);
  const overdue = tasks.filter((t) => new Date(t.deadline).getTime() < Date.now() && t.status !== "done");
  console.log("PROJECTS:", projects);
  const kpis = [
    { label: "Active Deliverables", value: projects.length, trend: "+2 this week", icon: ArrowUpRight, tone: "text-status-done" },
    { label: "Pending Approvals", value: reviewQueue.length, trend: "3 over 24h", icon: Clock, tone: "text-status-review" },
    { label: "Tasks Overdue", value: overdue.length, trend: "+1 vs yesterday", icon: AlertTriangle, tone: "text-status-overdue" },
    { label: "Team Productivity", value: "73%", trend: "+4% vs last wk", icon: CheckCircle2, tone: "text-status-done" },
  ];

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Manager dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of your team and deliverables.</p>
        </div>

        <IncomingProjectsStrip />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((k) => (
            <Card key={k.label} className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{k.label}</span>
                <k.icon className={cn("size-4", k.tone)} />
              </div>
              <div className="mt-2 text-2xl font-semibold tabular">{k.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{k.trend}</div>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Pending Approvals */}
          <Card className="lg:col-span-2 overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div className="font-medium">Pending Approvals</div>
              <Button variant="ghost" size="sm">View all</Button>
            </div>
            {reviewQueue.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">All caught up.</div>
            ) : (
              <ul className="divide-y">
                {reviewQueue.map((t) => {
                  const u = employees.find(
                    (x) => x.id === t.assigneeId || x.id === t.assignee_id
                  );
                  const p = projects.find(
                    (x) => x.id === t.projectId || x.id === t.project_id
                  );
                  return (
                    <li key={t.id} className="px-5 py-3 flex items-center gap-3">
                      <div className="size-10 rounded bg-muted shrink-0" />
                      <Avatar className="size-7">
                        <AvatarFallback>{u?.full_name?.[0] ?? "U"}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{t.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {u?.full_name ?? "Unassigned"} · {p?.name ?? "Unknown Project"} ·{" "}
                          {formatDistanceToNow(new Date(t.deadline), { addSuffix: true })}
                        </div>
                      </div>
                      <StatusBadge status={t.status} />
                      <Button size="sm">Review</Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* Delay alerts */}
          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b">
              <div className="font-medium flex items-center gap-2">
                <AlertTriangle className="size-4 text-status-overdue" /> Delay alerts
              </div>
            </div>
            <ul className="divide-y max-h-[360px] overflow-auto">
              {overdue.slice(0, 8).map((t) => {
                const u = employees.find((x) => x.id === t.assigneeId);
                const days = Math.floor((Date.now() - new Date(t.deadline).getTime()) / 86400_000);
                return (
                  <li key={t.id} className="px-5 py-3">
                    <div className="text-sm font-medium truncate">{t.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {u?.full_name ?? "Unassigned"} ·{" "}
                      <span className="text-status-overdue">{days}d late</span>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" variant="outline">Reassign</Button>
                      <Button size="sm" variant="ghost">Extend</Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>

        {/* Workload heatmap */}
        <Card className="p-5">
          <div className="font-medium mb-4">Team workload — this week</div>
          <Heatmap employees={employees} />
        </Card>

        {/* Deliverable pipeline */}
        <Card className="p-5">
          <div className="font-medium mb-4">Deliverable pipeline</div>
          <div className="space-y-3">
            {projects.map((p) => (
              <div key={p.id} className="grid grid-cols-[200px_1fr_60px] items-center gap-4">
                <div>
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">{p.type} · {p.client}</div>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${p.progress}%` }} />
                </div>
                <div className="text-xs text-right tabular text-muted-foreground">{p.progress}%</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function Heatmap({ employees }: { employees: any[] }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  return (
    <div className="overflow-x-auto">
      <table className="text-sm">
        <thead>
          <tr>
            <th className="text-left pr-4 pb-2 font-normal text-xs text-muted-foreground">Member</th>
            {days.map((d) => (
              <th key={d} className="px-2 pb-2 font-normal text-xs text-muted-foreground">{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employees.slice(0, 8).map((u, i) => (
            <tr key={u.id}>
              <td className="pr-4 py-1.5">
                <div className="flex items-center gap-2">
                  <Avatar className="size-6"><AvatarImage src={u.avatar} /><AvatarFallback>{u.full_name?.[0]}</AvatarFallback></Avatar>
                  <span className="text-sm truncate max-w-[140px]">{u.full_name}</span>
                </div>
              </td>
              {days.map((d, j) => {
                const v = ((i * 3 + j * 2) % 5) / 4;
                return (
                  <td key={d} className="px-1 py-1">
                    <div
                      className="h-7 w-12 rounded"
                      style={{ background: `color-mix(in oklab, var(--color-primary) ${v * 80 + 8}%, var(--color-muted))` }}
                      title={`${Math.round(v * 8)}h`}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
