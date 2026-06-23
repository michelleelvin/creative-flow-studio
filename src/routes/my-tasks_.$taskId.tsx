import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useCallback, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, FileText, Download, Image as ImageIcon, Film, FileArchive,
  UploadCloud, X, Send, Paperclip, MessageSquare, Calendar, Briefcase,
  Play, Pause, Timer,
} from "lucide-react";
import { useActiveTask } from "@/hooks/useActiveTask";
import { supabase } from "@/lib/supabase";
import { myProjects } from "@/data/myTasks";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/my-tasks_/$taskId")({
  head: () => ({
    meta: [
      { title: "Task — WWEMS" },
      { name: "description", content: "Deliverable brief, source assets, and submit final work for internal review." },
    ],
  }),
  component: TaskDetailPage,
});

interface BriefAsset {
  name: string;
  size: string;
  kind: "doc" | "image" | "video" | "archive";
}



const ICONS = {
  doc: FileText, image: ImageIcon, video: Film, archive: FileArchive,
} as const;

function TaskDetailPage() {
  const { taskId } = Route.useParams();
  console.log("CURRENT TASK ID:", taskId);
  const navigate = useNavigate();
  const task = useActiveTask((s) => s.tasks.find((t) => t.id === taskId));
  const submitForReview = useActiveTask((s) => s.submitForReview);

  const project = {
    name: "Project",
    stage: "Active",
    type: "video",
  };

  const [files, setFiles] = useState<File[]>([]);
  const [sourceAssets, setSourceAssets] = useState<any[]>([]);
  const [taskAssets, setTaskAssets] = useState<any[]>([]);
  const [note, setNote] = useState("");
  const [dragOver, setDragOver] = useState(false);
  useEffect(() => {
  async function loadAssets() {
    const { data: sourceData } = await supabase
      .from("source_assets")
      .select("*")
      .eq("task_id", taskId);

    setSourceAssets(sourceData || []);

    const { data: taskData } = await supabase
      .from("task_assets")
      .select("*")
      .eq("task_id", taskId);

    setTaskAssets(taskData || []);
  }

  loadAssets();
}, [taskId]);
  // Timer
  const [running, setRunning] = useState(false);
  const [accumMs, setAccumMs] = useState(0);
  const [runStart, setRunStart] = useState<number | null>(null);
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const elapsedMs = accumMs + (running && runStart ? Date.now() - runStart : 0);
  const fmtTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };
  const toggleTimer = async () => {
    if (running) {
      await supabase
        .from("tasks")
        .update({ status: "paused" })
        .eq("id", taskId);

      setAccumMs((a) => a + (runStart ? Date.now() - runStart : 0));
      setRunStart(null);
      setRunning(false);
    } else {
      await supabase
        .from("tasks")
        .update({ status: "in_progress" })
        .eq("id", taskId);

      setRunStart(Date.now());
      setRunning(true);
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) setFiles((prev) => [...prev, ...dropped]);
  }, []);

  if (!task) {
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto py-16 text-center space-y-4">
          <h1 className="text-2xl font-semibold">Task not found</h1>
          <Button asChild variant="outline">
            <Link to="/my-tasks"><ArrowLeft className="size-4" /> Back to My Tasks</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const handleSubmit = async () => {
    if (!files.length) {
      toast.error("Drop at least one file before submitting");
      return;
    }

    try {
      for (const file of files) {
        const filePath = `${taskId}/${Date.now()}-${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from("task-assets")
          .upload(filePath, file);

        if (uploadError) {
          console.error("UPLOAD ERROR:", uploadError);
          throw uploadError;
        }

        const { data } = supabase.storage
          .from("task-assets")
          .getPublicUrl(filePath);

        const { data: inserted, error: insertError } = await supabase
          .from("task_assets")
          .insert({
            task_id: taskId,
            file_name: file.name,
            file_url: data.publicUrl,
          })
          .select();

        console.log("TASK_ASSETS INSERTED:", inserted);
        console.log("TASK_ASSETS ERROR:", insertError);

        if (insertError) {
          throw insertError;
        }
      }

      await supabase
        .from("tasks")
        .update({
          status: "review",
        })
        .eq("id", taskId);

      toast.success("Submitted for Review");
      const { data: refreshedTaskAssets } = await supabase
        .from("task_assets")
        .select("*")
        .eq("task_id", taskId);

      setTaskAssets(refreshedTaskAssets || []);

      navigate({ to: "/my-tasks" });
    } catch (err) {
      console.error("SUBMIT ERROR:", err);
      toast.error("Upload failed");
    }
  };

  return (
    <AppShell>
      <div className="space-y-5 max-w-[1500px]">
        {/* Breadcrumb / header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2 min-w-0">
            <Button asChild variant="ghost" size="sm" className="-ml-2 h-8 text-muted-foreground">
              <Link to="/my-tasks"><ArrowLeft className="size-4" /> My Tasks</Link>
            </Button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Briefcase className="size-3.5" />
              <span>{project.name}</span>
              <span>·</span>
              <span>{project.stage}</span>
              <Badge variant="secondary" className="ml-1 capitalize">{project.type}</Badge>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{task.title}</h1>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Calendar className="size-3.5" /> Due {new Date(task.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
              <span className="capitalize">Priority: {task.priority}</span>
              <span className="capitalize">Status: {task.lifecycle.replace("_", " ")}</span>
            </div>
          </div>

          {/* Task timer */}
          <div className={cn(
            "flex items-center gap-3 rounded-xl border px-4 py-3 bg-card shadow-sm",
            running && "border-primary/40 bg-primary/5",
          )}>
            <div className={cn(
              "size-9 rounded-lg grid place-items-center",
              running ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}>
              <Timer className="size-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Time on task</span>
              <span className={cn("font-mono text-lg leading-tight tabular-nums", running && "text-primary")}>
                {fmtTime(elapsedMs)}
              </span>
            </div>
            <Button
              size="sm"
              variant={running ? "outline" : "default"}
              onClick={toggleTimer}
              className="ml-2"
            >
              {running ? <><Pause className="size-4" /> Pause</> : <><Play className="size-4" /> Start</>}
            </Button>
          </div>
        </div>

        {/* Two corners */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Corner 1 — Brief + Assets */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="size-4 text-primary" /> Client Brief
                  </CardTitle>
                  <CardDescription>What the client asked for and the source material to work from.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3 text-sm leading-relaxed">
                <p>
                  <span className="font-semibold">Objective: </span>
                  {task.objective || "No objective provided."}
                </p>

                <p>
                  <span className="font-semibold">Tone: </span>
                  {task.tone || "No tone specified."}
                </p>

                <p>
                  <span className="font-semibold">Deliverables: </span>
                  {task.deliverable || "No deliverables specified."}
                </p>
                <p className="text-muted-foreground italic">

                  Notes: Maintain the approved color palette. Use only licensed assets supplied below.

                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Source Assets</h3>
                  <span className="text-xs text-muted-foreground">
                    {sourceAssets.length} files
                  </span>
                </div>
                <ul className="divide-y rounded-lg border overflow-hidden">
                  {sourceAssets.map((a) => {
                    const Icon = FileText;
                    return (
                      <li key={a.name} className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent/50 transition-colors">
                        <div className="size-8 rounded-md bg-muted grid place-items-center shrink-0">
                          <Icon className="size-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {a.file_name}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            Uploaded asset
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() => window.open(a.file_url, "_blank")}
                        >
                          <Download className="size-3.5" />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
                <div className="space-y-2 mt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Submitted Work</h3>

                    <span className="text-xs text-muted-foreground">
                      {taskAssets.length} files
                    </span>
                  </div>

                  <ul className="divide-y rounded-lg border overflow-hidden">
                    {taskAssets.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent/50 transition-colors"
                      >
                        <div className="size-8 rounded-md bg-muted grid place-items-center shrink-0">
                          <FileText className="size-4 text-muted-foreground" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {a.file_name}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            Submitted by employee
                          </p>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() => window.open(a.file_url, "_blank")}
                        >
                          <Download className="size-3.5" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Corner 2 — Submit for review */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UploadCloud className="size-4 text-primary" /> Submit Final Work
              </CardTitle>
              <CardDescription>Drop your final files and send for internal review.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={cn(
                  "rounded-lg border-2 border-dashed p-8 text-center transition-colors",
                  dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/20 hover:bg-muted/40",
                )}
              >
                <UploadCloud className={cn("size-10 mx-auto mb-3", dragOver ? "text-primary" : "text-muted-foreground")} />
                <p className="text-sm font-medium">Drop files here</p>
                <p className="text-xs text-muted-foreground mt-1">or</p>
                <label className="inline-flex mt-2">
                  <input
                    type="file"
                    multiple
                    className="sr-only"
                    onChange={(e) => {
                      const picked = Array.from(e.target.files ?? []);
                      if (picked.length) setFiles((prev) => [...prev, ...picked]);
                    }}
                  />
                  <span className="cursor-pointer text-sm text-primary hover:underline">browse from your device</span>
                </label>
                <p className="text-xs text-muted-foreground mt-3">Video, image, PDF, ZIP — up to 2GB per file</p>
              </div>

              {files.length > 0 && (
                <ul className="space-y-1.5 max-h-48 overflow-y-auto">
                  {files.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm">
                      <Paperclip className="size-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate flex-1">{f.name}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {(f.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                      <button
                        onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="Remove file"
                      >
                        <X className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <MessageSquare className="size-3.5" /> Note for reviewer
                  <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                </label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Anything the reviewer should know — what changed, what to focus on…"
                  rows={4}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-muted-foreground">
                  Submitting moves this task to <span className="font-medium text-foreground">Ready for Review</span>.
                </p>
                <Button onClick={handleSubmit} disabled={!files.length}>
                  <Send className="size-4" /> Submit for Review
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
