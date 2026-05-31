import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  HardHat, MapPin, Users, Wallet, BarChart3, Plus, ArrowLeft, ArrowRight,
  CheckCircle2, Camera, Scan, IndianRupee, Calendar, Clock, Star,
  Phone, ChevronRight, Search, Bell, TrendingUp, Send, Shield, Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SiteSarthi — Construction labour, simplified" },
      { name: "description", content: "Digital muster roll, auto wage calculation and one-tap UPI payouts for construction contractors." },
    ],
  }),
  component: App,
});

/* ---------- Mock data ---------- */
type Worker = {
  id: string; name: string; skill: "Mason" | "Helper" | "Carpenter" | "Electrician" | "Painter";
  rate: number; phone: string; rating: number; present: boolean; advance: number; days: number; avatar: string;
};
type Site = { id: string; name: string; address: string; workers: number; payroll: number; status: "Active" | "Idle"; };

const SITES: Site[] = [
  { id: "s1", name: "Brigade Heights — Tower B", address: "Whitefield, Bengaluru", workers: 24, payroll: 142800, status: "Active" },
  { id: "s2", name: "Prestige Lakeview Villa 12", address: "Sarjapur Road", workers: 8, payroll: 38400, status: "Active" },
  { id: "s3", name: "Godrej Plot 47 — Slab", address: "Devanahalli", workers: 0, payroll: 0, status: "Idle" },
];

const INITIAL_WORKERS: Worker[] = [
  { id: "w1", name: "Ramesh Kumar", skill: "Mason", rate: 800, phone: "+91 98xxx 21001", rating: 4.8, present: true, advance: 2000, days: 18, avatar: "RK" },
  { id: "w2", name: "Suresh Yadav", skill: "Helper", rate: 500, phone: "+91 98xxx 21002", rating: 4.5, present: true, advance: 500, days: 22, avatar: "SY" },
  { id: "w3", name: "Mohan Lal", skill: "Carpenter", rate: 900, phone: "+91 98xxx 21003", rating: 4.9, present: false, advance: 0, days: 14, avatar: "ML" },
  { id: "w4", name: "Anil Verma", skill: "Electrician", rate: 950, phone: "+91 98xxx 21004", rating: 4.7, present: true, advance: 1500, days: 16, avatar: "AV" },
  { id: "w5", name: "Dinesh Pal", skill: "Helper", rate: 500, phone: "+91 98xxx 21005", rating: 4.2, present: true, advance: 0, days: 20, avatar: "DP" },
  { id: "w6", name: "Rakesh Singh", skill: "Painter", rate: 750, phone: "+91 98xxx 21006", rating: 4.6, present: false, advance: 1000, days: 12, avatar: "RS" },
];

const POOL: Worker[] = [
  { id: "p1", name: "Vikas Mehta", skill: "Mason", rate: 850, phone: "+91 98xxx 33001", rating: 4.9, present: false, advance: 0, days: 0, avatar: "VM" },
  { id: "p2", name: "Pankaj Roy", skill: "Carpenter", rate: 900, phone: "+91 98xxx 33002", rating: 4.7, present: false, advance: 0, days: 0, avatar: "PR" },
  { id: "p3", name: "Sanjay Gupta", skill: "Electrician", rate: 1000, phone: "+91 98xxx 33003", rating: 5.0, present: false, advance: 0, days: 0, avatar: "SG" },
  { id: "p4", name: "Arjun Das", skill: "Helper", rate: 500, phone: "+91 98xxx 33004", rating: 4.4, present: false, advance: 0, days: 0, avatar: "AD" },
];

const fmt = (n: number) => "₹" + n.toLocaleString("en-IN");

/* ---------- App shell ---------- */
type Screen =
  | { name: "splash" }
  | { name: "login" }
  | { name: "tabs" }
  | { name: "site"; siteId: string }
  | { name: "checkin"; workerId: string }
  | { name: "payout" }
  | { name: "worker"; workerId: string };

function App() {
  const [screen, setScreen] = useState<Screen>({ name: "splash" });
  const [tab, setTab] = useState<"home" | "workers" | "pool" | "wages">("home");
  const [workers, setWorkers] = useState<Worker[]>(INITIAL_WORKERS);

  return (
    <div className="min-h-screen w-full flex justify-center bg-[oklch(0.94_0.01_80)]">
      <div className="w-full max-w-md min-h-screen bg-background relative overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.06)]">
        {screen.name === "splash" && <Splash onDone={() => setScreen({ name: "login" })} />}
        {screen.name === "login" && <Login onDone={() => setScreen({ name: "tabs" })} />}
        {screen.name === "tabs" && (
          <Tabs
            tab={tab} setTab={setTab} workers={workers}
            openSite={(id) => setScreen({ name: "site", siteId: id })}
            openWorker={(id) => setScreen({ name: "worker", workerId: id })}
            openPayout={() => setScreen({ name: "payout" })}
          />
        )}
        {screen.name === "site" && (
          <SiteDetail
            site={SITES.find((s) => s.id === screen.siteId)!}
            workers={workers}
            back={() => setScreen({ name: "tabs" })}
            checkin={(wid) => setScreen({ name: "checkin", workerId: wid })}
            payout={() => setScreen({ name: "payout" })}
          />
        )}
        {screen.name === "checkin" && (
          <CheckIn
            worker={workers.find((w) => w.id === screen.workerId)!}
            done={() => {
              setWorkers((ws) => ws.map((w) => w.id === screen.workerId ? { ...w, present: true, days: w.days + (w.present ? 0 : 1) } : w));
              setScreen({ name: "tabs" });
              setTab("home");
            }}
            back={() => setScreen({ name: "tabs" })}
          />
        )}
        {screen.name === "payout" && (
          <Payout workers={workers} back={() => setScreen({ name: "tabs" })} done={() => { setScreen({ name: "tabs" }); setTab("wages"); }} />
        )}
        {screen.name === "worker" && (
          <WorkerProfile worker={workers.find((w) => w.id === screen.workerId) || POOL.find((w) => w.id === screen.workerId)!} back={() => setScreen({ name: "tabs" })} />
        )}
      </div>
    </div>
  );
}

/* ---------- Splash ---------- */
function Splash({ onDone }: { onDone: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-between p-8 bg-gradient-to-b from-[oklch(0.78_0.16_60)] to-[oklch(0.65_0.18_45)]">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 rounded-3xl bg-foreground/90 flex items-center justify-center shadow-2xl mb-6 rotate-6">
          <HardHat className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">SiteSarthi</h1>
        <p className="mt-2 text-foreground/70 font-medium">Tumhari site, tumhara hisaab.</p>
      </div>
      <button
        onClick={onDone}
        className="w-full h-14 rounded-2xl bg-foreground text-background font-semibold text-base shadow-xl active:scale-[0.98] transition"
      >
        Get started
      </button>
    </div>
  );
}

/* ---------- Login ---------- */
function Login({ onDone }: { onDone: () => void }) {
  const [phone, setPhone] = useState("98765 43210");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");

  return (
    <div className="absolute inset-0 flex flex-col p-6 pt-14">
      <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mb-8">
        <HardHat className="w-7 h-7 text-primary" />
      </div>
      <h2 className="text-3xl font-extrabold tracking-tight">{step === "phone" ? "Welcome back" : "Verify number"}</h2>
      <p className="text-muted-foreground mt-1 mb-8">
        {step === "phone" ? "Login with your contractor phone number" : "We sent a 6-digit code to +91 " + phone}
      </p>

      {step === "phone" ? (
        <>
          <label className="text-sm font-medium mb-2 text-muted-foreground">Phone number</label>
          <div className="flex items-center gap-2 h-14 px-4 rounded-2xl border border-border bg-surface focus-within:ring-2 ring-primary">
            <span className="font-semibold">+91</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="flex-1 bg-transparent outline-none text-lg tracking-wide"
              placeholder="98765 43210"
            />
          </div>
          <button
            onClick={() => setStep("otp")}
            className="mt-auto h-14 rounded-2xl bg-primary text-primary-foreground font-semibold text-base shadow-lg shadow-primary/30 active:scale-[0.98] transition"
          >
            Send OTP
          </button>
        </>
      ) : (
        <>
          <label className="text-sm font-medium mb-2 text-muted-foreground">Enter OTP</label>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="● ● ● ● ● ●"
            className="h-16 px-4 rounded-2xl border border-border bg-surface outline-none text-center text-2xl font-bold tracking-[0.6em] focus:ring-2 ring-primary"
          />
          <p className="text-xs text-muted-foreground mt-3">Demo: tap continue with any code</p>
          <button
            onClick={onDone}
            className="mt-auto h-14 rounded-2xl bg-primary text-primary-foreground font-semibold text-base shadow-lg shadow-primary/30 active:scale-[0.98] transition"
          >
            Continue
          </button>
        </>
      )}
    </div>
  );
}

/* ---------- Tabs container ---------- */
function Tabs(props: {
  tab: "home" | "workers" | "pool" | "wages";
  setTab: (t: "home" | "workers" | "pool" | "wages") => void;
  workers: Worker[];
  openSite: (id: string) => void;
  openWorker: (id: string) => void;
  openPayout: () => void;
}) {
  const { tab, setTab, workers, openSite, openWorker, openPayout } = props;
  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="flex-1 overflow-y-auto pb-24">
        {tab === "home" && <Home workers={workers} openSite={openSite} openPayout={openPayout} />}
        {tab === "workers" && <WorkersTab workers={workers} openWorker={openWorker} />}
        {tab === "pool" && <PoolTab openWorker={openWorker} />}
        {tab === "wages" && <WagesTab workers={workers} openPayout={openPayout} />}
      </div>
      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}

/* ---------- Home ---------- */
function Home({ workers, openSite, openPayout }: { workers: Worker[]; openSite: (id: string) => void; openPayout: () => void }) {
  const present = workers.filter((w) => w.present).length;
  const totalToday = workers.reduce((s, w) => s + (w.present ? w.rate : 0), 0);

  return (
    <div className="px-5 pt-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-muted-foreground">Good morning,</p>
          <h1 className="text-2xl font-extrabold tracking-tight">Rajesh ji 👋</h1>
        </div>
        <button className="w-11 h-11 rounded-full bg-surface border border-border flex items-center justify-center relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-destructive" />
        </button>
      </div>

      {/* Hero card */}
      <div className="rounded-3xl p-5 bg-gradient-to-br from-foreground to-[oklch(0.28_0.03_60)] text-background shadow-xl">
        <div className="flex items-center gap-2 text-background/70 text-xs font-medium">
          <Calendar className="w-3.5 h-3.5" /> Today, {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
        </div>
        <div className="mt-2 flex items-end gap-1">
          <span className="text-4xl font-extrabold tracking-tight">{fmt(totalToday)}</span>
        </div>
        <p className="text-background/60 text-sm">Wages accrued today</p>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <Stat label="Present" value={`${present}/${workers.length}`} />
          <Stat label="Sites" value={`${SITES.filter(s => s.status === "Active").length}`} />
          <Stat label="Pending" value={fmt(workers.reduce((s,w) => s + w.rate * w.days - w.advance, 0))} small />
        </div>
        <button onClick={openPayout} className="mt-5 w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition">
          <Send className="w-4 h-4" /> Pay this week
        </button>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-3 mt-6">
        <QuickAction icon={Scan} label="Check-in" />
        <QuickAction icon={Plus} label="Add site" />
        <QuickAction icon={Users} label="Hire" />
        <QuickAction icon={IndianRupee} label="Advance" />
      </div>

      {/* Sites */}
      <div className="mt-7 flex items-center justify-between">
        <h2 className="text-base font-bold">My sites</h2>
        <button className="text-sm font-medium text-primary flex items-center">View all <ChevronRight className="w-4 h-4" /></button>
      </div>
      <div className="mt-3 space-y-3">
        {SITES.map((s) => (
          <button key={s.id} onClick={() => openSite(s.id)} className="w-full text-left rounded-2xl p-4 bg-surface border border-border active:scale-[0.99] transition">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{s.name}</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {s.address}
                </p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${s.status === "Active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                {s.status === "Active" ? "● LIVE" : "IDLE"}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground"><Users className="w-4 h-4" /><span className="font-semibold text-foreground">{s.workers}</span> workers</div>
              <div className="flex items-center gap-1.5 text-muted-foreground"><Wallet className="w-4 h-4" /><span className="font-semibold text-foreground">{fmt(s.payroll)}</span> /wk</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="bg-background/10 rounded-xl py-2.5">
      <div className={`font-bold ${small ? "text-sm" : "text-lg"}`}>{value}</div>
      <div className="text-[10px] text-background/60 uppercase tracking-wide font-medium">{label}</div>
    </div>
  );
}

function QuickAction({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <button className="flex flex-col items-center gap-1.5 active:scale-95 transition">
      <div className="w-14 h-14 rounded-2xl bg-surface border border-border flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}

/* ---------- Site Detail ---------- */
function SiteDetail({ site, workers, back, checkin, payout }: { site: Site; workers: Worker[]; back: () => void; checkin: (wid: string) => void; payout: () => void; }) {
  const present = workers.filter(w => w.present);
  const absent = workers.filter(w => !w.present);

  return (
    <div className="absolute inset-0 flex flex-col">
      <header className="px-5 pt-12 pb-4 bg-gradient-to-b from-primary/20 to-background">
        <button onClick={back} className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center mb-3">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-extrabold tracking-tight">{site.name}</h1>
        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> {site.address}</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Pill label="Present" value={`${present.length}`} tone="success" />
          <Pill label="Absent" value={`${absent.length}`} tone="warning" />
          <Pill label="Wage today" value={fmt(present.reduce((s,w)=>s+w.rate,0))} tone="default" />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5">
        <div className="flex items-center justify-between mt-5 mb-3">
          <h2 className="font-bold">Muster roll · Today</h2>
          <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> 09:42 AM</span>
        </div>

        <div className="space-y-2">
          {workers.map((w) => (
            <div key={w.id} className="flex items-center gap-3 p-3 rounded-2xl bg-surface border border-border">
              <Avatar w={w} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{w.name}</div>
                <div className="text-xs text-muted-foreground">{w.skill} · {fmt(w.rate)}/day</div>
              </div>
              {w.present ? (
                <div className="flex items-center gap-1 text-success font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4" /> IN
                </div>
              ) : (
                <button onClick={() => checkin(w.id)} className="px-3 h-9 rounded-xl bg-primary text-primary-foreground text-xs font-bold active:scale-95">
                  Check in
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-5 border-t border-border bg-surface/80 backdrop-blur">
        <button onClick={payout} className="w-full h-14 rounded-2xl bg-foreground text-background font-semibold flex items-center justify-center gap-2 active:scale-[0.98]">
          <Send className="w-4 h-4" /> Run weekly payout
        </button>
      </div>
    </div>
  );
}

function Pill({ label, value, tone }: { label: string; value: string; tone: "success" | "warning" | "default" }) {
  const cls = tone === "success" ? "bg-success/15 text-success" : tone === "warning" ? "bg-warning/25 text-warning-foreground" : "bg-surface text-foreground border border-border";
  return (
    <div className={`rounded-xl px-3 py-2 ${cls}`}>
      <div className="text-[10px] font-bold uppercase opacity-80">{label}</div>
      <div className="font-bold">{value}</div>
    </div>
  );
}

/* ---------- Check-in (face + geofence) ---------- */
function CheckIn({ worker, done, back }: { worker: Worker; done: () => void; back: () => void }) {
  const [step, setStep] = useState<"scan" | "verify" | "done">("scan");

  return (
    <div className="absolute inset-0 flex flex-col bg-foreground text-background">
      <header className="p-5 pt-12 flex items-center justify-between">
        <button onClick={back} className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-semibold tracking-widest opacity-70">FACE CHECK-IN</span>
        <div className="w-10" />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="text-center mb-6">
          <p className="text-sm opacity-60">Checking in</p>
          <h1 className="text-2xl font-bold">{worker.name}</h1>
        </div>

        <div className="relative w-64 h-64 rounded-full border-4 border-dashed border-primary/40 flex items-center justify-center mb-8">
          <div className="w-56 h-56 rounded-full bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center text-5xl font-extrabold">
            {worker.avatar}
          </div>
          {step !== "done" && (
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" style={{ animationDuration: "2s" }} />
          )}
          {step === "done" && (
            <div className="absolute inset-0 rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircle2 className="w-20 h-20 text-success" />
            </div>
          )}
        </div>

        <div className="w-full space-y-3 max-w-xs">
          <Row icon={Camera} label="Face match" ok={step !== "scan"} />
          <Row icon={MapPin} label="Inside site geofence (28m)" ok={step === "done"} />
          <Row icon={Shield} label="Identity verified" ok={step === "done"} />
        </div>
      </div>

      <div className="p-5">
        {step === "scan" && (
          <button onClick={() => setStep("verify")} className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold active:scale-[0.98]">
            Capture face
          </button>
        )}
        {step === "verify" && (
          <button onClick={() => setStep("done")} className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold active:scale-[0.98]">
            Verify location
          </button>
        )}
        {step === "done" && (
          <button onClick={done} className="w-full h-14 rounded-2xl bg-success text-success-foreground font-bold active:scale-[0.98] flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> Marked present
          </button>
        )}
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, ok }: { icon: any; label: string; ok: boolean }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl ${ok ? "bg-success/15" : "bg-background/5"}`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${ok ? "bg-success/30" : "bg-background/10"}`}>
        {ok ? <CheckCircle2 className="w-5 h-5 text-success" /> : <Icon className="w-5 h-5 opacity-60" />}
      </div>
      <span className="text-sm font-medium flex-1">{label}</span>
    </div>
  );
}

/* ---------- Workers tab ---------- */
function WorkersTab({ workers, openWorker }: { workers: Worker[]; openWorker: (id: string) => void }) {
  const [q, setQ] = useState("");
  const filtered = workers.filter(w => w.name.toLowerCase().includes(q.toLowerCase()) || w.skill.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="px-5 pt-12">
      <h1 className="text-2xl font-extrabold tracking-tight">My workers</h1>
      <p className="text-sm text-muted-foreground mt-1">{workers.length} workers · {workers.filter(w=>w.present).length} present today</p>

      <div className="mt-5 flex items-center gap-2 h-12 px-4 rounded-2xl bg-surface border border-border">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search by name or skill" className="flex-1 bg-transparent outline-none text-sm" />
      </div>

      <div className="mt-4 space-y-2">
        {filtered.map((w) => (
          <button key={w.id} onClick={() => openWorker(w.id)} className="w-full text-left flex items-center gap-3 p-3 rounded-2xl bg-surface border border-border active:scale-[0.99]">
            <Avatar w={w} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2"><span className="font-semibold truncate">{w.name}</span>
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-warning-foreground bg-warning/40 px-1.5 py-0.5 rounded">
                  <Star className="w-2.5 h-2.5 fill-current" /> {w.rating}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">{w.skill} · {fmt(w.rate)}/day · {w.days} days</div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Pool tab ---------- */
function PoolTab({ openWorker }: { openWorker: (id: string) => void }) {
  return (
    <div className="px-5 pt-12">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <span className="text-xs font-bold tracking-widest text-primary uppercase">City pool</span>
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight mt-1">Hire verified workers</h1>
      <p className="text-sm text-muted-foreground mt-1">Workers free from other sites in Bengaluru today</p>

      <div className="mt-5 space-y-3">
        {POOL.map((w) => (
          <div key={w.id} className="rounded-2xl p-4 bg-surface border border-border">
            <div className="flex items-center gap-3">
              <Avatar w={w} large />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{w.name}</h3>
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-warning-foreground bg-warning/40 px-1.5 py-0.5 rounded">
                    <Star className="w-2.5 h-2.5 fill-current" /> {w.rating}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">{w.skill} · {fmt(w.rate)}/day</div>
                <div className="text-[11px] text-success font-semibold mt-0.5 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Aadhaar verified · 142 days worked
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button onClick={() => openWorker(w.id)} className="h-10 rounded-xl border border-border text-sm font-semibold active:scale-95">View</button>
              <button className="h-10 rounded-xl bg-primary text-primary-foreground text-sm font-bold active:scale-95 flex items-center justify-center gap-1">
                <Phone className="w-3.5 h-3.5" /> Request
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Wages tab ---------- */
function WagesTab({ workers, openPayout }: { workers: Worker[]; openPayout: () => void }) {
  const totals = useMemo(() => {
    const gross = workers.reduce((s, w) => s + w.rate * w.days, 0);
    const advance = workers.reduce((s, w) => s + w.advance, 0);
    return { gross, advance, net: gross - advance };
  }, [workers]);

  return (
    <div className="px-5 pt-12">
      <h1 className="text-2xl font-extrabold tracking-tight">Wages</h1>
      <p className="text-sm text-muted-foreground mt-1">Week of 25 May – 31 May</p>

      <div className="mt-5 rounded-3xl p-5 bg-foreground text-background">
        <div className="text-xs uppercase tracking-widest opacity-60 font-bold">Net payable</div>
        <div className="text-4xl font-extrabold tracking-tight mt-1">{fmt(totals.net)}</div>
        <div className="mt-4 flex items-center gap-4 text-sm">
          <div><div className="opacity-60 text-xs">Gross</div><div className="font-semibold">{fmt(totals.gross)}</div></div>
          <div className="w-px h-8 bg-background/20" />
          <div><div className="opacity-60 text-xs">Advance</div><div className="font-semibold">−{fmt(totals.advance)}</div></div>
        </div>
        <button onClick={openPayout} className="mt-4 w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 active:scale-[0.98]">
          <Send className="w-4 h-4" /> Pay via UPI
        </button>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="font-bold">Breakdown</h2>
        <span className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3 text-success" /> +8% vs last week</span>
      </div>
      <div className="mt-3 space-y-2">
        {workers.map((w) => (
          <div key={w.id} className="flex items-center gap-3 p-3 rounded-2xl bg-surface border border-border">
            <Avatar w={w} />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{w.name}</div>
              <div className="text-[11px] text-muted-foreground">{w.days} days × {fmt(w.rate)} − adv {fmt(w.advance)}</div>
            </div>
            <div className="font-bold">{fmt(w.rate * w.days - w.advance)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Payout flow ---------- */
function Payout({ workers, back, done }: { workers: Worker[]; back: () => void; done: () => void }) {
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const total = workers.reduce((s, w) => s + w.rate * w.days - w.advance, 0);
  const fee = Math.round(workers.length * 3);

  const start = () => {
    setPaying(true);
    setTimeout(() => { setPaying(false); setPaid(true); }, 1600);
  };

  return (
    <div className="absolute inset-0 flex flex-col">
      <header className="px-5 pt-12 pb-4 flex items-center justify-between">
        <button onClick={back} className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-semibold">UPI Payout</span>
        <div className="w-10" />
      </header>

      {!paid ? (
        <>
          <div className="flex-1 overflow-y-auto px-5">
            <div className="rounded-3xl p-5 bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
              <div className="text-xs font-bold uppercase tracking-widest text-primary">Total payout</div>
              <div className="text-4xl font-extrabold mt-1">{fmt(total)}</div>
              <div className="text-xs text-muted-foreground mt-1">to {workers.length} workers · fee {fmt(fee)}</div>
            </div>

            <h2 className="font-bold mt-6 mb-3">Recipients</h2>
            <div className="space-y-2">
              {workers.map((w) => (
                <div key={w.id} className="flex items-center gap-3 p-3 rounded-2xl bg-surface border border-border">
                  <Avatar w={w} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{w.name}</div>
                    <div className="text-[11px] text-muted-foreground">UPI · {w.phone.slice(-5)}@upi</div>
                  </div>
                  <div className="font-bold">{fmt(w.rate * w.days - w.advance)}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-5 border-t border-border">
            <button onClick={start} disabled={paying} className="w-full h-14 rounded-2xl bg-foreground text-background font-bold active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70">
              {paying ? (
                <><div className="w-5 h-5 rounded-full border-2 border-background/30 border-t-background animate-spin" /> Sending…</>
              ) : (
                <><Send className="w-4 h-4" /> Pay {fmt(total)} via UPI</>
              )}
            </button>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center mb-6 animate-in zoom-in duration-300">
            <CheckCircle2 className="w-12 h-12 text-success" />
          </div>
          <h2 className="text-2xl font-extrabold">Payouts sent!</h2>
          <p className="text-muted-foreground mt-2">{fmt(total)} transferred to {workers.length} workers via UPI</p>
          <div className="mt-6 w-full max-w-xs rounded-2xl bg-surface border border-border p-4 text-left text-sm">
            <Line k="Reference" v="STSR4829HX" />
            <Line k="Time" v="Just now" />
            <Line k="Fee" v={fmt(fee)} />
          </div>
          <button onClick={done} className="mt-auto w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold active:scale-[0.98]">Done</button>
        </div>
      )}
    </div>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between py-1.5 border-b last:border-0 border-border"><span className="text-muted-foreground">{k}</span><span className="font-semibold">{v}</span></div>;
}

/* ---------- Worker profile ---------- */
function WorkerProfile({ worker, back }: { worker: Worker; back: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col">
      <header className="px-5 pt-12 pb-6 bg-gradient-to-b from-primary/25 to-background">
        <button onClick={back} className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center mb-4">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-4">
          <Avatar w={worker} large />
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">{worker.name}</h1>
            <p className="text-sm text-muted-foreground">{worker.skill} · {fmt(worker.rate)}/day</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-warning/40 text-warning-foreground px-1.5 py-0.5 rounded">
                <Star className="w-2.5 h-2.5 fill-current" /> {worker.rating}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-success/15 text-success px-1.5 py-0.5 rounded">
                <Shield className="w-2.5 h-2.5" /> Verified
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5">
        <div className="grid grid-cols-3 gap-2">
          <Pill label="Days" value={`${worker.days}`} tone="default" />
          <Pill label="Earned" value={fmt(worker.rate * worker.days)} tone="default" />
          <Pill label="Advance" value={fmt(worker.advance)} tone="warning" />
        </div>

        <h2 className="font-bold mt-6 mb-3">Recent attendance</h2>
        <div className="space-y-2">
          {["Today", "Yesterday", "29 May", "28 May", "27 May"].map((d, i) => (
            <div key={d} className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border">
              <div className="text-sm font-medium">{d}</div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">9:{40 + i}a – 6:1{i}p</span>
                <span className="px-2 py-0.5 rounded bg-success/15 text-success font-bold">{fmt(worker.rate)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-5 border-t border-border grid grid-cols-2 gap-3">
        <button className="h-12 rounded-2xl border border-border font-semibold flex items-center justify-center gap-2"><Phone className="w-4 h-4" /> Call</button>
        <button className="h-12 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2"><IndianRupee className="w-4 h-4" /> Pay advance</button>
      </div>
    </div>
  );
}

/* ---------- Atoms ---------- */
function Avatar({ w, large }: { w: Worker; large?: boolean }) {
  const size = large ? "w-14 h-14 text-base" : "w-11 h-11 text-sm";
  return (
    <div className={`${size} rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center font-extrabold text-foreground relative shrink-0`}>
      {w.avatar}
      {w.present && <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-success border-2 border-background" />}
    </div>
  );
}

function BottomNav({ tab, setTab }: { tab: string; setTab: (t: any) => void }) {
  const items = [
    { id: "home", label: "Home", icon: BarChart3 },
    { id: "workers", label: "Workers", icon: Users },
    { id: "pool", label: "Pool", icon: Sparkles },
    { id: "wages", label: "Wages", icon: Wallet },
  ];
  return (
    <nav className="absolute bottom-0 inset-x-0 bg-surface/95 backdrop-blur border-t border-border px-2 pt-2 pb-4 flex items-center justify-around">
      {items.map((it) => {
        const active = tab === it.id;
        const Icon = it.icon;
        return (
          <button key={it.id} onClick={() => setTab(it.id)} className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl">
            <Icon className={`w-5 h-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
            <span className={`text-[10px] font-bold ${active ? "text-primary" : "text-muted-foreground"}`}>{it.label}</span>
            {active && <span className="w-1 h-1 rounded-full bg-primary" />}
          </button>
        );
      })}
    </nav>
  );
}
