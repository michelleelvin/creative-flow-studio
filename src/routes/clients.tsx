import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Briefcase, Plus, TrendingUp, DollarSign, Users as UsersIcon, FolderKanban,
  ArrowUpRight, Search,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRole } from "@/stores/role";
import { cn } from "@/lib/utils";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
export const Route = createFileRoute("/clients")({ component: ClientsPage });

interface ClientRow {
  name: string;
  projects: number;
  activeProjects: number;
  mrr: number;
  ytd: number;
  since: string;
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function ClientsPage() {
  const setRole = useRole((s) => s.setRole);
  const [projects, setProjects] = useState<any[]>([]);
  const allProjects = projects;
  useEffect(() => {
  async function loadProjects() {
    const { data, error } = await supabase
      .from("projects")
      .select("*");

    setProjects(data || []);
    console.log("PROJECTS", data);
    console.log("PROJECT ERROR", error);
  }

  loadProjects();
}, []);
  useEffect(() => { setRole("admin"); }, [setRole]);



  const [query, setQuery] = useState("");


  const baseClients: ClientRow[] = useMemo(() => {
    const map = new Map<string, ClientRow>();
    for (const p of allProjects) {
      if (!p.client) continue;
      const h = hash(p.client);
      const c = map.get(p.client) ?? {
        name: p.client,
        projects: 0,
        activeProjects: 0,
        mrr: 4 + (h % 22),
        ytd: 0,
        since: new Date(2022, h % 12, 1 + (h % 27)).toISOString(),
      };
      c.projects += 1;
      if (p.progress < 100) c.activeProjects += 1;
      c.ytd += 8 + ((h + p.progress) % 60);
      map.set(p.client, c);
    }
    return Array.from(map.values());
  }, [allProjects]);

  const clients = baseClients;

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()),
  );

  const totalMRR = clients.reduce((s, c) => s + c.mrr, 0);
  const totalYTD = clients.reduce((s, c) => s + c.ytd, 0);
  const activeProjects = allProjects.filter((p) => p.progress < 100).length;

  // 12-month revenue trend (deterministic from totals)
  const revenueTrend = useMemo(() => {
    const months = ["Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May"];
    return months.map((m, i) => ({
      month: m,
      revenue: Math.round(totalMRR * (0.7 + Math.sin(i / 2) * 0.15 + i * 0.025)),
      new: 1 + (i % 4),
    }));
  }, [totalMRR]);

  const topClients = clients.slice(0, 6).map((c) => ({ name: c.name, ytd: c.ytd }));

  // Add client form (legacy state retained but unused; navigation handles creation)

  const kpis = [
    { label: "Total MRR", value: `₹${totalMRR}k`, sub: "+8.2% MoM", icon: DollarSign },
    { label: "Revenue YTD", value: `₹${totalYTD}k`, sub: "across all clients", icon: TrendingUp },
    { label: "Active clients",value: clients.length,sub: `${clients.length} total`,icon: UsersIcon,},
    { label: "Active deliverables", value: activeProjects, sub: `${allProjects.length} total`, icon: FolderKanban },
  ];

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
            <p className="text-sm text-muted-foreground">Revenue, accounts and ongoing deliverable pipeline.</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search clients…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8 w-56"
              />
            </div>
            <Button asChild>
              <Link to="/clients/new"><Plus className="size-4" />Add client</Link>
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((k) => (
            <Card key={k.label} className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{k.label}</span>
                <k.icon className="size-4 text-muted-foreground" />
              </div>
              <div className="mt-2 text-2xl font-semibold tabular">{k.value}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{k.sub}</div>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="font-medium">Revenue (12 mo)</div>
              <span className="text-xs text-muted-foreground">in ₹k</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrend} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#rev)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="font-medium">Top clients YTD</div>
              <span className="text-xs text-muted-foreground">₹k</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topClients} layout="vertical" margin={{ left: 8, right: 8 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="ytd" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Clients + projects */}
        <div className="grid lg:grid-cols-5 gap-4">
          <Card className="p-5 lg:col-span-3">
            <div className="font-medium flex items-center gap-2 mb-4">
              <Briefcase className="size-4" /> Clients ({filtered.length})
            </div>
            <ul className="divide-y">
              {filtered.map((c) => (
                <li key={c.name} className="py-3 flex items-center gap-3">
                  <div className="size-9 rounded-md bg-muted grid place-items-center text-xs font-semibold">
                    {c.name?.slice(0, 2).toUpperCase() ?? "NA"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.projects} deliverable{c.projects !== 1 && "s"} · {c.activeProjects} active · ₹{c.mrr}k/mo
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold tabular">₹{c.ytd}k</div>
                    <div className="text-[11px] text-muted-foreground">YTD</div>
                  </div>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="py-8 text-center text-sm text-muted-foreground">No clients match "{query}".</li>
              )}
            </ul>
          </Card>

          <Card className="p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="font-medium flex items-center gap-2">
                <FolderKanban className="size-4" /> Existing deliverables
              </div>
              <Button asChild size="sm" variant="ghost"><Link to="/admin">Admin <ArrowUpRight className="size-3.5" /></Link></Button>
            </div>
            <ul className="space-y-3">
              {allProjects.slice(0, 8).map((p) => (
                <li key={p.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{p.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{p.client} · {p.status}</div>
                    </div>
                    <span className={cn(
                      "text-[11px] tabular shrink-0",
                      p.progress >= 100 ? "text-status-done" : "text-muted-foreground"
                    )}>{p.progress}%</span>
                  </div>
                  <Progress value={p.progress} className="h-1.5" />
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
