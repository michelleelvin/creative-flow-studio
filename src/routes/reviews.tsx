import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { StatusBadge, PriorityChip } from "@/components/badges";
import { tasks as seedTasks, projects, users, VIDEO_STAGES, STATIC_STAGES } from "@/data/mock";
import type { Task } from "@/data/mock";
import { useRole } from "@/stores/role";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Search, Filter, CheckCircle2, RotateCcw, MessageSquare, Paperclip,
  Clock, AlertTriangle, Play, Download, ChevronRight, Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/reviews")({ component: ReviewsPage });

type ReviewTab = "pending" | "revision" | "approved";

function ReviewsPage() {
  const setRole = useRole((s) => s.setRole);
  useEffect(() => { setRole("manager"); }, [setRole]);

  // Local state — start from mock, manager actions mutate locally
  const [items, setItems] = useState<Task[]>(seedTasks);
  const [tab, setTab] = useState<ReviewTab>("pending");
  const [q, setQ] = useState("");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const tabStatus = tab === "pending" ? "review" : tab === "revision" ? "revision" : "done";
    return items
      .filter((t) => t.status === tabStatus)
      .filter((t) => projectFilter === "all" || t.projectId === projectFilter)
      .filter((t) => priorityFilter === "all" || t.priority === priorityFilter)
      .filter((t) => !q || t.title.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  }, [items, tab, projectFilter, priorityFilter, q]);

  const counts = useMemo(() => ({
    pending: items.filter((t) => t.status === "review").length,
    revision: items.filter((t) => t.status === "revision").length,
    approved: items.filter((t) => t.status === "done").length,
  }), [items]);

  const overdueCount = items.filter(
    (t) => t.status === "review" && new Date(t.deadline).getTime() < Date.now()
  ).length;

  const avgWait = useMemo(() => {
    const pending = items.filter((t) => t.status === "review");
    if (!pending.length) return "—";
    const avgMs = pending.reduce((s, t) => s + (Date.now() - new Date(t.deadline).getTime() + 3 * 86400_000), 0) / pending.length;
    return `${Math.max(1, Math.round(avgMs / 3600_000))}h`;
  }, [items]);

  const active = activeId ? items.find((t) => t.id === activeId) ?? null : null;

  function applyAction(ids: string[], action: "approve" | "revision", note?: string) {
    setItems((prev) =>
      prev.map((t) => {
        if (!ids.includes(t.id)) return t;
        if (action === "approve") return { ...t, status: "done" };
        return { ...t, status: "revision", comments: t.comments + (note ? 1 : 0) };
      })
    );
    setSelected(new Set());
    setActiveId(null);
    if (action === "approve") {
      toast.success(`Approved ${ids.length} deliverable${ids.length > 1 ? "s" : ""}`);
    } else {
      toast(`Revision requested · ${ids.length} item${ids.length > 1 ? "s" : ""}`, {
        description: note ? `"${note.slice(0, 60)}${note.length > 60 ? "…" : ""}"` : undefined,
      });
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((t) => t.id)));
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Review queue</h1>
            <p className="text-sm text-muted-foreground">
              Approve deliverables submitted by your team or send them back with notes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Sparkles className="size-4" /> AI summary
            </Button>
            <Button size="sm">
              <CheckCircle2 className="size-4" /> Catch-up mode
            </Button>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Kpi label="Awaiting review" value={counts.pending} icon={Clock} tone="text-status-review" hint="Submitted by team" />
          <Kpi label="Overdue reviews" value={overdueCount} icon={AlertTriangle} tone="text-status-overdue" hint="Past SLA" />
          <Kpi label="Avg wait time" value={avgWait} icon={Clock} tone="text-foreground" hint="From submit to action" />
          <Kpi label="Approved this week" value={counts.approved} icon={CheckCircle2} tone="text-status-done" hint="+12% vs last wk" />
        </div>

        {/* Filters */}
        <Card className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by deliverable name…"
                className="pl-9 h-9"
              />
            </div>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="h-9 w-[200px]"><SelectValue placeholder="Deliverable" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All deliverables</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priority</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={() => { setQ(""); setProjectFilter("all"); setPriorityFilter("all"); }}>
              <Filter className="size-4" /> Reset
            </Button>
          </div>
        </Card>

        {/* Bulk action bar */}
        {selected.size > 0 && tab === "pending" && (
          <div className="sticky top-2 z-10 flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border bg-primary/5 backdrop-blur">
            <div className="text-sm">
              <span className="font-medium">{selected.size}</span> selected
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => applyAction([...selected], "revision", "Bulk: please revise")}>
                <RotateCcw className="size-4" /> Request revision
              </Button>
              <Button size="sm" onClick={() => applyAction([...selected], "approve")}>
                <CheckCircle2 className="size-4" /> Approve all
              </Button>
            </div>
          </div>
        )}

        <Tabs value={tab} onValueChange={(v) => { setTab(v as ReviewTab); setSelected(new Set()); }}>
          <TabsList>
            <TabsTrigger value="pending">Pending <span className="ml-1.5 text-xs tabular text-muted-foreground">{counts.pending}</span></TabsTrigger>
            <TabsTrigger value="revision">In revision <span className="ml-1.5 text-xs tabular text-muted-foreground">{counts.revision}</span></TabsTrigger>
            <TabsTrigger value="approved">Recently approved <span className="ml-1.5 text-xs tabular text-muted-foreground">{counts.approved}</span></TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4">
            <Card className="overflow-hidden">
              {filtered.length === 0 ? (
                <div className="p-12 text-center">
                  <CheckCircle2 className="size-10 mx-auto text-status-done/60" />
                  <div className="mt-3 font-medium">Nothing here</div>
                  <div className="text-sm text-muted-foreground">No items match your filters.</div>
                </div>
              ) : (
                <>
                  {tab === "pending" && (
                    <div className="px-4 py-2.5 border-b flex items-center gap-3 text-xs text-muted-foreground">
                      <Checkbox
                        checked={selected.size === filtered.length}
                        onCheckedChange={toggleAll}
                        aria-label="Select all"
                      />
                      <span>Select all visible · sorted by deadline</span>
                    </div>
                  )}
                  <ul className="divide-y">
                    {filtered.map((t) => (
                      <ReviewRow
                        key={t.id}
                        task={t}
                        selectable={tab === "pending"}
                        selected={selected.has(t.id)}
                        onToggle={() => toggle(t.id)}
                        onOpen={() => setActiveId(t.id)}
                        onApprove={() => applyAction([t.id], "approve")}
                        onRevise={() => applyAction([t.id], "revision")}
                      />
                    ))}
                  </ul>
                </>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ReviewSheet
        task={active}
        onClose={() => setActiveId(null)}
        onApprove={(id) => applyAction([id], "approve")}
        onRevise={(id, note) => applyAction([id], "revision", note)}
      />
    </AppShell>
  );
}

function Kpi({ label, value, icon: Icon, tone, hint }: { label: string; value: number | string; icon: any; tone: string; hint: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className={cn("size-4", tone)} />
      </div>
      <div className="mt-2 text-2xl font-semibold tabular">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{hint}</div>
    </Card>
  );
}

function ReviewRow({
  task, selectable, selected, onToggle, onOpen, onApprove, onRevise,
}: {
  task: Task;
  selectable: boolean;
  selected: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onApprove: () => void;
  onRevise: () => void;
}) {
  const project = projects.find((p) => p.id === task.projectId)!;
  const assignee = users.find((u) => u.id === task.assigneeId)!;
  const stages = project.type === "video" ? VIDEO_STAGES : STATIC_STAGES;
  const stageName = stages[task.stage % stages.length];
  const overdue = new Date(task.deadline).getTime() < Date.now() && task.status !== "done";

  return (
    <li className={cn("px-4 py-3 flex items-center gap-3 hover:bg-muted/40 transition-colors", selected && "bg-primary/5")}>
      {selectable && (
        <Checkbox checked={selected} onCheckedChange={onToggle} onClick={(e) => e.stopPropagation()} aria-label={`Select ${task.title}`} />
      )}
      <button onClick={onOpen} className="size-14 rounded-md bg-muted shrink-0 grid place-items-center group relative overflow-hidden">
        {project.type === "video" ? (
          <Play className="size-5 text-muted-foreground group-hover:text-foreground" />
        ) : (
          <div className="size-full bg-gradient-to-br from-primary/20 to-accent/20" />
        )}
      </button>
      <button onClick={onOpen} className="min-w-0 flex-1 text-left">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{task.title}</span>
          <PriorityChip priority={task.priority} />
        </div>
        <div className="text-xs text-muted-foreground truncate mt-0.5">
          {project.name} · <span className="capitalize">{stageName}</span> · v{(task.id.charCodeAt(1) % 3) + 1}
        </div>
      </button>

      <div className="hidden md:flex items-center gap-2 min-w-[160px]">
        <Avatar className="size-7"><AvatarImage src={assignee.avatar} /><AvatarFallback>{assignee.name[0]}</AvatarFallback></Avatar>
        <div className="text-xs">
          <div className="font-medium truncate max-w-[110px]">{assignee.name}</div>
          <div className="text-muted-foreground truncate max-w-[110px]">{assignee.department}</div>
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-3 text-xs text-muted-foreground min-w-[140px]">
        <span className="inline-flex items-center gap-1"><MessageSquare className="size-3.5" />{task.comments}</span>
        <span className="inline-flex items-center gap-1"><Paperclip className="size-3.5" />{task.attachments}</span>
        <span className={cn("inline-flex items-center gap-1", overdue && "text-status-overdue")}>
          <Clock className="size-3.5" />{formatDistanceToNow(new Date(task.deadline), { addSuffix: true })}
        </span>
      </div>

      <StatusBadge status={task.status} className="hidden sm:inline-flex" />

      <div className="flex items-center gap-1.5">
        {task.status === "review" && (
          <>
            <Button size="sm" variant="ghost" onClick={onRevise}>
              <RotateCcw className="size-4" />
              <span className="hidden md:inline">Revise</span>
            </Button>
            <Button size="sm" onClick={onApprove}>
              <CheckCircle2 className="size-4" />
              <span className="hidden md:inline">Approve</span>
            </Button>
          </>
        )}
        {task.status !== "review" && (
          <Button size="sm" variant="ghost" onClick={onOpen}>
            Open <ChevronRight className="size-4" />
          </Button>
        )}
      </div>
    </li>
  );
}

function ReviewSheet({
  task, onClose, onApprove, onRevise,
}: {
  task: Task | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  onRevise: (id: string, note: string) => void;
}) {
  const [note, setNote] = useState("");
  useEffect(() => { setNote(""); }, [task?.id]);

  if (!task) {
    return (
      <Sheet open={false} onOpenChange={(o) => !o && onClose()}>
        <SheetContent />
      </Sheet>
    );
  }

  const project = projects.find((p) => p.id === task.projectId)!;
  const assignee = users.find((u) => u.id === task.assigneeId)!;
  const stages = project.type === "video" ? VIDEO_STAGES : STATIC_STAGES;
  const overdue = new Date(task.deadline).getTime() < Date.now() && task.status !== "done";

  return (
    <Sheet open={!!task} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="pr-8">{task.title}</SheetTitle>
          <SheetDescription>
            {project.name} · <span className="capitalize">{stages[task.stage % stages.length]}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-5">
          {/* Preview */}
          <div className="aspect-video rounded-lg bg-muted relative overflow-hidden grid place-items-center">
            {project.type === "video" ? (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-accent/30" />
                <Button size="lg" variant="secondary" className="relative z-10">
                  <Play className="size-5" /> Play preview
                </Button>
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-foreground/80">
                  <span className="px-2 py-0.5 rounded bg-background/80 backdrop-blur tabular">00:42 / 02:18</span>
                  <span className="px-2 py-0.5 rounded bg-background/80 backdrop-blur">1920×1080 · H.264</span>
                </div>
              </>
            ) : (
              <div className="size-full bg-gradient-to-br from-primary/25 to-accent/25" />
            )}
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Meta label="Assignee">
              <div className="flex items-center gap-2">
                <Avatar className="size-6"><AvatarImage src={assignee.avatar} /><AvatarFallback>{assignee.name[0]}</AvatarFallback></Avatar>
                <span>{assignee.name}</span>
              </div>
            </Meta>
            <Meta label="Status"><StatusBadge status={task.status} /></Meta>
            <Meta label="Priority"><PriorityChip priority={task.priority} /></Meta>
            <Meta label="Deadline">
              <span className={cn("tabular", overdue && "text-status-overdue")}>
                {formatDistanceToNow(new Date(task.deadline), { addSuffix: true })}
              </span>
            </Meta>
            <Meta label="Time logged">{Math.round(task.timeSpentMin / 60 * 10) / 10}h</Meta>
            <Meta label="Attachments">{task.attachments} files</Meta>
          </div>

          <Separator />

          {/* Activity */}
          <div>
            <div className="text-sm font-medium mb-2">Submission notes</div>
            <Card className="p-3 text-sm bg-muted/40">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
                <Avatar className="size-5"><AvatarImage src={assignee.avatar} /><AvatarFallback>{assignee.name[0]}</AvatarFallback></Avatar>
                <span className="font-medium text-foreground">{assignee.name}</span>
                <span>· {formatDistanceToNow(new Date(task.deadline), { addSuffix: true })}</span>
              </div>
              Submitted v{(task.id.charCodeAt(1) % 3) + 1} with the color pass tweaks you flagged last round. Open to alt cuts on the second half.
            </Card>
          </div>

          {/* Reviewer note */}
          {task.status === "review" && (
            <div>
              <div className="text-sm font-medium mb-2">Reviewer note (optional)</div>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What needs to change? Be specific so the team can act fast."
                rows={4}
              />
            </div>
          )}
        </div>

        {/* Sticky footer actions */}
        {task.status === "review" && (
          <div className="sticky bottom-0 -mx-6 mt-6 px-6 py-4 border-t bg-background flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm">
              <Download className="size-4" /> Download assets
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => onRevise(task.id, note)}>
                <RotateCcw className="size-4" /> Request revision
              </Button>
              <Button onClick={() => onApprove(task.id)}>
                <CheckCircle2 className="size-4" /> Approve
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div>{children}</div>
    </div>
  );
}
