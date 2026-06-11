import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  LayoutDashboard, Users, Clock, FolderKanban, BarChart3, Bell, Search,
  Play, Pause, Square, Coffee, LogIn, LogOut, Camera, Activity, TrendingUp,
  CheckCircle2, AlertCircle, Circle, ChevronRight, Plus, Filter, Calendar,
  Shield, Settings, Eye, Image as ImageIcon, Zap, Target, ArrowUpRight,
  ArrowDownRight, MoreVertical, X, Monitor, MousePointer, Keyboard, Timer,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TillTask — Remote Workforce Productivity" },
      { name: "description", content: "Monitor remote teams, track hours, and measure productivity without enterprise bloat." },
    ],
  }),
  component: App,
});

/* ---------------- Types & Mock Data ---------------- */
type Status = "online" | "idle" | "offline";
type Employee = {
  id: string; name: string; role: string; team: string; status: Status;
  lastActive: string; todayHours: number; activity: number; productivity: number;
  project: string; avatar: string;
};
type Project = { id: string; name: string; client: string; members: number; hours: number; progress: number; color: string };
type Screenshot = { id: string; emp: string; time: string; activity: number; app: string };

const EMPLOYEES: Employee[] = [
  { id: "e1", name: "Aarav Mehta", role: "Frontend Dev", team: "Product", status: "online", lastActive: "now", todayHours: 6.4, activity: 87, productivity: 92, project: "TillTask Web", avatar: "AM" },
  { id: "e2", name: "Priya Sharma", role: "Designer", team: "Design", status: "online", lastActive: "now", todayHours: 5.1, activity: 78, productivity: 84, project: "Brand Refresh", avatar: "PS" },
  { id: "e3", name: "Rahul Verma", role: "Backend Dev", team: "Product", status: "idle", lastActive: "12m ago", todayHours: 4.8, activity: 52, productivity: 71, project: "API v2", avatar: "RV" },
  { id: "e4", name: "Sneha Iyer", role: "QA Engineer", team: "Product", status: "online", lastActive: "now", todayHours: 7.2, activity: 91, productivity: 95, project: "TillTask Web", avatar: "SI" },
  { id: "e5", name: "Vikram Singh", role: "Marketing", team: "Growth", status: "offline", lastActive: "2h ago", todayHours: 3.0, activity: 0, productivity: 68, project: "Q1 Campaign", avatar: "VS" },
  { id: "e6", name: "Anita Rao", role: "Content Writer", team: "Growth", status: "idle", lastActive: "8m ago", todayHours: 5.6, activity: 44, productivity: 76, project: "Blog Sprint", avatar: "AR" },
  { id: "e7", name: "Karan Patel", role: "DevOps", team: "Product", status: "online", lastActive: "now", todayHours: 6.0, activity: 82, productivity: 88, project: "API v2", avatar: "KP" },
];

const PROJECTS: Project[] = [
  { id: "p1", name: "TillTask Web", client: "Internal", members: 5, hours: 142, progress: 68, color: "bg-amber-500" },
  { id: "p2", name: "API v2", client: "Internal", members: 3, hours: 96, progress: 45, color: "bg-emerald-500" },
  { id: "p3", name: "Brand Refresh", client: "Acme Co.", members: 2, hours: 38, progress: 80, color: "bg-rose-500" },
  { id: "p4", name: "Q1 Campaign", client: "Growth", members: 4, hours: 54, progress: 30, color: "bg-indigo-500" },
];

const SCREENSHOTS: Screenshot[] = [
  { id: "ss1", emp: "Aarav Mehta", time: "10:42 AM", activity: 92, app: "VS Code" },
  { id: "ss2", emp: "Priya Sharma", time: "10:38 AM", activity: 81, app: "Figma" },
  { id: "ss3", emp: "Sneha Iyer", time: "10:30 AM", activity: 95, app: "Chrome" },
  { id: "ss4", emp: "Rahul Verma", time: "10:24 AM", activity: 42, app: "Slack" },
  { id: "ss5", emp: "Karan Patel", time: "10:18 AM", activity: 88, app: "Terminal" },
  { id: "ss6", emp: "Anita Rao", time: "10:12 AM", activity: 55, app: "Notion" },
];

const NOTIFICATIONS = [
  { id: "n1", type: "idle", title: "Rahul Verma is idle", desc: "No activity for 12 minutes", time: "now" },
  { id: "n2", type: "missing", title: "Missing screenshot", desc: "Vikram Singh — 11:00 AM slot", time: "5m" },
  { id: "n3", type: "clockin", title: "Late clock-in", desc: "Anita Rao clocked in at 10:42 AM", time: "1h" },
];

/* ---------------- App Shell ---------------- */
function App() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<"home" | "team" | "track" | "projects" | "reports">("home");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [showNotif, setShowNotif] = useState(false);
  const [showClock, setShowClock] = useState(false);
  const [shotPreview, setShotPreview] = useState<Screenshot | null>(null);

  if (!authed) return <Login onDone={() => setAuthed(true)} />;

  const employee = profileId ? EMPLOYEES.find((e) => e.id === profileId) ?? null : null;

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      <TopBar onBell={() => setShowNotif(true)} />
      <main className="flex-1 pb-24">
        {employee ? (
          <EmployeeProfile emp={employee} onBack={() => setProfileId(null)} />
        ) : tab === "home" ? (
          <Dashboard onOpenEmp={setProfileId} onClock={() => setShowClock(true)} onShot={setShotPreview} />
        ) : tab === "team" ? (
          <TeamScreen onOpen={setProfileId} />
        ) : tab === "track" ? (
          <TrackingScreen onClock={() => setShowClock(true)} />
        ) : tab === "projects" ? (
          <ProjectsScreen />
        ) : (
          <ReportsScreen />
        )}
      </main>
      {!employee && <BottomNav tab={tab} setTab={setTab} />}
      {showNotif && <NotifSheet onClose={() => setShowNotif(false)} />}
      {showClock && <ClockModal onClose={() => setShowClock(false)} />}
      {shotPreview && <ShotModal shot={shotPreview} onClose={() => setShotPreview(null)} />}
    </div>
  );
}

/* ---------------- Login ---------------- */
function Login({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("admin@tilltask.io");
  const [otp, setOtp] = useState("");

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <div className="flex-1 px-6 pt-16 pb-8 max-w-md mx-auto w-full flex flex-col">
        <div className="flex items-center gap-2 mb-12">
          <div className="h-10 w-10 rounded-xl bg-primary grid place-items-center">
            <Timer className="size-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-bold text-lg leading-none">TillTask</div>
            <div className="text-xs text-muted-foreground mt-0.5">Remote workforce, measured.</div>
          </div>
        </div>

        <h1 className="text-3xl font-bold tracking-tight mb-2">
          {step === "email" ? "Sign in to your workspace" : "Verify it's you"}
        </h1>
        <p className="text-muted-foreground mb-8">
          {step === "email" ? "We'll send a one-time code to your work email." : `Enter the 6-digit code sent to ${email}`}
        </p>

        {step === "email" ? (
          <>
            <label className="text-sm font-medium mb-2">Work email</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="h-12 px-4 rounded-xl border border-border bg-surface text-base outline-none focus:ring-2 focus:ring-ring"
              placeholder="you@company.com"
            />
            <button
              onClick={() => setStep("otp")}
              className="mt-4 h-12 rounded-xl bg-primary text-primary-foreground font-semibold active:scale-[0.98] transition"
            >
              Continue
            </button>
          </>
        ) : (
          <>
            <input
              value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              className="h-14 px-4 rounded-xl border border-border bg-surface text-2xl tracking-[0.5em] text-center font-mono outline-none focus:ring-2 focus:ring-ring"
              placeholder="••••••"
            />
            <button
              onClick={onDone} disabled={otp.length !== 6}
              className="mt-4 h-12 rounded-xl bg-primary text-primary-foreground font-semibold disabled:opacity-40 active:scale-[0.98] transition"
            >
              Sign in
            </button>
            <button onClick={() => setStep("email")} className="mt-3 text-sm text-muted-foreground">
              Use a different email
            </button>
          </>
        )}

        <div className="mt-auto pt-8 text-xs text-muted-foreground text-center">
          By signing in you agree to TillTask's Terms & Privacy.
        </div>
      </div>
    </div>
  );
}

/* ---------------- Top Bar ---------------- */
function TopBar({ onBell }: { onBell: () => void }) {
  return (
    <header className="sticky top-0 z-30 bg-background/85 backdrop-blur border-b border-border">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-primary grid place-items-center shrink-0">
          <Timer className="size-4 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <div className="font-bold text-sm leading-none truncate">TillTask</div>
          <div className="text-[11px] text-muted-foreground mt-0.5 truncate">Acme Inc · Admin</div>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button className="h-9 w-9 grid place-items-center rounded-lg hover:bg-secondary" aria-label="Search">
            <Search className="size-4" />
          </button>
          <button onClick={onBell} className="h-9 w-9 grid place-items-center rounded-lg hover:bg-secondary relative" aria-label="Notifications">
            <Bell className="size-4" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive" />
          </button>
          <div className="h-8 w-8 rounded-full bg-accent grid place-items-center text-xs font-bold ml-1">AD</div>
        </div>
      </div>
    </header>
  );
}

/* ---------------- Bottom Nav ---------------- */
function BottomNav({ tab, setTab }: { tab: string; setTab: (t: any) => void }) {
  const items = [
    { id: "home", label: "Home", icon: LayoutDashboard },
    { id: "team", label: "Team", icon: Users },
    { id: "track", label: "Track", icon: Clock },
    { id: "projects", label: "Projects", icon: FolderKanban },
    { id: "reports", label: "Reports", icon: BarChart3 },
  ];
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-background/95 backdrop-blur border-t border-border">
      <div className="max-w-screen-xl mx-auto grid grid-cols-5 px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {items.map((it) => {
          const active = tab === it.id;
          return (
            <button
              key={it.id} onClick={() => setTab(it.id)}
              className={`flex flex-col items-center gap-1 py-1.5 rounded-lg text-[11px] font-medium transition ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <it.icon className={`size-5 ${active ? "stroke-[2.5]" : ""}`} />
              {it.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ---------------- Dashboard ---------------- */
function Dashboard({
  onOpenEmp, onClock, onShot,
}: { onOpenEmp: (id: string) => void; onClock: () => void; onShot: (s: Screenshot) => void }) {
  const stats = useMemo(() => {
    const online = EMPLOYEES.filter((e) => e.status === "online").length;
    const idle = EMPLOYEES.filter((e) => e.status === "idle").length;
    const offline = EMPLOYEES.filter((e) => e.status === "offline").length;
    const hours = EMPLOYEES.reduce((a, e) => a + e.todayHours, 0);
    const avgProd = Math.round(EMPLOYEES.reduce((a, e) => a + e.productivity, 0) / EMPLOYEES.length);
    return { online, idle, offline, hours, avgProd };
  }, []);

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-5 space-y-5">
      <section>
        <div className="flex items-end justify-between gap-3 mb-1">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Today · Mon, Jun 15</p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">Good morning, Admin</h1>
          </div>
          <button onClick={onClock} className="shrink-0 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 active:scale-95 transition">
            <Play className="size-4" /> <span className="hidden xs:inline">Clock</span>
          </button>
        </div>
      </section>

      {/* Live stats — responsive grid */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<Circle className="size-4 text-emerald-600 fill-emerald-600" />} label="Online" value={stats.online} sub={`${EMPLOYEES.length} total`} accent="emerald" />
        <StatCard icon={<Activity className="size-4 text-amber-600" />} label="Idle" value={stats.idle} sub="5m+ no activity" accent="amber" />
        <StatCard icon={<Clock className="size-4 text-foreground" />} label="Hours today" value={stats.hours.toFixed(1)} sub="vs 42h yest." accent="neutral" />
        <StatCard icon={<TrendingUp className="size-4 text-indigo-600" />} label="Productivity" value={`${stats.avgProd}%`} sub="+4% this week" accent="indigo" />
      </section>

      {/* Productivity chart */}
      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold">Team productivity</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Last 7 days</p>
          </div>
          <button className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground">
            This week <ChevronRight className="size-3" />
          </button>
        </div>
        <MiniChart data={[68, 74, 71, 82, 79, 88, 84]} labels={["M", "T", "W", "T", "F", "S", "S"]} />
      </section>

      {/* Active employees */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Active employees</h2>
          <button className="text-xs text-primary font-medium">See all</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {EMPLOYEES.slice(0, 5).map((e) => (
            <EmployeeRow key={e.id} emp={e} onClick={() => onOpenEmp(e.id)} />
          ))}
        </div>
      </section>

      {/* Recent screenshots */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold">Recent screenshots</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Auto-captured · 10 min interval</p>
          </div>
          <button className="text-xs text-primary font-medium">Timeline</button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {SCREENSHOTS.map((s) => <ShotThumb key={s.id} shot={s} onClick={() => onShot(s)} />)}
        </div>
      </section>
    </div>
  );
}

/* ---------------- Team / Employee Directory ---------------- */
function TeamScreen({ onOpen }: { onOpen: (id: string) => void }) {
  const [filter, setFilter] = useState<"all" | Status>("all");
  const list = EMPLOYEES.filter((e) => filter === "all" || e.status === filter);

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-5 space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team</h1>
        <p className="text-sm text-muted-foreground mt-1">{EMPLOYEES.length} employees · {EMPLOYEES.filter(e=>e.status==="online").length} online</p>
      </div>

      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1 scrollbar-none">
        {(["all", "online", "idle", "offline"] as const).map((k) => (
          <button
            key={k} onClick={() => setFilter(k)}
            className={`shrink-0 h-9 px-4 rounded-full text-xs font-semibold capitalize border transition ${
              filter === k ? "bg-foreground text-background border-foreground" : "bg-surface border-border text-muted-foreground"
            }`}
          >
            {k} {k !== "all" && `· ${EMPLOYEES.filter(e=>e.status===k).length}`}
          </button>
        ))}
        <button className="shrink-0 h-9 w-9 grid place-items-center rounded-full bg-surface border border-border ml-auto">
          <Filter className="size-4 text-muted-foreground" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {list.map((e) => <EmployeeRow key={e.id} emp={e} onClick={() => onOpen(e.id)} />)}
      </div>
    </div>
  );
}

/* ---------------- Tracking ---------------- */
function TrackingScreen({ onClock }: { onClock: () => void }) {
  const [running, setRunning] = useState(true);
  const [seconds, setSeconds] = useState(2 * 3600 + 14 * 60 + 22);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const hh = Math.floor(seconds / 3600).toString().padStart(2, "0");
  const mm = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const ss = (seconds % 60).toString().padStart(2, "0");

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-5 space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Time tracking</h1>
        <p className="text-sm text-muted-foreground mt-1">Project · TillTask Web</p>
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 p-6 sm:p-8 text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Current session</p>
        <div className="font-mono text-5xl sm:text-6xl font-bold tabular-nums tracking-tight">
          {hh}:{mm}:<span className="text-primary">{ss}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-3">Activity 87% · 12 screenshots captured</p>
        <div className="flex justify-center gap-2 mt-6">
          <button onClick={() => setRunning((r) => !r)} className="h-12 px-6 rounded-2xl bg-foreground text-background font-semibold flex items-center gap-2 active:scale-95 transition">
            {running ? <><Pause className="size-4" /> Pause</> : <><Play className="size-4" /> Resume</>}
          </button>
          <button className="h-12 px-5 rounded-2xl bg-surface border border-border font-semibold flex items-center gap-2"><Coffee className="size-4" /> Break</button>
          <button onClick={onClock} className="h-12 w-12 grid place-items-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20"><Square className="size-4 fill-destructive" /></button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MiniStat icon={<Activity className="size-4" />} label="Active" value="87%" />
        <MiniStat icon={<MousePointer className="size-4" />} label="Clicks" value="2.1k" />
        <MiniStat icon={<Keyboard className="size-4" />} label="Keys" value="14k" />
      </div>

      <section>
        <h2 className="font-semibold mb-3">Today's sessions</h2>
        <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
          {[
            { t: "TillTask Web", s: "09:02", e: "11:16", h: "2h 14m" },
            { t: "Standup", s: "11:30", e: "12:00", h: "30m" },
            { t: "TillTask Web", s: "13:05", e: "—", h: "ongoing" },
          ].map((r, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 grid place-items-center shrink-0">
                <Timer className="size-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{r.t}</div>
                <div className="text-xs text-muted-foreground">{r.s} → {r.e}</div>
              </div>
              <div className="text-sm font-semibold tabular-nums">{r.h}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-3">Attendance · this week</h2>
        <div className="grid grid-cols-7 gap-1.5">
          {["M","T","W","T","F","S","S"].map((d,i)=>{
            const states = ["full","full","full","full","half","off","off"];
            const st = states[i];
            return (
              <div key={i} className={`aspect-square rounded-xl grid place-items-center text-xs font-bold ${
                st==="full" ? "bg-emerald-500/15 text-emerald-700" :
                st==="half" ? "bg-amber-500/20 text-amber-700" : "bg-muted text-muted-foreground"
              }`}>{d}</div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/* ---------------- Projects ---------------- */
function ProjectsScreen() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">{PROJECTS.length} active · 330 tracked hours</p>
        </div>
        <button className="h-10 w-10 grid place-items-center rounded-xl bg-foreground text-background"><Plus className="size-4" /></button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {PROJECTS.map((p) => (
          <div key={p.id} className="rounded-2xl border border-border bg-card p-4 hover:shadow-md transition">
            <div className="flex items-start gap-3 mb-3">
              <div className={`h-10 w-10 rounded-xl ${p.color} grid place-items-center shrink-0`}>
                <FolderKanban className="size-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold truncate">{p.name}</h3>
                <p className="text-xs text-muted-foreground truncate">{p.client}</p>
              </div>
              <button className="h-7 w-7 grid place-items-center rounded-lg hover:bg-secondary">
                <MoreVertical className="size-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
              <span className="flex items-center gap-1"><Users className="size-3.5" /> {p.members}</span>
              <span className="flex items-center gap-1"><Clock className="size-3.5" /> {p.hours}h</span>
              <span className="ml-auto font-semibold text-foreground">{p.progress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className={`h-full ${p.color}`} style={{ width: `${p.progress}%` }} />
            </div>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <h2 className="font-semibold mb-3">Time by project · this week</h2>
        <div className="space-y-3">
          {PROJECTS.map((p) => (
            <div key={p.id}>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-medium truncate">{p.name}</span>
                <span className="text-muted-foreground tabular-nums shrink-0 ml-2">{p.hours}h</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className={`h-full ${p.color}`} style={{ width: `${(p.hours/142)*100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ---------------- Reports ---------------- */
function ReportsScreen() {
  const [range, setRange] = useState<"day"|"week"|"month">("week");
  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-5 space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">Productivity & attendance insights</p>
      </div>

      <div className="inline-flex rounded-xl bg-secondary p-1 text-xs font-semibold">
        {(["day","week","month"] as const).map((r) => (
          <button key={r} onClick={()=>setRange(r)}
            className={`px-4 h-8 rounded-lg capitalize ${range===r?"bg-background shadow-sm":"text-muted-foreground"}`}>
            {r}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Clock className="size-4" />} label="Total hours" value="312h" sub="+8% vs last" accent="neutral" />
        <StatCard icon={<TrendingUp className="size-4 text-emerald-600" />} label="Avg productivity" value="84%" sub="+4%" accent="emerald" />
        <StatCard icon={<CheckCircle2 className="size-4 text-indigo-600" />} label="Attendance" value="96%" sub="2 absences" accent="indigo" />
        <StatCard icon={<Activity className="size-4 text-amber-600" />} label="Avg activity" value="78%" sub="healthy" accent="amber" />
      </div>

      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <h2 className="font-semibold mb-4">Hours by day</h2>
        <MiniChart data={[42, 48, 51, 46, 52, 18, 8]} labels={["M","T","W","T","F","S","S"]} colorClass="bg-foreground" />
      </section>

      <section>
        <h2 className="font-semibold mb-3">Top performers</h2>
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="px-4 py-2.5 font-medium">Employee</th>
                <th className="px-2 py-2.5 font-medium text-right">Hours</th>
                <th className="px-4 py-2.5 font-medium text-right">Prod</th>
              </tr>
            </thead>
            <tbody>
              {[...EMPLOYEES].sort((a,b)=>b.productivity-a.productivity).slice(0,5).map((e,i) => (
                <tr key={e.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">{i+1}</span>
                      <div className="h-8 w-8 rounded-full bg-accent grid place-items-center text-[11px] font-bold shrink-0">{e.avatar}</div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{e.name}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{e.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-right tabular-nums text-sm">{e.todayHours}h</td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
                      {e.productivity}% <ArrowUpRight className="size-3" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <button className="w-full h-12 rounded-xl border border-border bg-surface font-semibold text-sm flex items-center justify-center gap-2 hover:bg-secondary">
        <ArrowDownRight className="size-4" /> Export {range} report (CSV)
      </button>
    </div>
  );
}

/* ---------------- Employee Profile ---------------- */
function EmployeeProfile({ emp, onBack }: { emp: Employee; onBack: () => void }) {
  return (
    <div className="max-w-screen-xl mx-auto">
      <div className="px-4 sm:px-6 pt-4">
        <button onClick={onBack} className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
          <X className="size-4" /> Close
        </button>
      </div>

      <div className="px-4 sm:px-6 pb-5">
        <div className="rounded-3xl bg-gradient-to-br from-accent to-secondary p-6 flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-background grid place-items-center text-lg font-bold shrink-0">{emp.avatar}</div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold truncate">{emp.name}</h1>
            <p className="text-sm text-muted-foreground truncate">{emp.role} · {emp.team}</p>
            <div className="flex items-center gap-2 mt-2">
              <StatusDot s={emp.status} />
              <span className="text-xs font-medium capitalize">{emp.status} · {emp.lastActive}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <MiniStat icon={<Clock className="size-4" />} label="Today" value={`${emp.todayHours}h`} />
          <MiniStat icon={<Activity className="size-4" />} label="Activity" value={`${emp.activity}%`} />
          <MiniStat icon={<Target className="size-4" />} label="Score" value={`${emp.productivity}`} />
        </div>

        <section className="mt-5">
          <h2 className="font-semibold mb-3">Activity timeline · today</h2>
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="h-3 rounded-full overflow-hidden flex">
              <div className="bg-emerald-500" style={{ width: "62%" }} />
              <div className="bg-amber-500" style={{ width: "18%" }} />
              <div className="bg-muted" style={{ width: "20%" }} />
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground mt-2 tabular-nums">
              <span>09:00</span><span>13:00</span><span>18:00</span>
            </div>
            <div className="flex gap-4 mt-3 text-xs">
              <span className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-emerald-500" /> Active 4h 28m</span>
              <span className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-amber-500" /> Idle 1h 18m</span>
              <span className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-muted" /> Off</span>
            </div>
          </div>
        </section>

        <section className="mt-5">
          <h2 className="font-semibold mb-3">Assigned projects</h2>
          <div className="space-y-2">
            {PROJECTS.slice(0, 2).map((p) => (
              <div key={p.id} className="rounded-xl border border-border bg-card p-3 flex items-center gap-3">
                <div className={`h-9 w-9 rounded-lg ${p.color} grid place-items-center shrink-0`}>
                  <FolderKanban className="size-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.hours}h tracked</div>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5">
          <h2 className="font-semibold mb-3">Recent screenshots</h2>
          <div className="grid grid-cols-3 gap-2">
            {SCREENSHOTS.slice(0, 6).map((s) => (
              <div key={s.id} className="aspect-video rounded-lg bg-gradient-to-br from-secondary to-accent border border-border grid place-items-center">
                <ImageIcon className="size-5 text-muted-foreground" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ---------------- Reusable bits ---------------- */
function StatCard({ icon, label, value, sub, accent }: {
  icon: React.ReactNode; label: string; value: string|number; sub: string;
  accent: "emerald"|"amber"|"indigo"|"neutral";
}) {
  const accentBg = {
    emerald: "bg-emerald-500/10", amber: "bg-amber-500/10",
    indigo: "bg-indigo-500/10", neutral: "bg-secondary",
  }[accent];
  return (
    <div className="rounded-2xl border border-border bg-card p-3.5">
      <div className={`h-8 w-8 rounded-lg ${accentBg} grid place-items-center mb-2.5`}>{icon}</div>
      <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide truncate">{label}</div>
      <div className="text-xl sm:text-2xl font-bold tabular-nums mt-0.5">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{sub}</div>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2.5 text-center">
      <div className="flex justify-center text-muted-foreground mb-1">{icon}</div>
      <div className="text-base font-bold tabular-nums leading-none">{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1">{label}</div>
    </div>
  );
}

function EmployeeRow({ emp, onClick }: { emp: Employee; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-left rounded-xl border border-border bg-card p-3 flex items-center gap-3 hover:shadow-md hover:border-primary/30 transition">
      <div className="relative shrink-0">
        <div className="h-10 w-10 rounded-full bg-accent grid place-items-center text-xs font-bold">{emp.avatar}</div>
        <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${
          emp.status==="online"?"bg-emerald-500":emp.status==="idle"?"bg-amber-500":"bg-muted-foreground/40"
        }`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="font-semibold text-sm truncate">{emp.name}</div>
        </div>
        <div className="text-[11px] text-muted-foreground truncate">{emp.role} · {emp.project}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-sm font-bold tabular-nums">{emp.todayHours}h</div>
        <div className={`text-[10px] font-semibold ${
          emp.activity>=70?"text-emerald-600":emp.activity>=40?"text-amber-600":"text-muted-foreground"
        }`}>{emp.activity}% active</div>
      </div>
    </button>
  );
}

function StatusDot({ s }: { s: Status }) {
  const c = s==="online"?"bg-emerald-500":s==="idle"?"bg-amber-500":"bg-muted-foreground/50";
  return <span className={`h-2 w-2 rounded-full ${c}`} />;
}

function ShotThumb({ shot, onClick }: { shot: Screenshot; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-left group">
      <div className="aspect-video rounded-xl bg-gradient-to-br from-secondary via-accent to-secondary border border-border grid place-items-center relative overflow-hidden group-hover:border-primary/40 transition">
        <Monitor className="size-6 text-muted-foreground" />
        <span className="absolute top-1.5 right-1.5 text-[10px] px-1.5 py-0.5 rounded bg-background/90 font-bold tabular-nums">{shot.activity}%</span>
      </div>
      <div className="mt-1.5 px-0.5">
        <div className="text-[11px] font-semibold truncate">{shot.emp}</div>
        <div className="text-[10px] text-muted-foreground">{shot.time} · {shot.app}</div>
      </div>
    </button>
  );
}

function MiniChart({ data, labels, colorClass = "bg-primary" }: { data: number[]; labels: string[]; colorClass?: string }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end gap-1.5 sm:gap-2 h-32">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
          <div className="w-full flex-1 flex items-end">
            <div className={`w-full rounded-t-md ${colorClass} transition-all`} style={{ height: `${(v/max)*100}%` }} />
          </div>
          <div className="text-[10px] text-muted-foreground font-medium">{labels[i]}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Modals & Sheets ---------------- */
function NotifSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />
      <div onClick={(e)=>e.stopPropagation()} className="relative w-full sm:max-w-md bg-background rounded-t-3xl sm:rounded-3xl border border-border max-h-[80vh] flex flex-col">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg">Alerts</h2>
            <p className="text-xs text-muted-foreground">3 unread</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-lg hover:bg-secondary"><X className="size-4" /></button>
        </div>
        <div className="overflow-y-auto p-3 space-y-2">
          {NOTIFICATIONS.map((n) => (
            <div key={n.id} className="rounded-xl border border-border bg-card p-3 flex items-start gap-3">
              <div className={`h-9 w-9 rounded-lg grid place-items-center shrink-0 ${
                n.type==="idle"?"bg-amber-500/15 text-amber-700":
                n.type==="missing"?"bg-rose-500/15 text-rose-700":"bg-indigo-500/15 text-indigo-700"
              }`}>
                <AlertCircle className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{n.title}</div>
                <div className="text-xs text-muted-foreground">{n.desc}</div>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">{n.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ClockModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"choose"|"done">("choose");
  const [action, setAction] = useState<"in"|"out"|"break"|null>(null);
  const doIt = (a: "in"|"out"|"break") => { setAction(a); setStep("done"); };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />
      <div onClick={(e)=>e.stopPropagation()} className="relative w-full sm:max-w-sm bg-background rounded-t-3xl sm:rounded-3xl border border-border p-6">
        {step==="choose" ? (
          <>
            <h2 className="font-bold text-lg mb-1">Attendance</h2>
            <p className="text-xs text-muted-foreground mb-5">Choose an action</p>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={()=>doIt("in")} className="aspect-square rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center gap-2 active:scale-95">
                <LogIn className="size-6 text-emerald-700" />
                <span className="text-xs font-semibold text-emerald-700">Clock in</span>
              </button>
              <button onClick={()=>doIt("break")} className="aspect-square rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center justify-center gap-2 active:scale-95">
                <Coffee className="size-6 text-amber-700" />
                <span className="text-xs font-semibold text-amber-700">Break</span>
              </button>
              <button onClick={()=>doIt("out")} className="aspect-square rounded-2xl bg-rose-500/10 border border-rose-500/20 flex flex-col items-center justify-center gap-2 active:scale-95">
                <LogOut className="size-6 text-rose-700" />
                <span className="text-xs font-semibold text-rose-700">Clock out</span>
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="h-16 w-16 rounded-full bg-emerald-500/15 grid place-items-center mx-auto mb-4">
              <CheckCircle2 className="size-8 text-emerald-600" />
            </div>
            <h2 className="font-bold text-lg">
              {action==="in"?"Clocked in":action==="break"?"On break":"Clocked out"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1 tabular-nums">at {new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}</p>
            <button onClick={onClose} className="mt-6 w-full h-12 rounded-xl bg-foreground text-background font-semibold">Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

function ShotModal({ shot, onClose }: { shot: Screenshot; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm" />
      <div onClick={(e)=>e.stopPropagation()} className="relative w-full sm:max-w-2xl bg-background rounded-t-3xl sm:rounded-2xl border border-border overflow-hidden">
        <div className="aspect-video bg-gradient-to-br from-secondary via-accent to-secondary grid place-items-center">
          <Monitor className="size-16 text-muted-foreground" />
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="min-w-0">
              <h2 className="font-bold truncate">{shot.emp}</h2>
              <p className="text-xs text-muted-foreground">{shot.time} · {shot.app}</p>
            </div>
            <span className="shrink-0 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 text-xs font-bold tabular-nums">{shot.activity}% active</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="h-10 rounded-xl bg-secondary font-semibold text-sm flex items-center justify-center gap-2"><Eye className="size-4" /> View full</button>
            <button onClick={onClose} className="h-10 rounded-xl bg-foreground text-background font-semibold text-sm">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
