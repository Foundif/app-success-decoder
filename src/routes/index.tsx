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
  const { loading, user, primaryRole, companyId } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    if (!primaryRole) {
      // signed in but no role yet → admin must set up a company
      navigate({ to: "/onboarding" });
      return;
    }
    if (primaryRole === "company_admin" && !companyId) {
      navigate({ to: "/onboarding" });
    }
  }, [loading, user, primaryRole, companyId, navigate]);

  if (loading || !user || !primaryRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  return <AppShell role={primaryRole} />;
}

type Tab = "home" | "team" | "screens" | "payroll" | "reports";

function AppShell({ role }: { role: AppRole }) {
  const [tab, setTab] = useState<Tab>("home");
  const { profile, signOut, companyId } = useAuth();
  const navigate = useNavigate();
  const isAdmin = role !== "employee";

  const tabs: { id: Tab; label: string; icon: React.ElementType; allow: AppRole[] }[] = (
    [
      { id: "home", label: "Home", icon: LayoutDashboard, allow: ["super_admin", "company_admin", "employee"] },
      { id: "team", label: "Team", icon: Users, allow: ["super_admin", "company_admin"] },
      { id: "screens", label: "Screens", icon: Camera, allow: ["super_admin", "company_admin", "employee"] },
      { id: "payroll", label: "Payroll", icon: DollarSign, allow: ["super_admin", "company_admin", "employee"] },
      { id: "reports", label: "Reports", icon: BarChart3, allow: ["super_admin", "company_admin"] },
    ] as { id: Tab; label: string; icon: React.ElementType; allow: AppRole[] }[]
  ).filter((t) => t.allow.includes(role));

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
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
          <div className="flex items-center gap-2">
            {isAdmin && companyId && <AlertsBell companyId={companyId} />}
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium">{profile?.full_name ?? profile?.email}</div>
              <div className="text-xs text-muted-foreground">{profile?.job_title ?? ""}</div>
            </div>
            <Button
              size="icon"
              variant="ghost"
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

      <nav className="fixed bottom-0 inset-x-0 bg-card border-t z-10">
        <div className="max-w-screen-xl mx-auto grid" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0,1fr))` }}>
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
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
  const { companyId } = useAuth();
  const { data: members } = useQuery({
    enabled: !!companyId,
    queryKey: ["team", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, job_title, phone")
        .eq("company_id", companyId!);
      return data ?? [];
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
    </div>
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
