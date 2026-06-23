import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import {
  type MyTask,
  type Lifecycle,
  LEGAL_TRANSITIONS,
} from "@/data/myTasks";

interface State {
  tasks: MyTask[];

  activeId: string | null;
  pendingSwitchId: string | null;

  setTasks: (tasks: MyTask[]) => void;

  setPendingSwitch: (id: string | null) => void;

  startTask: (id: string) => "started" | "switch" | "noop";

  confirmSwitch: () => void;

  pauseTask: (id: string) => void;

  submitForReview: (
    id: string,
    note?: string,
    fileNames?: string[]
  ) => void;

  resumeRevision: (id: string) => void;

  attemptMove: (id: string, to: Lifecycle) => boolean;
}

function findActive(tasks: MyTask[]): string | null {
  return tasks.find((t) => t.lifecycle === "in_progress")?.id ?? null;
}

function bankRunningTime(t: MyTask): MyTask {
  if (!t.runningSince) return t;

  const min = Math.floor(
    (Date.now() - new Date(t.runningSince).getTime()) / 60000
  );

  return {
    ...t,
    accumulatedMin: t.accumulatedMin + min,
    runningSince: undefined,
  };
}

export const useActiveTask = create<State>((set, get) => ({
  tasks: [],

  activeId: null,

  pendingSwitchId: null,

  setTasks: (tasks) =>
    set({
      tasks,
      activeId: findActive(tasks),
    }),

  setPendingSwitch: (id) =>
    set({
      pendingSwitchId: id,
    }),

  startTask: (id) => {
    console.log("START CLICKED", id);
    const { tasks, activeId } = get();

    const task = tasks.find((t) => t.id === id);

    if (!task) return "noop";

    if (task.lifecycle === "in_progress") return "noop";

    if (activeId && activeId !== id) {
      set({ pendingSwitchId: id });
      return "switch";
    }

   set({
      tasks: tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              lifecycle: "in_progress",
              runningSince: new Date().toISOString(),
            }
          : t
      ),
      activeId: id,
    });

    supabase
      .from("tasks")
      .update({ status: "in_progress" })
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.error("Resume error:", error);
      });

    return "started";

    supabase
      .from("tasks")
      .update({ status: "in_progress" })
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.error(error);
      });

    return "started";
  },

  confirmSwitch: () => {
    const { tasks, activeId, pendingSwitchId } = get();

    if (!pendingSwitchId) return;

    const next = tasks.map((t) => {
      if (t.id === activeId) {
        return {
          ...bankRunningTime(t),
          lifecycle: "paused" as Lifecycle,
        };
      }

      if (t.id === pendingSwitchId) {
        return {
          ...t,
          lifecycle: "in_progress" as Lifecycle,
          runningSince: new Date().toISOString(),
        };
      }

      return t;
    });

    set({
      tasks: next,
      activeId: pendingSwitchId,
      pendingSwitchId: null,
    });
  },

  pauseTask: (id) => {
    const { tasks, activeId } = get();

    set({
      tasks: tasks.map((t) =>
        t.id === id
          ? {
              ...bankRunningTime(t),
              lifecycle: "paused",
            }
          : t
      ),
      activeId: activeId === id ? null : activeId,
    });

    supabase
      .from("tasks")
      .update({ status: "paused" })
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.error(error);
      });
  },

  submitForReview: (id, note, fileNames) => {
    const { tasks, activeId } = get();

    set({
      tasks: tasks.map((t) =>
        t.id === id
          ? {
              ...bankRunningTime(t),
              lifecycle: "review",
              submittedAt: new Date().toISOString(),
              attachments:
                (t.attachments ?? 0) +
                (fileNames?.length ?? 0),
              comments:
                (t.comments ?? 0) +
                (note ? 1 : 0),
            }
          : t
      ),
      activeId: activeId === id ? null : activeId,
    });
  },

  resumeRevision: (id) => {
    const { tasks, activeId } = get();

    if (activeId && activeId !== id) {
      set({ pendingSwitchId: id });
      return;
    }

    set({
      tasks: tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              lifecycle: "in_progress",
              runningSince: new Date().toISOString(),
              revisions: (t.revisions ?? 0) + 1,
            }
          : t
      ),
      activeId: id,
    });

    supabase
      .from("tasks")
      .update({ status: "in_progress" })
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.error(error);
      });
  },

  attemptMove: (id, to) => {
    const { tasks } = get();

    const task = tasks.find((t) => t.id === id);

    if (!task) return false;

    const allowed = LEGAL_TRANSITIONS[task.lifecycle];

    if (!allowed.includes(to)) return false;

    if (to === "in_progress") {
      if (task.lifecycle === "revision") {
        get().resumeRevision(id);
      } else {
        const result = get().startTask(id);

        if (result === "switch") {
          return false;
        }
      }

      return true;
    }

    if (to === "paused") {
      get().pauseTask(id);
      return true;
    }

    if (to === "review") {
      return false;
    }

    return false;
  },
}));