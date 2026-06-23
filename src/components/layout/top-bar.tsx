import { useEffect, useState } from "react";
import { Bell, Search, Moon, Sun, ChevronDown, Briefcase, UtensilsCrossed, Coffee, Settings, LogOut, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuRadioGroup, DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { useRole } from "@/stores/role";
import { supabase } from "@/lib/supabase";
import { users, notifications } from "@/data/mock";
import { useRouter, useRouterState } from "@tanstack/react-router";

function formatHM(ms: number) {
  const sign = ms < 0 ? "-" : "";
  const a = Math.abs(ms);
  const h = Math.floor(a / 3600_000);
  const m = Math.floor((a % 3600_000) / 60_000);
  return h > 0 ? `${sign}${h}h ${m.toString().padStart(2, "0")}m` : `${sign}${m}m`;
}
function formatMS(ms: number) {
  const sign = ms < 0 ? "-" : "";
  const a = Math.abs(ms);
  const m = Math.floor(a / 60_000);
  const s = Math.floor((a % 60_000) / 1000);
  return `${sign}${m}:${s.toString().padStart(2, "0")}`;
}

type Status = "working" | "lunch" | "break";
const STATUS_META: Record<Status, { label: string; icon: typeof Briefcase; dot: string; symbol: string; limitMs?: number }> = {
  working: { label: "Working", icon: Briefcase,      dot: "bg-status-done", symbol: "💼" },
  lunch:   { label: "Lunch",   icon: UtensilsCrossed, dot: "bg-amber-500",   symbol: "🍽️", limitMs: 60 * 60_000 },
  break:   { label: "Break",   icon: Coffee,          dot: "bg-sky-500",     symbol: "☕", limitMs: 15 * 60_000 },
};
export function TopBar() {
  const role = useRole((s) => s.role);

  const theme = useRole((s) => s.theme);
  const toggleTheme = useRole((s) => s.toggleTheme);

  const router = useRouter();
  const path = useRouterState({
    select: (r) => r.location.pathname,
  });

  const [userName, setUserName] = useState("");
  const [userPosition, setUserPosition] = useState("");
  const [userAvatar, setUserAvatar] = useState("");

  const [status, setStatusRaw] = useState<Status>("working");
  const [statusStart, setStatusStart] = useState<number>(() => Date.now());

  const setStatus = (s: Status) => {
    setStatusRaw(s);
    setStatusStart(Date.now());
  };

  const [sessionStart] = useState(() => {
    const d = new Date();
    d.setHours(9, 14, 0, 0);
    return d.getTime();
  });

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      theme === "dark"
    );
  }, [theme]);

  useEffect(() => {
  const loadUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log("AUTH USER:", user);

    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    console.log("PROFILE FULL:", JSON.stringify(data, null, 2));
    console.log("PROFILE ERROR:", error);

    if (data) {
      setUserName(data.full_name || "");
      setUserPosition(data.role || "");
      setUserAvatar(data.avatar_url || "");
    }
    const { data: employeeData } = await supabase
  .from("users")
  .select("*")
  .eq("email", user.email)
  .single();

if (employeeData) {
  setUserName(employeeData.name);
  setUserPosition(employeeData.department);
  setUserAvatar(employeeData.avatar_url || "");
}
  };

  loadUser();
}, []);

  const unread = notifications.filter((n) => !n.read).length;

  const rawCrumb =
    path === "/"
      ? "Sign in"
      : path.replace("/", "").replace(/-/g, " ") || "Dashboard";

  const crumb =
    rawCrumb === role
      ? userPosition || role
      : rawCrumb;

  return (
    <header className="h-14 border-b bg-background/80 backdrop-blur flex items-center gap-3 px-4 sticky top-0 z-30">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="Back"
          onClick={() => router.history.back()}
        >
          <ArrowLeft className="size-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="Forward"
          onClick={() => router.history.forward()}
        >
          <ArrowRight className="size-4" />
        </Button>
      </div>

      <div className="text-sm text-muted-foreground capitalize">
        {crumb}
      </div>

      <div className="flex-1 max-w-md mx-auto hidden lg:flex items-center gap-2 h-9 rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground">
        <Search className="size-3.5" />
        <span>Search deliverables, tasks, people…</span>
        <kbd className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border">
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {(() => {
          const meta = STATUS_META[status];
          const elapsed = now - statusStart;
          const over = meta.limitMs
            ? elapsed > meta.limitMs
            : false;

          const display = meta.limitMs
            ? formatMS(meta.limitMs - elapsed)
            : formatHM(now - sessionStart);

          return (
            <div
              className={`hidden sm:flex items-center gap-2 h-8 px-2.5 rounded-full border text-xs ${
                over
                  ? "border-destructive text-destructive"
                  : ""
              }`}
            >
              <span
                className={`size-1.5 rounded-full ${meta.dot} ${
                  status === "working"
                    ? "animate-pulse"
                    : ""
                }`}
              />
              <span>{meta.symbol}</span>
              <span className="text-muted-foreground">
                {meta.label} ·
              </span>
              <span className="font-mono">
                {display}
                {over
                  ? " over"
                  : meta.limitMs
                  ? " left"
                  : ""}
              </span>
            </div>
          );
        })()}

        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="size-4" />

          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-destructive" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full pr-2 pl-0.5 py-0.5 hover:bg-accent transition-colors">
              <Avatar className="size-7">
                <AvatarImage src={userAvatar} />

                <AvatarFallback>
                  {userName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>

              <span className="text-sm font-medium hidden sm:inline">
                {userName.split(" ")[0]}
              </span>

              <ChevronDown className="size-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col">
              <span>{userName}</span>

              <span className="text-xs font-normal text-muted-foreground">
                {userPosition}
              </span>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Status
            </DropdownMenuLabel>

            <DropdownMenuRadioGroup
              value={status}
              onValueChange={(v) =>
                setStatus(v as Status)
              }
            >
              {(Object.keys(STATUS_META) as Status[]).map(
                (s) => {
                  const Icon = STATUS_META[s].icon;

                  return (
                    <DropdownMenuRadioItem
                      key={s}
                      value={s}
                      className="gap-2"
                    >
                      <Icon className="size-3.5" />
                      {STATUS_META[s].label}
                    </DropdownMenuRadioItem>
                  );
                }
              )}
            </DropdownMenuRadioGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem className="gap-2">
              <Settings className="size-3.5" />
              Profile settings
            </DropdownMenuItem>

            <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive">
              <LogOut className="size-3.5" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <span className="hidden">{users.length}</span>
    </header>
  );
}