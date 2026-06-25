import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Loader2,
  Briefcase,
  KeyRound,
  Mail,
  ArrowRight,
  UserPlus,
  Building2,
  Users,
  ShieldCheck,
  LogIn,
} from "lucide-react";
import { BrandLockup } from "@/components/brand";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { lookupInviteCode, joinWithInviteCode } from "@/lib/invite.functions";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — TillTask" },
      { name: "description", content: "Sign in to TillTask or join with an invite code." },
    ],
  }),
  component: AuthPage,
});

type Audience = "business" | "staff";

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [audience, setAudience] = useState<Audience>("business");

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Hero / brand panel */}
      <aside className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-primary/15 via-accent/30 to-background border-r">
        <BrandLockup className="h-9" />
        <div className="space-y-6 max-w-sm">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Remote teams, measured fairly.
          </h1>
          <p className="text-muted-foreground">
            Time tracking, productivity scores, and screenshot review — without enterprise bloat.
          </p>
          <ul className="space-y-3 text-sm">
            <Feat icon={ShieldCheck} text="Role-based access for owners, admins & staff" />
            <Feat icon={Users} text="Invite-code onboarding — no IT setup required" />
            <Feat icon={Building2} text="One workspace per company, fully isolated" />
          </ul>
        </div>
        <div className="text-xs text-muted-foreground">© TillTask · Built for hybrid teams</div>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 justify-center mb-6">
            <BrandLockup className="h-9" />
          </div>

          <div className="grid grid-cols-2 gap-1 mb-6 p-1 bg-muted rounded-xl text-sm">
            <AudienceTab
              active={audience === "business"}
              onClick={() => setAudience("business")}
              icon={Building2}
              label="Business"
              sub="Owners & admins"
            />
            <AudienceTab
              active={audience === "staff"}
              onClick={() => setAudience("staff")}
              icon={Users}
              label="Staff"
              sub="Join with code"
            />
          </div>

          <Card className="p-6 sm:p-7 shadow-sm">
            {audience === "business" ? <BusinessPanel /> : <StaffPanel />}
          </Card>

          <p className="text-xs text-center text-muted-foreground mt-5">
            {audience === "business"
              ? "New to TillTask? Create a business account to set up your company."
              : "Joining a team? Use the invite code your manager shared."}
          </p>
        </div>
      </main>
    </div>
  );
}

function Feat({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <li className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-md bg-primary/15 text-primary flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5" />
      </div>
      <span>{text}</span>
    </li>
  );
}

function AudienceTab({
  active,
  onClick,
  icon: Icon,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  sub: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
        active ? "bg-card shadow-sm" : "hover:bg-background/60"
      }`}
    >
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
          active ? "bg-primary text-primary-foreground" : "bg-muted-foreground/10 text-muted-foreground"
        }`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <div className={`font-semibold leading-tight ${active ? "" : "text-muted-foreground"}`}>
          {label}
        </div>
        <div className="text-[11px] text-muted-foreground leading-tight">{sub}</div>
      </div>
    </button>
  );
}

/* ------------------------------ BUSINESS ------------------------------ */
function BusinessPanel() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">
          {mode === "signin" ? "Sign in to your workspace" : "Create a business account"}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {mode === "signin"
            ? "Owners & company admins — manage your team here."
            : "You'll set up your company in the next step."}
        </p>
      </div>
      {mode === "signin" ? <SignInForm /> : <SignUpForm />}
      <div className="text-center text-xs text-muted-foreground">
        {mode === "signin" ? (
          <>
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => setMode("signup")}
              className="text-primary font-medium hover:underline"
            >
              Create one
            </button>
          </>
        ) : (
          <>
            Already registered?{" "}
            <button
              type="button"
              onClick={() => setMode("signin")}
              className="text-primary font-medium hover:underline"
            >
              Sign in
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Welcome back");
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Work email</Label>
        <div className="relative">
          <Mail className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            type="email"
            required
            className="pl-9"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Password</Label>
        <Input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><LogIn className="w-4 h-4" /> Sign in</>}
      </Button>
    </form>
  );
}

function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Account created — sign in to continue");
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Your name</Label>
        <Input required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Work email</Label>
        <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Password</Label>
        <Input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="text-[11px] text-muted-foreground">At least 8 characters.</p>
      </div>
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create business account"}
      </Button>
    </form>
  );
}

/* ------------------------------ STAFF ------------------------------ */
function StaffPanel() {
  const [view, setView] = useState<"join" | "signin">("join");
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">
          {view === "join" ? "Join your company" : "Sign in to your account"}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {view === "join"
            ? "Enter the invite code your company shared — either the company-wide code or a personal one."
            : "Already created your account? Sign in below."}
        </p>
      </div>
      {view === "join" ? <JoinForm onDone={() => setView("signin")} /> : <SignInForm />}
      <div className="text-center text-xs text-muted-foreground">
        {view === "join" ? (
          <>
            Already joined?{" "}
            <button
              type="button"
              onClick={() => setView("signin")}
              className="text-primary font-medium hover:underline"
            >
              Sign in
            </button>
          </>
        ) : (
          <>
            Need to join with a code?{" "}
            <button
              type="button"
              onClick={() => setView("join")}
              className="text-primary font-medium hover:underline"
            >
              Use invite code
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function JoinForm({ onDone }: { onDone: () => void }) {
  const lookup = useServerFn(lookupInviteCode);
  const join = useServerFn(joinWithInviteCode);
  const [code, setCode] = useState("");
  const [info, setInfo] = useState<null | {
    companyName?: string;
    intendedName?: string | null;
    jobTitle?: string | null;
  }>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function verifyCode() {
    setBusy(true);
    try {
      const res = await lookup({ data: { code } });
      if (!res.valid) {
        toast.error(res.reason === "already_used" ? "Code already used" : "Invalid code");
        setInfo(null);
      } else {
        setInfo({
          companyName: res.companyName,
          intendedName: res.intendedName,
          jobTitle: res.jobTitle,
        });
        if (res.intendedName) setName(res.intendedName);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submitJoin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await join({
        data: { code, email, password, fullName: name, phone: phone || undefined },
      });
      toast.success("Account created — please sign in.");
      onDone();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!info) {
    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Invite code</Label>
          <div className="relative">
            <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              className="pl-9 font-mono tracking-wider uppercase"
              placeholder="TILL-XXXXXX or EMP-XXXXXX"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
          </div>
        </div>
        <Button onClick={verifyCode} disabled={busy || code.length < 4} className="w-full">
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Verify code <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submitJoin} className="space-y-4">
      <div className="p-3 rounded-lg bg-accent/40 border text-sm">
        Joining <span className="font-semibold">{info.companyName}</span>
        {info.jobTitle && <span className="text-muted-foreground"> · {info.jobTitle}</span>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Full name</Label>
          <Input required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Phone (optional)</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Choose a password</Label>
        <Input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <UserPlus className="w-4 h-4" /> Create staff account
          </>
        )}
      </Button>
    </form>
  );
}
