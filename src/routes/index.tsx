import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Users,
  Camera,
  BarChart3,
  LogOut,
  Loader2,
  Play,
  Pause,
  Square,
  Coffee,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  TrendingUp,
  Shield,
  Copy,
  Briefcase,
  FileText,
  Filter,
  History,
  UserCheck,
  KeyRound,
  CameraIcon,
  Bell,
  DollarSign,
  AlertTriangle,
  Video,
  Edit3,
  Settings,
  Calculator,
  Lock,
  MonitorPlay,
  WifiOff,
  UserCircle,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth, type AppRole } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { reviewScreenshot } from "@/lib/screenshots.functions";
import {
  upsertAttendanceManual,
  updateEmployeeCompensation,
  calculateSalary,
  overrideSalary,
  finalizeSalary,
  requestClip,
  resolveAlert,
} from "@/lib/workforce.functions";
import { CaptureSession } from "@/lib/capture";
import { usePlan } from "@/lib/usePlan";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TillTask — Remote Workforce Productivity" },
      {
        name: "description",
        content: "Monitor remote employees, track time, and measure productivity.",
      },
    ],
  }),
  component: HomeGate,
});

function HomeGate() {
  const { loading, identityLoading, user, primaryRole, companyId, profile } = useAuth();
  const navigate = useNavigate();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    if (loading || identityLoading) return;
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    // Wait until profile actually resolved before deciding to send admins to onboarding
    if (!primaryRole) {
      navigate({ to: "/onboarding" });
      return;
    }
    if (primaryRole === "company_admin") {
      if (!companyId) {
        navigate({ to: "/onboarding" });
        return;
      }
      // Only redirect if the company hasn't completed onboarding
      (async () => {
        const { data } = await supabase
          .from("companies")
          .select("onboarded")
          .eq("id", companyId)
          .maybeSingle();
        if (data && data.onboarded === false) {
          setNeedsOnboarding(true);
          navigate({ to: "/onboarding" });
        }
        setOnboardingChecked(true);
      })();
    } else {
      setOnboardingChecked(true);
    }
  }, [loading, identityLoading, user, primaryRole, companyId, profile, navigate]);

  if (loading || identityLoading || !user || !primaryRole || (primaryRole === "company_admin" && !onboardingChecked) || needsOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  return <AppShell role={primaryRole} />;
}

type Tab = "home" | "team" | "screens" | "payroll" | "reports" | "profile";

function AppShell({ role }: { role: AppRole }) {
  const [tab, setTab] = useState<Tab>("home");
  const { profile, signOut, companyId } = useAuth();
  const navigate = useNavigate();
  const plan = usePlan();
  const isAdmin = role !== "employee";

  const allTabs: { id: Tab; label: string; icon: React.ElementType; allow: AppRole[]; gate?: boolean }[] = [
    { id: "home", label: "Home", icon: LayoutDashboard, allow: ["super_admin", "company_admin", "employee"] },
    { id: "team", label: "Team", icon: Users, allow: ["super_admin", "company_admin"] },
    { id: "screens", label: "Screens", icon: Camera, allow: ["super_admin", "company_admin", "employee"] },
    { id: "payroll", label: "Payroll", icon: DollarSign, allow: ["super_admin", "company_admin", "employee"], gate: plan.payroll },
    { id: "reports", label: "Reports", icon: BarChart3, allow: ["super_admin", "company_admin"], gate: plan.advancedReports },
    { id: "profile", label: "Profile", icon: UserCircle, allow: ["super_admin", "company_admin", "employee"] },
  ];
  const tabs = allTabs.filter((t) => t.allow.includes(role) && (t.gate === undefined || t.gate));

  function handleTab(id: Tab) {
    if (id === "profile") {
      navigate({ to: "/profile" });
      return;
    }
    setTab(id);
  }

  const roleLabel = isAdmin ? "Business Operations" : "Team Member";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-72 shrink-0 border-r bg-card flex-col sticky top-0 h-screen">
        <div className="flex items-center gap-3 px-5 py-5 border-b">
          <div className="w-11 h-11 rounded-2xl bg-foreground flex items-center justify-center shadow-sm">
            <Briefcase className="w-5 h-5 text-background" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-lg leading-tight truncate">TillTask</div>
            <div className="text-[10px] tracking-widest uppercase text-muted-foreground font-semibold truncate">
              {roleLabel}
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleTab(t.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium transition-colors ${
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="truncate">{t.label}</span>
              </button>
            );
          })}
          {isAdmin && (
            <button
              onClick={() => navigate({ to: "/pricing" })}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            >
              <DollarSign className="w-5 h-5 shrink-0" />
              Pricing
            </button>
          )}
        </nav>
        <div className="p-3 border-t space-y-3">
          {isAdmin && (
            <div className="rounded-2xl border bg-muted/50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sm font-semibold capitalize">
                  <DollarSign className="w-4 h-4 text-primary" />
                  {plan.tier ?? (plan.status === "trial" ? "Trial" : "Free")}
                </div>
                {plan.status === "trial" && (
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {plan.daysLeft}d left
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {profile?.full_name ?? profile?.email}
              </div>
              {(plan.readonly || !plan.tier) && (
                <button
                  onClick={() => navigate({ to: "/pricing" })}
                  className="w-full bg-foreground text-background rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 transition"
                >
                  Upgrade to Pro
                </button>
              )}
            </div>
          )}
          <button
            onClick={async () => {
              await signOut();
              navigate({ to: "/auth" });
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border bg-card hover:bg-muted transition"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 pb-24 lg:pb-0">
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b lg:border-b">
          <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 lg:hidden">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <div className="font-bold leading-none">TillTask</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {role.replace("_", " ")}
                </div>
              </div>
            </div>
            <div className="hidden lg:block font-semibold capitalize">{tab}</div>
            <div className="flex items-center gap-2">
              {plan.readonly && (
                <Badge variant="destructive" className="hidden sm:inline-flex text-[10px]">
                  Trial ended — read-only
                </Badge>
              )}
              {isAdmin && companyId && <AlertsBell companyId={companyId} />}
              <Button
                size="icon"
                variant="ghost"
                onClick={() => navigate({ to: "/profile" })}
                title="Profile"
                className="lg:hidden"
              >
                <UserCircle className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="lg:hidden"
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/auth" });
                }}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-screen-xl mx-auto px-4 py-6">
          {tab === "home" && <HomeTab role={role} />}
          {tab === "team" && <TeamTab />}
          {tab === "screens" && <ScreensTab role={role} />}
          {tab === "payroll" && <PayrollTab role={role} />}
          {tab === "reports" && <ReportsTab />}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 bg-card border-t z-10 lg:hidden">
        <div className="max-w-screen-xl mx-auto grid" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0,1fr))` }}>
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleTab(t.id)}
                className={`flex flex-col items-center gap-1 py-3 text-xs ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

// =================== HOME TAB ===================
function HomeTab({ role }: { role: AppRole }) {
  if (role === "employee") return <EmployeeHome />;
  return <AdminHome />;
}

function AdminHome() {
  const { companyId } = useAuth();

  const { data: company } = useQuery({
    enabled: !!companyId,
    queryKey: ["company", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId!)
        .maybeSingle();
      return data;
    },
  });

  const { data: stats } = useQuery({
    enabled: !!companyId,
    queryKey: ["admin-stats", companyId],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [emps, att, pending] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("company_id", companyId!),
        supabase
          .from("attendance")
          .select("status,active_seconds,idle_seconds,productivity_score", { count: "exact" })
          .eq("company_id", companyId!)
          .eq("work_date", today),
        supabase
          .from("screenshots")
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId!)
          .eq("status", "pending"),
      ]);
      const present = (att.data ?? []).filter((a) => a.status === "present").length;
      const onBreak = (att.data ?? []).filter((a) => a.status === "on_break").length;
      const totalActive = (att.data ?? []).reduce((s, a) => s + (a.active_seconds ?? 0), 0);
      const avgScore =
        (att.data ?? []).reduce((s, a) => s + Number(a.productivity_score ?? 0), 0) /
        Math.max(att.data?.length ?? 1, 1);
      return {
        totalEmployees: emps.count ?? 0,
        present,
        onBreak,
        idle: Math.max((att.count ?? 0) - present - onBreak, 0),
        hoursToday: (totalActive / 3600).toFixed(1),
        avgScore: avgScore.toFixed(0),
        pendingScreens: pending.count ?? 0,
      };
    },
  });

  return (
    <div className="space-y-5">
      {company && (
        <Card className="p-4 bg-gradient-to-br from-primary/10 to-accent/30 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase text-muted-foreground font-semibold">Company</div>
              <div className="text-xl font-bold">{company.name}</div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase text-muted-foreground font-semibold">Invite code</div>
              <div className="flex items-center gap-1">
                <code className="font-mono font-bold text-primary">{company.invite_code}</code>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => {
                    navigator.clipboard.writeText(company.invite_code);
                    toast.success("Copied");
                  }}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Employees" value={stats?.totalEmployees ?? 0} icon={Users} />
        <StatCard label="Online now" value={stats?.present ?? 0} icon={Activity} accent="success" />
        <StatCard label="On break" value={stats?.onBreak ?? 0} icon={Coffee} accent="warning" />
        <StatCard label="Hours today" value={stats?.hoursToday ?? "0.0"} icon={Clock} />
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-semibold">Productivity score</div>
            <div className="text-xs text-muted-foreground">Average across team today</div>
          </div>
          <div className="text-3xl font-bold text-primary">{stats?.avgScore ?? "0"}%</div>
        </div>
        <ProductivityBreakdown companyId={companyId} />
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold">Pending screenshot reviews</div>
          <Badge variant="secondary">{stats?.pendingScreens ?? 0}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Open the <strong>Screens</strong> tab to approve or reject pending screenshots.
        </p>
      </Card>
    </div>
  );
}

function EmployeeHome() {
  const { user, companyId } = useAuth();
  const qc = useQueryClient();
  const [tracking, setTracking] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [onBreak, setOnBreak] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const sessionRef = useRef<CaptureSession | null>(null);
  const [attendanceId, setAttendanceId] = useState<string | null>(null);

  useEffect(() => {
    if (!tracking || onBreak) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [tracking, onBreak]);

  // Persist active_seconds every 30s so reloading doesn't lose progress
  useEffect(() => {
    if (!tracking || !attendanceId) return;
    const id = setInterval(() => {
      supabase.from("attendance").update({ active_seconds: seconds }).eq("id", attendanceId);
    }, 30_000);
    return () => clearInterval(id);
  }, [tracking, attendanceId, seconds]);

  // Cleanup capture on unmount
  useEffect(() => {
    return () => {
      sessionRef.current?.stop();
      sessionRef.current = null;
    };
  }, []);

  const { data: today } = useQuery({
    enabled: !!user,
    queryKey: ["my-attendance", user?.id],
    queryFn: async () => {
      const date = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("attendance")
        .select("*")
        .eq("user_id", user!.id)
        .eq("work_date", date)
        .maybeSingle();
      return data;
    },
  });

  // Restore in-progress clock-in on mount/navigation back
  useEffect(() => {
    if (!today || tracking) return;
    if (today.clock_in && !today.clock_out) {
      const base = today.active_seconds ?? 0;
      const sinceClockIn = Math.max(0, Math.floor((Date.now() - new Date(today.clock_in).getTime()) / 1000));
      setSeconds(Math.max(base, sinceClockIn));
      setAttendanceId(today.id);
      setTracking(true);
      setOnBreak(today.status === "on_break");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today]);

  // Pending clip requests for this employee
  const { data: pendingClipReq } = useQuery({
    enabled: !!user,
    queryKey: ["my-clip-reqs", user?.id],
    refetchInterval: 15000,
    queryFn: async () => {
      const { data } = await supabase
        .from("clip_requests")
        .select("id, reason, requested_by, created_at")
        .eq("employee_id", user!.id)
        .eq("status", "pending")
        .gte("expires_at", new Date().toISOString());
      return data ?? [];
    },
  });

  async function startCapture(attId: string | null) {
    if (!user || !companyId) return false;
    if (sessionRef.current?.active) return true;
    setCaptureError(null);
    const sess = new CaptureSession({
      userId: user.id,
      companyId,
      attendanceId: attId,
      onAlert: (k, m) => {
        if (k === "info") toast.success(m);
        else toast.warning(m);
      },
      onStopped: () => {
        setCapturing(false);
        toast.error("Screen sharing stopped — your admin has been alerted");
      },
    });
    try {
      await sess.start();
      sessionRef.current = sess;
      setCapturing(true);
      return true;
    } catch (e) {
      const msg = (e as Error).message;
      setCaptureError(msg);
      toast.error("Screen sharing denied or unsupported. Tracking will continue without recording.");
      return false;
    }
  }

  async function clockAction(action: "in" | "out" | "break") {
    if (!user || !companyId) return;
    const date = new Date().toISOString().slice(0, 10);
    if (action === "in") {
      const { data: row, error } = await supabase
        .from("attendance")
        .upsert(
          {
            user_id: user.id,
            company_id: companyId,
            work_date: date,
            clock_in: new Date().toISOString(),
            status: "present",
            active_seconds: seconds,
          },
          { onConflict: "user_id,work_date" },
        )
        .select("id")
        .single();
      if (error) {
        toast.error(error.message);
        return;
      }
      setAttendanceId(row.id);
      setTracking(true);
      setOnBreak(false);
      toast.success("Clocked in");
      // start screen capture (browser will prompt for share permission)
      await startCapture(row.id);
      qc.invalidateQueries({ queryKey: ["my-attendance", user.id] });
    } else if (action === "out") {
      await supabase
        .from("attendance")
        .update({
          clock_out: new Date().toISOString(),
          status: "clocked_out",
          active_seconds: seconds,
        })
        .eq("user_id", user.id)
        .eq("work_date", date);
      setTracking(false);
      sessionRef.current?.stop();
      sessionRef.current = null;
      setCapturing(false);
      toast.success("Clocked out");
      qc.invalidateQueries({ queryKey: ["my-attendance", user.id] });
    } else {
      const nextOnBreak = !onBreak;
      setOnBreak(nextOnBreak);
      await supabase
        .from("attendance")
        .update({ status: nextOnBreak ? "on_break" : "present" })
        .eq("user_id", user.id)
        .eq("work_date", date);
    }
  }

  const fmt = (s: number) =>
    `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="space-y-4">
      <Card className="p-6 text-center bg-gradient-to-br from-primary/10 to-accent/40">
        <div className="text-xs uppercase font-semibold text-muted-foreground">Today</div>
        <div className="text-5xl font-bold font-mono my-3">{fmt(seconds)}</div>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Badge variant={tracking ? "default" : "secondary"}>
            {tracking ? (onBreak ? "On break" : "Tracking…") : "Idle"}
          </Badge>
          {capturing ? (
            <Badge variant="default" className="bg-success">
              <MonitorPlay className="w-3 h-3" /> Recording
            </Badge>
          ) : tracking ? (
            <Badge variant="destructive">
              <WifiOff className="w-3 h-3" /> Not recording
            </Badge>
          ) : null}
        </div>
        <div className="flex gap-2 mt-4 justify-center flex-wrap">
          {!tracking ? (
            <Button onClick={() => clockAction("in")}>
              <Play className="w-4 h-4" /> Clock in & start recording
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => clockAction("break")}>
                {onBreak ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {onBreak ? "Resume" : "Break"}
              </Button>
              {!capturing && (
                <Button variant="outline" onClick={() => startCapture(attendanceId)}>
                  <MonitorPlay className="w-4 h-4" /> Resume recording
                </Button>
              )}
              <Button variant="destructive" onClick={() => clockAction("out")}>
                <Square className="w-4 h-4" /> Clock out
              </Button>
            </>
          )}
        </div>
        {captureError && (
          <p className="text-[11px] text-destructive mt-3">{captureError}</p>
        )}
        <p className="text-[11px] text-muted-foreground mt-3 max-w-md mx-auto">
          When you clock in, your browser will ask permission to share your screen. Snapshots
          (~50 KB each) are taken every 10s. A short clip is uploaded only if your admin
          requests one.
        </p>
      </Card>

      {pendingClipReq && pendingClipReq.length > 0 && capturing && (
        <Card className="p-3 border-warning bg-warning/5 flex items-center gap-3">
          <Video className="w-5 h-5 text-warning shrink-0" />
          <div className="flex-1 text-sm">
            <div className="font-medium">Your admin requested a clip</div>
            <div className="text-xs text-muted-foreground">
              {pendingClipReq[0].reason ?? "Reviewing recent activity"} — uploading shortly
            </div>
          </div>
          <Loader2 className="w-4 h-4 animate-spin text-warning" />
        </Card>
      )}

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Active" value={fmt(today?.active_seconds ?? seconds)} icon={Activity} accent="success" small />
        <StatCard label="Idle" value={fmt(today?.idle_seconds ?? 0)} icon={Clock} accent="warning" small />
        <StatCard label="Score" value={`${today?.productivity_score ?? "—"}`} icon={TrendingUp} small />
      </div>

      <Card className="p-4">
        <div className="text-sm font-semibold mb-2">My productivity breakdown</div>
        <ProductivityBreakdown userOnly={user?.id} />
      </Card>
    </div>
  );
}

// =================== TEAM TAB (admin) ===================
function TeamTab() {
  const { companyId, user } = useAuth();
  const { data: members } = useQuery({
    enabled: !!companyId,
    queryKey: ["team", companyId, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, job_title, phone")
        .eq("company_id", companyId!);
      // Exclude the current admin's own profile and any placeholder rows with no name and no email
      return (data ?? []).filter(
        (m) => m.id !== user?.id && (m.full_name?.trim() || m.email?.trim()),
      );
    },
  });
  const { data: invites } = useQuery({
    enabled: !!companyId,
    queryKey: ["invites", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("invite_codes")
        .select("code, intended_name, job_title, used_at, created_at")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <Tabs defaultValue="members" className="space-y-5">
      <TabsList className="w-full justify-start overflow-x-auto h-auto p-1">
        <TabsTrigger value="members"><Users className="w-3.5 h-3.5" /> Members</TabsTrigger>
        <TabsTrigger value="attendance"><Clock className="w-3.5 h-3.5" /> Attendance</TabsTrigger>
        <TabsTrigger value="clips"><Video className="w-3.5 h-3.5" /> Clips</TabsTrigger>
        <TabsTrigger value="invites"><KeyRound className="w-3.5 h-3.5" /> Invites</TabsTrigger>
      </TabsList>

      <TabsContent value="members" className="space-y-5">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Team members</h2>
            <Badge variant="secondary">{members?.length ?? 0}</Badge>
          </div>
          <div className="space-y-2">
            {members?.map((m) => (
              <TeamMemberRow key={m.id} member={m} companyId={companyId!} />
            ))}
            {(!members || members.length === 0) && (
              <p className="text-sm text-muted-foreground">No team members yet.</p>
            )}
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="attendance">
        <AttendanceManager />
      </TabsContent>

      <TabsContent value="clips">
        <ClipsPanel scope="admin" />
      </TabsContent>

      <TabsContent value="invites" className="space-y-5">

      <Card className="p-4">
        <h2 className="font-semibold mb-3">Invite codes</h2>
        <div className="space-y-2">
          {invites?.map((i) => (
            <div key={i.code} className="flex items-center justify-between p-2 rounded bg-muted text-sm">
              <div>
                <code className="font-mono font-bold">{i.code}</code>
                <span className="ml-2 text-muted-foreground">{i.intended_name ?? "—"}</span>
              </div>
              {i.used_at ? (
                <Badge variant="secondary">Used</Badge>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard.writeText(i.code);
                    toast.success("Copied");
                  }}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
          {(!invites || invites.length === 0) && (
            <p className="text-sm text-muted-foreground">
              Generate invite codes from the onboarding flow or here later.
            </p>
          )}
        </div>
      </Card>
      </TabsContent>
    </Tabs>
  );
}

// =================== SCREENSHOTS TAB ===================
type ScreenStatus = "all" | "pending" | "approved" | "rejected";

function ScreensTab({ role }: { role: AppRole }) {
  const { companyId, user } = useAuth();
  const qc = useQueryClient();
  const review = useServerFn(reviewScreenshot);
  const isAdmin = role !== "employee";

  const [filter, setFilter] = useState<ScreenStatus>(isAdmin ? "pending" : "all");
  const [reviewOpen, setReviewOpen] = useState<null | {
    id: string;
    decision: "approved" | "rejected";
    label: string;
  }>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const queryKey = isAdmin
    ? ["screens-co", companyId, filter]
    : ["screens-me", user?.id, filter];

  const { data: screens } = useQuery({
    enabled: !!(isAdmin ? companyId : user),
    queryKey,
    queryFn: async () => {
      let q = supabase
        .from("screenshots")
        .select(
          "id, captured_at, activity_label, app_name, status, image_url, user_id, review_note, reviewed_at",
        )
        .order("captured_at", { ascending: false })
        .limit(100);
      q = isAdmin ? q.eq("company_id", companyId!) : q.eq("user_id", user!.id);
      if (filter !== "all") q = q.eq("status", filter);
      const { data } = await q;
      return data ?? [];
    },
  });

  const { data: counts } = useQuery({
    enabled: !!(isAdmin ? companyId : user),
    queryKey: [...(isAdmin ? ["screen-counts-co", companyId] : ["screen-counts-me", user?.id])],
    queryFn: async () => {
      const base = () => {
        let b = supabase.from("screenshots").select("status", { count: "exact", head: true });
        return isAdmin ? b.eq("company_id", companyId!) : b.eq("user_id", user!.id);
      };
      const [p, a, r, all] = await Promise.all([
        base().eq("status", "pending"),
        base().eq("status", "approved"),
        base().eq("status", "rejected"),
        base(),
      ]);
      return {
        pending: p.count ?? 0,
        approved: a.count ?? 0,
        rejected: r.count ?? 0,
        all: all.count ?? 0,
      };
    },
  });

  async function submitReview() {
    if (!reviewOpen) return;
    setBusy(true);
    try {
      await review({
        data: { screenshotId: reviewOpen.id, decision: reviewOpen.decision, note: note || undefined },
      });
      toast.success(`Marked ${reviewOpen.decision}`);
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({
        queryKey: isAdmin ? ["screen-counts-co", companyId] : ["screen-counts-me", user?.id],
      });
      setReviewOpen(null);
      setNote("");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function openReview(id: string, decision: "approved" | "rejected", label: string) {
    setReviewOpen({ id, decision, label });
    setNote("");
  }

  const filters: { id: ScreenStatus; label: string; count: number }[] = [
    { id: "pending", label: "Pending", count: counts?.pending ?? 0 },
    { id: "approved", label: "Approved", count: counts?.approved ?? 0 },
    { id: "rejected", label: "Rejected", count: counts?.rejected ?? 0 },
    { id: "all", label: "All", count: counts?.all ?? 0 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-semibold text-lg">
            {isAdmin ? "Screenshot review queue" : "My screenshots"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {isAdmin
              ? "Approve or reject captured screenshots. All decisions are recorded in audit logs."
              : "Status updates from your reviewer appear here."}
          </p>
        </div>
        {isAdmin && (counts?.pending ?? 0) > 0 && (
          <Badge variant="secondary" className="text-xs">
            <Filter className="w-3 h-3" /> {counts?.pending} awaiting review
          </Badge>
        )}
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors ${
              filter === f.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card hover:bg-muted border-border text-muted-foreground"
            }`}
          >
            {f.label}
            <span className="ml-1.5 opacity-70">{f.count}</span>
          </button>
        ))}
      </div>

      {(!screens || screens.length === 0) && (
        <Card className="p-10 text-center">
          <CameraIcon className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No screenshots in this view.</p>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {screens?.map((s) => (
          <Card key={s.id} className="p-3 flex flex-col">
            <div className="aspect-video rounded bg-muted flex items-center justify-center mb-2 overflow-hidden">
              {s.image_url ? (
                <img src={s.image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs font-medium truncate">
                {s.app_name ?? s.activity_label ?? "Activity"}
              </div>
              <Badge
                variant={
                  s.status === "approved"
                    ? "default"
                    : s.status === "rejected"
                      ? "destructive"
                      : "secondary"
                }
                className="text-[10px]"
              >
                {s.status}
              </Badge>
            </div>
            <div className="text-[10px] text-muted-foreground mb-2">
              {new Date(s.captured_at).toLocaleString()}
            </div>
            {s.review_note && (
              <div className="text-[11px] p-2 rounded bg-muted/60 mb-2 line-clamp-2">
                <span className="font-semibold">Note:</span> {s.review_note}
              </div>
            )}
            {isAdmin && s.status === "pending" && (
              <div className="flex gap-1 mt-auto">
                <Button
                  size="sm"
                  variant="default"
                  className="flex-1 h-8 text-xs"
                  onClick={() =>
                    openReview(s.id, "approved", s.app_name ?? s.activity_label ?? "Screenshot")
                  }
                >
                  <CheckCircle2 className="w-3 h-3" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1 h-8 text-xs"
                  onClick={() =>
                    openReview(s.id, "rejected", s.app_name ?? s.activity_label ?? "Screenshot")
                  }
                >
                  <XCircle className="w-3 h-3" /> Reject
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      <Dialog open={!!reviewOpen} onOpenChange={(o) => !o && setReviewOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {reviewOpen?.decision === "approved" ? (
                <CheckCircle2 className="w-5 h-5 text-success" />
              ) : (
                <XCircle className="w-5 h-5 text-destructive" />
              )}
              {reviewOpen?.decision === "approved" ? "Approve" : "Reject"} screenshot
            </DialogTitle>
            <DialogDescription>
              Add an optional note for the employee. This decision is recorded in the audit log.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">{reviewOpen?.label}</div>
            <Textarea
              placeholder={
                reviewOpen?.decision === "approved"
                  ? "Great focus — keep it up."
                  : "e.g. Off-topic activity, please re-check task assignment."
              }
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReviewOpen(null)}>
              Cancel
            </Button>
            <Button
              variant={reviewOpen?.decision === "rejected" ? "destructive" : "default"}
              onClick={submitReview}
              disabled={busy}
            >
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : reviewOpen?.decision === "approved" ? (
                "Approve"
              ) : (
                "Reject"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =================== PROJECTS ===================
function ProjectsTab({ role }: { role: AppRole }) {
  const { companyId } = useAuth();
  const qc = useQueryClient();
  const { data: projects } = useQuery({
    enabled: !!companyId,
    queryKey: ["projects", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const [name, setName] = useState("");
  const canManage = role !== "employee";

  async function addProject() {
    if (!name.trim() || !companyId) return;
    const { error } = await supabase
      .from("projects")
      .insert({ name: name.trim(), company_id: companyId, status: "active" });
    if (error) toast.error(error.message);
    else {
      setName("");
      qc.invalidateQueries({ queryKey: ["projects", companyId] });
      toast.success("Project added");
    }
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <Card className="p-4">
          <div className="flex gap-2">
            <input
              className="flex-1 h-9 rounded-md border bg-transparent px-3 text-sm"
              placeholder="New project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button onClick={addProject}>Add</Button>
          </div>
        </Card>
      )}
      {projects?.map((p) => (
        <Card key={p.id} className="p-4 flex items-center justify-between">
          <div>
            <div className="font-semibold">{p.name}</div>
            <div className="text-xs text-muted-foreground">{p.description ?? "—"}</div>
          </div>
          <Badge variant={p.status === "active" ? "default" : "secondary"}>{p.status}</Badge>
        </Card>
      ))}
      {(!projects || projects.length === 0) && (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No projects yet.
        </Card>
      )}
    </div>
  );
}

// =================== REPORTS ===================
function ReportsTab() {
  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList className="w-full justify-start overflow-x-auto h-auto p-1">
        <TabsTrigger value="overview" className="gap-1.5">
          <BarChart3 className="w-3.5 h-3.5" /> Overview
        </TabsTrigger>
        <TabsTrigger value="drilldown" className="gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" /> Drill-down
        </TabsTrigger>
        <TabsTrigger value="audit" className="gap-1.5">
          <History className="w-3.5 h-3.5" /> Audit log
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <OverviewReport />
      </TabsContent>
      <TabsContent value="drilldown">
        <DrilldownReport />
      </TabsContent>
      <TabsContent value="audit">
        <AuditLogView />
      </TabsContent>
    </Tabs>
  );
}

function OverviewReport() {
  const { companyId } = useAuth();
  const { data } = useQuery({
    enabled: !!companyId,
    queryKey: ["report-att", companyId],
    queryFn: async () => {
      const since = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
      const { data } = await supabase
        .from("attendance")
        .select("work_date, active_seconds, idle_seconds, productivity_score")
        .eq("company_id", companyId!)
        .gte("work_date", since);
      return data ?? [];
    },
  });

  const chart = useMemo(() => {
    const map = new Map<
      string,
      { date: string; active: number; idle: number; score: number; n: number }
    >();
    (data ?? []).forEach((row) => {
      const m =
        map.get(row.work_date) ?? { date: row.work_date, active: 0, idle: 0, score: 0, n: 0 };
      m.active += (row.active_seconds ?? 0) / 3600;
      m.idle += (row.idle_seconds ?? 0) / 3600;
      m.score += Number(row.productivity_score ?? 0);
      m.n += 1;
      map.set(row.work_date, m);
    });
    return Array.from(map.values())
      .map((m) => ({ ...m, score: Math.round(m.score / Math.max(m.n, 1)) }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h2 className="font-semibold mb-3">Hours worked (last 7 days)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="active" stackId="a" fill="var(--color-primary)" name="Active hrs" />
              <Bar dataKey="idle" stackId="a" fill="var(--color-warning)" name="Idle hrs" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card className="p-4">
        <h2 className="font-semibold mb-3">Average productivity score</h2>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="score" fill="var(--color-success)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

// ---------- DRILL-DOWN ----------
function DrilldownReport() {
  const { companyId } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
  const [employeeId, setEmployeeId] = useState<string>("");
  const [from, setFrom] = useState(weekAgo);
  const [to, setTo] = useState(today);

  const { data: members } = useQuery({
    enabled: !!companyId,
    queryKey: ["team-drill", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, job_title")
        .eq("company_id", companyId!);
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!employeeId && members && members.length > 0) setEmployeeId(members[0].id);
  }, [members, employeeId]);

  const { data: entries } = useQuery({
    enabled: !!(employeeId && companyId),
    queryKey: ["drilldown", employeeId, from, to],
    queryFn: async () => {
      const { data } = await supabase
        .from("productivity_entries")
        .select("entry_date, active_minutes, idle_minutes, break_minutes, tasks_completed, tasks_total")
        .eq("user_id", employeeId)
        .gte("entry_date", from)
        .lte("entry_date", to)
        .order("entry_date", { ascending: true });
      return data ?? [];
    },
  });

  const summary = useMemo(() => {
    const t = (entries ?? []).reduce(
      (a, r) => {
        a.active += r.active_minutes;
        a.idle += r.idle_minutes;
        a.break += r.break_minutes;
        a.done += r.tasks_completed;
        a.total += r.tasks_total;
        return a;
      },
      { active: 0, idle: 0, break: 0, done: 0, total: 0 },
    );
    const totalLogged = t.active + t.idle + t.break;
    const activePct = totalLogged ? Math.round((t.active / totalLogged) * 100) : 0;
    const idlePct = totalLogged ? Math.round((t.idle / totalLogged) * 100) : 0;
    // expectation: ~45m breaks per workday
    const expectedBreak = (entries?.length ?? 0) * 45;
    const breakAdherence =
      expectedBreak === 0
        ? 100
        : Math.max(0, 100 - Math.round((Math.abs(t.break - expectedBreak) / expectedBreak) * 100));
    const taskProgress = t.total ? Math.round((t.done / t.total) * 100) : 0;
    const score = Math.round(
      activePct * 0.45 + breakAdherence * 0.2 + taskProgress * 0.25 + (100 - idlePct) * 0.1,
    );
    return { ...t, activePct, idlePct, breakAdherence, taskProgress, score };
  }, [entries]);

  const dailyChart = (entries ?? []).map((r) => ({
    date: r.entry_date,
    active: Math.round(r.active_minutes / 60),
    idle: Math.round(r.idle_minutes / 60),
    break: Math.round(r.break_minutes / 60),
  }));

  const selectedMember = members?.find((m) => m.id === employeeId);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Employee</label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full h-9 rounded-md border bg-transparent px-3 text-sm"
            >
              {members?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name ?? m.email}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">From</label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">To</label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
      </Card>

      {selectedMember && (
        <Card className="p-5 bg-gradient-to-br from-primary/5 to-accent/20">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="text-xs uppercase text-muted-foreground font-semibold">
                Productivity score
              </div>
              <div className="text-5xl font-bold text-primary mt-1">{summary.score}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {selectedMember.full_name ?? selectedMember.email} · {from} → {to}
              </div>
            </div>
            <div className="text-xs text-muted-foreground max-w-xs">
              <div className="font-semibold mb-1">How it's calculated</div>
              Active time 45% · Break adherence 20% · Task progress 25% · Low-idle bonus 10%
            </div>
          </div>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <DrillStat label="Active time" value={`${Math.round(summary.active / 60)}h`} pct={summary.activePct} accent="primary" sub={`${summary.activePct}% of logged`} />
        <DrillStat label="Idle time" value={`${Math.round(summary.idle / 60)}h`} pct={summary.idlePct} accent="warning" sub={`${summary.idlePct}% of logged`} />
        <DrillStat label="Break adherence" value={`${summary.breakAdherence}%`} pct={summary.breakAdherence} accent="success" sub={`${Math.round(summary.break)}m taken`} />
        <DrillStat label="Task progress" value={`${summary.done}/${summary.total}`} pct={summary.taskProgress} accent="primary" sub={`${summary.taskProgress}% complete`} />
      </div>

      <Card className="p-4">
        <h3 className="font-semibold mb-3 text-sm">Daily breakdown (hours)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyChart}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="active" stackId="a" fill="var(--color-primary)" name="Active" />
              <Bar dataKey="idle" stackId="a" fill="var(--color-warning)" name="Idle" />
              <Bar dataKey="break" stackId="a" fill="var(--color-muted-foreground)" name="Break" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {dailyChart.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            No productivity entries in this range.
          </p>
        )}
      </Card>
    </div>
  );
}

function DrillStat({
  label,
  value,
  pct,
  accent,
  sub,
}: {
  label: string;
  value: string;
  pct: number;
  accent: "primary" | "warning" | "success";
  sub: string;
}) {
  const color =
    accent === "success" ? "bg-success" : accent === "warning" ? "bg-warning" : "bg-primary";
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
        <div className={`h-full ${color}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>
    </Card>
  );
}

// ---------- AUDIT LOG ----------
const AUDIT_CATEGORIES: ReadonlyArray<{
  id: string;
  label: string;
  match?: readonly string[];
}> = [
  { id: "all", label: "All events" },
  { id: "screenshot", label: "Screenshots", match: ["screenshot."] },
  { id: "onboarding", label: "Onboarding & invites", match: ["company.", "staff.", "invite"] },
  { id: "productivity", label: "Productivity", match: ["productivity.", "attendance."] },
];

function AuditLogView() {
  const { companyId } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
  const [category, setCategory] = useState<string>("all");
  const [employeeId, setEmployeeId] = useState<string>("all");
  const [from, setFrom] = useState(weekAgo);
  const [to, setTo] = useState(today);

  const { data: members } = useQuery({
    enabled: !!companyId,
    queryKey: ["team-audit", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("company_id", companyId!);
      return data ?? [];
    },
  });

  const { data: logs } = useQuery({
    enabled: !!companyId,
    queryKey: ["audit", companyId, category, employeeId, from, to],
    queryFn: async () => {
      let q = supabase
        .from("audit_logs")
        .select("id, created_at, actor_id, target_user_id, action, entity_type, entity_id, metadata")
        .eq("company_id", companyId!)
        .gte("created_at", `${from}T00:00:00`)
        .lte("created_at", `${to}T23:59:59`)
        .order("created_at", { ascending: false })
        .limit(300);
      if (employeeId !== "all") {
        q = q.or(`actor_id.eq.${employeeId},target_user_id.eq.${employeeId}`);
      }
      const { data } = await q;
      const all = data ?? [];
      if (category === "all") return all;
      const matches = AUDIT_CATEGORIES.find((c) => c.id === category)?.match ?? [];
      return all.filter((r) => matches.some((m) => r.action?.startsWith(m)));
    },
  });

  const memberLookup = useMemo(() => {
    const m = new Map<string, string>();
    (members ?? []).forEach((x) => m.set(x.id, x.full_name ?? x.email ?? "Unknown"));
    return m;
  }, [members]);

  const groupedByDate = useMemo(() => {
    const m = new Map<string, typeof logs>();
    (logs ?? []).forEach((row) => {
      const d = (row.created_at as string).slice(0, 10);
      if (!m.has(d)) m.set(d, [] as never);
      (m.get(d) as never[]).push(row as never);
    });
    return Array.from(m.entries());
  }, [logs]);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid sm:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as typeof category)}
              className="w-full h-9 rounded-md border bg-transparent px-3 text-sm"
            >
              {AUDIT_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Employee</label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full h-9 rounded-md border bg-transparent px-3 text-sm"
            >
              <option value="all">All employees</option>
              {members?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name ?? m.email}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">From</label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">To</label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
      </Card>

      {(!logs || logs.length === 0) && (
        <Card className="p-10 text-center">
          <FileText className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No audit events for this filter.</p>
        </Card>
      )}

      <div className="space-y-5">
        {groupedByDate.map(([date, rows]) => (
          <div key={date}>
            <div className="text-xs font-semibold uppercase text-muted-foreground mb-2 sticky top-16 bg-background/95 backdrop-blur py-1">
              {new Date(date).toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </div>
            <Card className="divide-y">
              {(rows ?? []).map((row) => (
                <AuditRow
                  key={row.id}
                  row={row}
                  actor={row.actor_id ? memberLookup.get(row.actor_id) : null}
                  target={row.target_user_id ? memberLookup.get(row.target_user_id) : null}
                />
              ))}
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

type AuditRowData = {
  id: string;
  created_at: string;
  actor_id: string | null;
  target_user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: unknown;
};

function AuditRow({
  row,
  actor,
  target,
}: {
  row: AuditRowData;
  actor?: string | null;
  target?: string | null;
}) {
  const meta = describeAction(row.action);
  const Icon = meta.icon;
  return (
    <div className="flex items-start gap-3 p-3">
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.bg} ${meta.fg}`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm">
          <span className="font-medium">{actor ?? "System"}</span>{" "}
          <span className="text-muted-foreground">{meta.verb}</span>
          {target && target !== actor && (
            <>
              {" "}
              <span className="text-muted-foreground">·</span>{" "}
              <span className="font-medium">{target}</span>
            </>
          )}
        </div>
        {(() => {
          const md = row.metadata as Record<string, unknown> | null;
          if (!md || typeof md !== "object" || Object.keys(md).length === 0) return null;
          return (
            <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {Object.entries(md)
                .filter(([, v]) => v != null && v !== "")
                .map(([k, v]) => `${k}: ${String(v)}`)
                .join(" · ")}
            </div>
          );
        })()}
      </div>
      <div className="text-[11px] text-muted-foreground shrink-0">
        {new Date(row.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}

function describeAction(action: string) {
  if (action.startsWith("screenshot.approved"))
    return {
      icon: CheckCircle2,
      verb: "approved a screenshot",
      bg: "bg-success/15",
      fg: "text-success",
    };
  if (action.startsWith("screenshot.rejected"))
    return {
      icon: XCircle,
      verb: "rejected a screenshot",
      bg: "bg-destructive/15",
      fg: "text-destructive",
    };
  if (action === "company.created")
    return { icon: Briefcase, verb: "created the company", bg: "bg-primary/15", fg: "text-primary" };
  if (action === "staff.joined_via_invite")
    return {
      icon: UserCheck,
      verb: "joined via invite code",
      bg: "bg-primary/15",
      fg: "text-primary",
    };
  if (action.startsWith("invite"))
    return { icon: KeyRound, verb: action.replace(/_/g, " "), bg: "bg-accent", fg: "text-foreground" };
  if (action.startsWith("productivity"))
    return { icon: TrendingUp, verb: action.replace(/_/g, " "), bg: "bg-primary/10", fg: "text-primary" };
  if (action.startsWith("attendance"))
    return { icon: Clock, verb: action.replace(/_/g, " "), bg: "bg-primary/10", fg: "text-primary" };
  return { icon: History, verb: action.replace(/_/g, " "), bg: "bg-muted", fg: "text-foreground" };
}

// =================== SHARED ===================

// =================== SHARED ===================
function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  small,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent?: "success" | "warning";
  small?: boolean;
}) {
  const color =
    accent === "success" ? "text-success" : accent === "warning" ? "text-warning" : "text-primary";
  return (
    <Card className="p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className={`font-bold ${small ? "text-base font-mono" : "text-2xl"}`}>{value}</div>
    </Card>
  );
}

function ProductivityBreakdown({
  companyId,
  userOnly,
}: {
  companyId?: string | null;
  userOnly?: string;
}) {
  const { data } = useQuery({
    enabled: !!(companyId || userOnly),
    queryKey: ["prod-breakdown", companyId ?? "u", userOnly ?? "c"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      let q = supabase
        .from("productivity_entries")
        .select("active_minutes, idle_minutes, break_minutes, tasks_completed, tasks_total")
        .eq("entry_date", today);
      if (userOnly) q = q.eq("user_id", userOnly);
      else if (companyId) q = q.eq("company_id", companyId);
      const { data } = await q;
      return data ?? [];
    },
  });

  const totals = (data ?? []).reduce(
    (acc, r) => {
      acc.active += r.active_minutes;
      acc.idle += r.idle_minutes;
      acc.break += r.break_minutes;
      acc.done += r.tasks_completed;
      acc.total += r.tasks_total;
      return acc;
    },
    { active: 0, idle: 0, break: 0, done: 0, total: 0 },
  );

  const breakAdherence = totals.break > 0 ? Math.min(100, Math.round((45 / Math.max(totals.break, 1)) * 100)) : 100;
  const taskProgress = totals.total > 0 ? Math.round((totals.done / totals.total) * 100) : 0;

  const pieData = [
    { name: "Active", value: totals.active, color: "var(--color-primary)" },
    { name: "Idle", value: totals.idle, color: "var(--color-warning)" },
    { name: "Break", value: totals.break, color: "var(--color-muted-foreground)" },
  ];

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pieData} dataKey="value" innerRadius={40} outerRadius={70} paddingAngle={2}>
              {pieData.map((p) => (
                <Cell key={p.name} fill={p.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-3 text-sm">
        <Metric label="Active time" value={`${totals.active}m`} color="bg-primary" pct={Math.min(100, (totals.active / Math.max(totals.active + totals.idle + totals.break, 1)) * 100)} />
        <Metric label="Idle time" value={`${totals.idle}m`} color="bg-warning" pct={Math.min(100, (totals.idle / Math.max(totals.active + totals.idle + totals.break, 1)) * 100)} />
        <Metric label="Break adherence" value={`${breakAdherence}%`} color="bg-success" pct={breakAdherence} />
        <Metric label="Task progress" value={`${totals.done}/${totals.total}`} color="bg-primary" pct={taskProgress} />
      </div>
    </div>
  );
}

function Metric({ label, value, pct, color }: { label: string; value: string; pct: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// =================== ALERTS BELL (admin header) ===================
function AlertsBell({ companyId }: { companyId: string }) {
  const qc = useQueryClient();
  const resolveFn = useServerFn(resolveAlert);
  const { data: alerts } = useQuery({
    queryKey: ["alerts", companyId],
    refetchInterval: 10000,
    queryFn: async () => {
      const { data } = await supabase
        .from("activity_alerts")
        .select("id, employee_id, alert_type, severity, message, created_at, resolved")
        .eq("company_id", companyId)
        .eq("resolved", false)
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });
  const { data: profiles } = useQuery({
    queryKey: ["alerts-profiles", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("company_id", companyId);
      return data ?? [];
    },
  });
  const nameMap = useMemo(() => {
    const m = new Map<string, string>();
    (profiles ?? []).forEach((p) => m.set(p.id, p.full_name ?? p.email ?? "—"));
    return m;
  }, [profiles]);
  const count = alerts?.length ?? 0;
  const critical = (alerts ?? []).some((a) => a.severity === "critical");

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="icon" variant="ghost" className="relative">
          <Bell className={`w-4 h-4 ${critical ? "text-destructive" : ""}`} />
          {count > 0 && (
            <span
              className={`absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white ${critical ? "bg-destructive" : "bg-warning"}`}
            >
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bell className="w-4 h-4" /> Live alerts
          </SheetTitle>
          <SheetDescription>
            Real-time warnings from employee devices. Tap "Resolve" once handled.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-2">
          {(!alerts || alerts.length === 0) && (
            <div className="text-center py-12">
              <CheckCircle2 className="w-8 h-8 text-success/60 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">All clear — no active alerts.</p>
            </div>
          )}
          {alerts?.map((a) => {
            const meta = alertMeta(a.alert_type);
            const Icon = meta.icon;
            return (
              <Card key={a.id} className="p-3 flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.bg} ${meta.fg}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{nameMap.get(a.employee_id) ?? "Employee"}</div>
                  <div className="text-xs text-muted-foreground">{a.message ?? meta.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(a.created_at).toLocaleString()}
                  </div>
                  <div className="flex gap-1 mt-2">
                    <Badge variant={a.severity === "critical" ? "destructive" : "secondary"} className="text-[10px]">
                      {a.severity}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[11px] ml-auto"
                      onClick={async () => {
                        await resolveFn({ data: { alertId: a.id, companyId } });
                        qc.invalidateQueries({ queryKey: ["alerts", companyId] });
                      }}
                    >
                      Resolve
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function alertMeta(type: string) {
  if (type === "capture_stopped")
    return { icon: MonitorPlay, bg: "bg-destructive/15", fg: "text-destructive", label: "Screen sharing stopped" };
  if (type === "offline")
    return { icon: WifiOff, bg: "bg-destructive/15", fg: "text-destructive", label: "Device offline" };
  if (type === "tab_hidden")
    return { icon: AlertTriangle, bg: "bg-warning/15", fg: "text-warning", label: "Tab hidden" };
  if (type === "idle")
    return { icon: Clock, bg: "bg-warning/15", fg: "text-warning", label: "Idle" };
  return { icon: AlertTriangle, bg: "bg-muted", fg: "text-foreground", label: "Alert" };
}

// =================== TEAM MEMBER ROW (admin) ===================
function TeamMemberRow({
  member,
  companyId,
}: {
  member: { id: string; full_name: string | null; email: string | null; job_title: string | null };
  companyId: string;
}) {
  const [compOpen, setCompOpen] = useState(false);
  const [clipOpen, setClipOpen] = useState(false);
  const reqClipFn = useServerFn(requestClip);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendClipRequest() {
    setBusy(true);
    try {
      await reqClipFn({
        data: { companyId, employeeId: member.id, reason: reason || undefined, durationSeconds: 300 },
      });
      toast.success("Clip request sent — employee's browser will upload shortly");
      setClipOpen(false);
      setReason("");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-between p-2 rounded hover:bg-muted gap-2">
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{member.full_name ?? "Unnamed"}</div>
        <div className="text-xs text-muted-foreground truncate">
          {member.job_title ?? "—"} · {member.email}
        </div>
      </div>
      <Button size="sm" variant="ghost" onClick={() => setClipOpen(true)} title="Request clip">
        <Video className="w-4 h-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setCompOpen(true)} title="Edit salary & hours">
        <Settings className="w-4 h-4" />
      </Button>

      <Dialog open={clipOpen} onOpenChange={setClipOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request screen clip</DialogTitle>
            <DialogDescription>
              {member.full_name ?? member.email}'s browser will upload the last 5 minutes of
              recorded screen activity. The employee must be currently clocked in and recording.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason (optional) — e.g. 'Need to verify task X progress'"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setClipOpen(false)}>Cancel</Button>
            <Button onClick={sendClipRequest} disabled={busy}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CompensationDialog
        open={compOpen}
        onOpenChange={setCompOpen}
        member={member}
        companyId={companyId}
      />
    </div>
  );
}

// =================== COMPENSATION DIALOG ===================
function CompensationDialog({
  open,
  onOpenChange,
  member,
  companyId,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  member: { id: string; full_name: string | null; email: string | null };
  companyId: string;
}) {
  const qc = useQueryClient();
  const updateFn = useServerFn(updateEmployeeCompensation);
  const { data: current } = useQuery({
    enabled: open,
    queryKey: ["comp", member.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("monthly_salary, expected_monthly_hours, currency, hourly_overtime_rate")
        .eq("id", member.id)
        .maybeSingle();
      return data;
    },
  });
  const [salary, setSalary] = useState("0");
  const [hours, setHours] = useState("160");
  const [currency, setCurrency] = useState("USD");
  const [otRate, setOtRate] = useState("0");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (current) {
      setSalary(String(current.monthly_salary ?? 0));
      setHours(String(current.expected_monthly_hours ?? 160));
      setCurrency(current.currency ?? "USD");
      setOtRate(String(current.hourly_overtime_rate ?? 0));
    }
  }, [current]);

  async function save() {
    setBusy(true);
    try {
      await updateFn({
        data: {
          employeeId: member.id,
          companyId,
          monthlySalary: Number(salary) || 0,
          expectedMonthlyHours: Number(hours) || 160,
          currency,
          hourlyOvertimeRate: Number(otRate) || 0,
        },
      });
      toast.success("Compensation updated");
      qc.invalidateQueries({ queryKey: ["comp", member.id] });
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Compensation · {member.full_name ?? member.email}</DialogTitle>
          <DialogDescription>
            Salary is prorated by worked hours vs expected hours each month. Overtime hours past
            the expected count are paid at the overtime rate.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Monthly salary</Label>
            <Input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Expected hours / month</Label>
            <Input type="number" value={hours} onChange={(e) => setHours(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Currency</Label>
            <Input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} maxLength={3} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Overtime rate / hour</Label>
            <Input type="number" value={otRate} onChange={(e) => setOtRate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={busy}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =================== ATTENDANCE MANAGER (admin) ===================
function AttendanceManager() {
  const { companyId } = useAuth();
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 13 * 86400000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(weekAgo);
  const [to, setTo] = useState(today);
  const [employeeId, setEmployeeId] = useState<string>("all");
  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: members } = useQuery({
    enabled: !!companyId,
    queryKey: ["att-members", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("company_id", companyId!);
      return data ?? [];
    },
  });

  const { data: rows } = useQuery({
    enabled: !!companyId,
    queryKey: ["att-list", companyId, from, to, employeeId],
    queryFn: async () => {
      let q = supabase
        .from("attendance")
        .select("id, user_id, work_date, clock_in, clock_out, active_seconds, idle_seconds, break_seconds, status, is_manual, edited_by, edit_reason, edited_at")
        .eq("company_id", companyId!)
        .gte("work_date", from)
        .lte("work_date", to)
        .order("work_date", { ascending: false })
        .limit(300);
      if (employeeId !== "all") q = q.eq("user_id", employeeId);
      const { data } = await q;
      return data ?? [];
    },
  });

  const nameMap = useMemo(() => {
    const m = new Map<string, string>();
    (members ?? []).forEach((p) => m.set(p.id, p.full_name ?? p.email ?? "—"));
    return m;
  }, [members]);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid sm:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Employee</Label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full h-9 rounded-md border bg-transparent px-3 text-sm"
            >
              <option value="all">All employees</option>
              {members?.map((m) => (
                <option key={m.id} value={m.id}>{m.full_name ?? m.email}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={() => setCreating(true)}>
              <Edit3 className="w-4 h-4" /> Manual entry
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs">
              <tr>
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Employee</th>
                <th className="text-left p-2">In</th>
                <th className="text-left p-2">Out</th>
                <th className="text-left p-2">Worked</th>
                <th className="text-left p-2">Status</th>
                <th className="text-right p-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows?.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{r.work_date}</td>
                  <td className="p-2 truncate max-w-[160px]">{nameMap.get(r.user_id)}</td>
                  <td className="p-2 text-xs font-mono">{r.clock_in ? new Date(r.clock_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                  <td className="p-2 text-xs font-mono">{r.clock_out ? new Date(r.clock_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                  <td className="p-2 font-mono text-xs">{((r.active_seconds ?? 0) / 3600).toFixed(2)}h</td>
                  <td className="p-2">
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className="text-[10px]">{r.status}</Badge>
                      {r.is_manual && (
                        <Badge variant="outline" className="text-[10px]">
                          <Edit3 className="w-2.5 h-2.5" /> manual
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-2 text-right">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(r)}>
                      <Edit3 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
              {(!rows || rows.length === 0) && (
                <tr>
                  <td colSpan={7} className="text-center text-muted-foreground p-8 text-sm">
                    No attendance entries in this range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <AttendanceEditDialog
        open={!!editing || creating}
        editing={editing}
        members={members ?? []}
        companyId={companyId!}
        onClose={() => {
          setEditing(null);
          setCreating(false);
          qc.invalidateQueries({ queryKey: ["att-list", companyId] });
        }}
      />
    </div>
  );
}

function AttendanceEditDialog({
  open,
  editing,
  members,
  companyId,
  onClose,
}: {
  open: boolean;
  editing: any | null;
  members: { id: string; full_name: string | null; email: string | null }[];
  companyId: string;
  onClose: () => void;
}) {
  const upsertFn = useServerFn(upsertAttendanceManual);
  const [empId, setEmpId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [clockIn, setClockIn] = useState("");
  const [clockOut, setClockOut] = useState("");
  const [activeMin, setActiveMin] = useState("0");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (editing) {
      setEmpId(editing.user_id);
      setDate(editing.work_date);
      setClockIn(editing.clock_in ? toLocalDT(editing.clock_in) : "");
      setClockOut(editing.clock_out ? toLocalDT(editing.clock_out) : "");
      setActiveMin(String(Math.round((editing.active_seconds ?? 0) / 60)));
      setReason("");
    } else {
      setEmpId(members[0]?.id ?? "");
      setDate(new Date().toISOString().slice(0, 10));
      setClockIn("");
      setClockOut("");
      setActiveMin("0");
      setReason("");
    }
  }, [editing, open]);

  async function save() {
    if (!empId || !reason.trim()) {
      toast.error("Employee and reason are required");
      return;
    }
    setBusy(true);
    try {
      await upsertFn({
        data: {
          employeeId: empId,
          companyId,
          workDate: date,
          clockIn: clockIn ? new Date(clockIn).toISOString() : null,
          clockOut: clockOut ? new Date(clockOut).toISOString() : null,
          activeSeconds: Math.round(Number(activeMin) * 60),
          reason: reason.trim(),
          status: clockOut ? "clocked_out" : "present",
        },
      });
      toast.success(editing ? "Entry updated" : "Manual entry created");
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit attendance" : "Manual attendance entry"}</DialogTitle>
          <DialogDescription>
            All edits are recorded in the audit log with the reason you provide.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs">Employee</Label>
            <select
              value={empId}
              disabled={!!editing}
              onChange={(e) => setEmpId(e.target.value)}
              className="w-full h-9 rounded-md border bg-transparent px-3 text-sm"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.full_name ?? m.email}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Date</Label>
            <Input type="date" value={date} disabled={!!editing} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Active minutes</Label>
            <Input type="number" value={activeMin} onChange={(e) => setActiveMin(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Clock in</Label>
            <Input type="datetime-local" value={clockIn} onChange={(e) => setClockIn(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Clock out</Label>
            <Input type="datetime-local" value={clockOut} onChange={(e) => setClockOut(e.target.value)} />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs">Reason (required)</Label>
            <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Forgot to clock out; correcting based on Slack handover at 6 PM" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={busy}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function toLocalDT(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// =================== CLIPS PANEL ===================
function ClipsPanel({ scope }: { scope: "admin" | "employee" }) {
  const { companyId, user } = useAuth();
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  const { data: clips } = useQuery({
    enabled: !!(scope === "admin" ? companyId : user),
    queryKey: ["clips", scope, companyId, user?.id],
    queryFn: async () => {
      let q = supabase
        .from("recording_clips")
        .select("id, employee_id, storage_path, duration_seconds, size_bytes, captured_at, notes")
        .order("captured_at", { ascending: false })
        .limit(50);
      q = scope === "admin" ? q.eq("company_id", companyId!) : q.eq("employee_id", user!.id);
      const { data } = await q;
      return data ?? [];
    },
  });

  const { data: members } = useQuery({
    enabled: scope === "admin" && !!companyId,
    queryKey: ["clip-members", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("company_id", companyId!);
      return data ?? [];
    },
  });

  useEffect(() => {
    (async () => {
      if (!clips) return;
      const next: Record<string, string> = { ...signedUrls };
      let updated = false;
      for (const c of clips) {
        if (next[c.id]) continue;
        const { data } = await supabase.storage
          .from("recordings")
          .createSignedUrl(c.storage_path, 3600);
        if (data?.signedUrl) {
          next[c.id] = data.signedUrl;
          updated = true;
        }
      }
      if (updated) setSignedUrls(next);
    })();
  }, [clips]);

  const nameMap = useMemo(() => {
    const m = new Map<string, string>();
    (members ?? []).forEach((p) => m.set(p.id, p.full_name ?? p.email ?? "—"));
    return m;
  }, [members]);

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground">
        {scope === "admin"
          ? "Short on-demand recordings requested from employees. Stored at ~150 kbps (1 MB per minute)."
          : "Clips you've sent to your admin after their requests."}
      </div>
      {(!clips || clips.length === 0) && (
        <Card className="p-10 text-center">
          <Video className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No clips yet.</p>
        </Card>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {clips?.map((c) => (
          <Card key={c.id} className="p-3 flex flex-col">
            <div className="aspect-video rounded bg-black flex items-center justify-center mb-2 overflow-hidden">
              {signedUrls[c.id] ? (
                <video src={signedUrls[c.id]} controls className="w-full h-full" preload="metadata" />
              ) : (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              )}
            </div>
            {scope === "admin" && (
              <div className="text-xs font-medium truncate">{nameMap.get(c.employee_id) ?? "Employee"}</div>
            )}
            <div className="text-[10px] text-muted-foreground flex items-center justify-between">
              <span>{new Date(c.captured_at).toLocaleString()}</span>
              <span>{(c.size_bytes / 1024 / 1024).toFixed(2)} MB · {c.duration_seconds}s</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// =================== PAYROLL TAB ===================
function PayrollTab({ role }: { role: AppRole }) {
  if (role === "employee") return <EmployeePayroll />;
  return <AdminPayroll />;
}

function AdminPayroll() {
  const { companyId } = useAuth();
  const qc = useQueryClient();
  const calcFn = useServerFn(calculateSalary);
  const overrideFn = useServerFn(overrideSalary);
  const finalizeFn = useServerFn(finalizeSalary);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [busy, setBusy] = useState(false);
  const [overrideRow, setOverrideRow] = useState<any | null>(null);
  const [overrideVal, setOverrideVal] = useState("");
  const [overrideReason, setOverrideReason] = useState("");

  const { data: rows } = useQuery({
    enabled: !!companyId,
    queryKey: ["salaries", companyId, year, month],
    queryFn: async () => {
      const { data } = await supabase
        .from("salary_records")
        .select("*, profiles!salary_records_employee_id_fkey(full_name, email)")
        .eq("company_id", companyId!)
        .eq("period_year", year)
        .eq("period_month", month);
      return data ?? [];
    },
  });

  async function runCalc() {
    setBusy(true);
    try {
      const res = await calcFn({ data: { companyId: companyId!, year, month } });
      toast.success(`Calculated for ${res.count} employees`);
      qc.invalidateQueries({ queryKey: ["salaries", companyId, year, month] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const totalPayroll = (rows ?? []).reduce(
    (s, r) => s + Number(r.override_amount ?? r.total_amount ?? 0),
    0,
  );
  const currency = rows?.[0]?.currency ?? "USD";

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid sm:grid-cols-4 gap-3 items-end">
          <div className="space-y-1.5">
            <Label className="text-xs">Year</Label>
            <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Month</Label>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="w-full h-9 rounded-md border bg-transparent px-3 text-sm">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>{new Date(2024, m - 1).toLocaleString(undefined, { month: "long" })}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Button onClick={runCalc} disabled={busy} className="w-full">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
              {busy ? "Calculating…" : "Calculate / refresh payroll"}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-primary/10 to-accent/30">
        <div className="text-xs uppercase text-muted-foreground font-semibold">Total payroll this period</div>
        <div className="text-3xl font-bold text-primary mt-1">
          {currency} {totalPayroll.toFixed(2)}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {rows?.length ?? 0} employees · {year}-{String(month).padStart(2, "0")}
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs">
              <tr>
                <th className="text-left p-2">Employee</th>
                <th className="text-right p-2">Worked</th>
                <th className="text-right p-2">Expected</th>
                <th className="text-right p-2">Prorated</th>
                <th className="text-right p-2">OT</th>
                <th className="text-right p-2">Total</th>
                <th className="text-right p-2">Status</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows?.map((r: any) => {
                const final = Number(r.override_amount ?? r.total_amount ?? 0);
                return (
                  <tr key={r.id} className="border-t">
                    <td className="p-2 truncate max-w-[160px]">{r.profiles?.full_name ?? r.profiles?.email ?? "—"}</td>
                    <td className="p-2 text-right font-mono text-xs">{Number(r.worked_hours).toFixed(1)}h</td>
                    <td className="p-2 text-right font-mono text-xs">{Number(r.expected_hours).toFixed(0)}h</td>
                    <td className="p-2 text-right font-mono text-xs">{Number(r.prorated_amount).toFixed(2)}</td>
                    <td className="p-2 text-right font-mono text-xs">{Number(r.overtime_amount).toFixed(2)}</td>
                    <td className="p-2 text-right font-mono font-semibold">{r.currency} {final.toFixed(2)}</td>
                    <td className="p-2 text-right">
                      <Badge variant={r.status === "finalized" ? "default" : "secondary"} className="text-[10px]">
                        {r.status}
                      </Badge>
                    </td>
                    <td className="p-2 text-right whitespace-nowrap">
                      {r.status !== "finalized" ? (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => {
                            setOverrideRow(r);
                            setOverrideVal(String(r.override_amount ?? r.total_amount));
                            setOverrideReason(r.override_reason ?? "");
                          }}>
                            <Edit3 className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={async () => {
                            await finalizeFn({ data: { salaryId: r.id, companyId: companyId! } });
                            toast.success("Finalized");
                            qc.invalidateQueries({ queryKey: ["salaries", companyId, year, month] });
                          }}>
                            <Lock className="w-3 h-3" />
                          </Button>
                        </>
                      ) : (
                        <Lock className="w-3 h-3 text-success inline" />
                      )}
                    </td>
                  </tr>
                );
              })}
              {(!rows || rows.length === 0) && (
                <tr>
                  <td colSpan={8} className="text-center text-muted-foreground p-8 text-sm">
                    No salary records. Click "Calculate" to generate from this month's attendance.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!overrideRow} onOpenChange={(o) => !o && setOverrideRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override salary</DialogTitle>
            <DialogDescription>
              Set a custom payment amount and reason. The calculated value is kept for audit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Override amount ({overrideRow?.currency})</Label>
              <Input type="number" value={overrideVal} onChange={(e) => setOverrideVal(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Reason</Label>
              <Textarea rows={2} value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOverrideRow(null)}>Cancel</Button>
            <Button onClick={async () => {
              await overrideFn({
                data: {
                  salaryId: overrideRow.id,
                  companyId: companyId!,
                  overrideAmount: Number(overrideVal),
                  reason: overrideReason,
                },
              });
              toast.success("Override saved");
              qc.invalidateQueries({ queryKey: ["salaries", companyId, year, month] });
              setOverrideRow(null);
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmployeePayroll() {
  const { user } = useAuth();
  const { data: rows } = useQuery({
    enabled: !!user,
    queryKey: ["my-salary", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("salary_records")
        .select("*")
        .eq("employee_id", user!.id)
        .order("period_year", { ascending: false })
        .order("period_month", { ascending: false })
        .limit(12);
      return data ?? [];
    },
  });

  const latest = rows?.[0];

  return (
    <div className="space-y-4">
      {latest ? (
        <Card className="p-5 bg-gradient-to-br from-primary/10 to-accent/30">
          <div className="text-xs uppercase text-muted-foreground font-semibold">
            {new Date(latest.period_year, latest.period_month - 1).toLocaleString(undefined, { month: "long", year: "numeric" })}
          </div>
          <div className="text-4xl font-bold text-primary mt-1">
            {latest.currency} {Number(latest.override_amount ?? latest.total_amount).toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            {Number(latest.worked_hours).toFixed(1)}h worked of {Number(latest.expected_hours).toFixed(0)}h expected
            · Status: <Badge variant={latest.status === "finalized" ? "default" : "secondary"} className="text-[10px] ml-1">{latest.status}</Badge>
          </div>
        </Card>
      ) : (
        <Card className="p-8 text-center">
          <DollarSign className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No salary records yet. Your admin will calculate payroll at month-end.</p>
        </Card>
      )}

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs">
              <tr>
                <th className="text-left p-2">Period</th>
                <th className="text-right p-2">Worked</th>
                <th className="text-right p-2">Total</th>
                <th className="text-right p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows?.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{r.period_year}-{String(r.period_month).padStart(2, "0")}</td>
                  <td className="p-2 text-right font-mono text-xs">{Number(r.worked_hours).toFixed(1)}h</td>
                  <td className="p-2 text-right font-mono font-semibold">{r.currency} {Number(r.override_amount ?? r.total_amount).toFixed(2)}</td>
                  <td className="p-2 text-right">
                    <Badge variant={r.status === "finalized" ? "default" : "secondary"} className="text-[10px]">{r.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

