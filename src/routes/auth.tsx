import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Briefcase, KeyRound, Mail, ArrowRight, UserPlus } from "lucide-react";

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

type Mode = "signin" | "signup" | "join";

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold">TillTask</span>
        </div>

        <div className="grid grid-cols-3 gap-1 mb-4 p-1 bg-muted rounded-xl text-sm">
          {(["signin", "signup", "join"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`py-2 rounded-lg font-medium transition-colors ${
                mode === m ? "bg-card shadow text-foreground" : "text-muted-foreground"
              }`}
            >
              {m === "signin" ? "Sign in" : m === "signup" ? "Create" : "Join"}
            </button>
          ))}
        </div>

        <Card className="p-6">
          {mode === "signin" && <SignInForm />}
          {mode === "signup" && <SignUpForm />}
          {mode === "join" && <JoinForm onDone={() => setMode("signin")} />}
        </Card>

        <p className="text-xs text-center text-muted-foreground mt-4">
          Staff joining a company? Use the <span className="font-semibold">Join</span> tab with the
          invite code from your manager.
        </p>
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
      <h2 className="text-lg font-semibold">Sign in to your account</h2>
      <div className="space-y-2">
        <Label>Email</Label>
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
      <div className="space-y-2">
        <Label>Password</Label>
        <Input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign in"}
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
    else toast.success("Account created. You can sign in now.");
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold">Create a company account</h2>
      <p className="text-xs text-muted-foreground">
        For business owners and admins. You'll set up your company next.
      </p>
      <div className="space-y-2">
        <Label>Full name</Label>
        <Input required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Password</Label>
        <Input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create account"}
      </Button>
    </form>
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
      toast.success("Account created. Please sign in.");
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
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <KeyRound className="w-4 h-4" /> Join with invite code
        </h2>
        <p className="text-xs text-muted-foreground">
          Enter the code your company shared (e.g. <code>EMP-AB12CD</code>).
        </p>
        <Input
          placeholder="EMP-XXXXXX"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
        <Button onClick={verifyCode} disabled={busy || code.length < 4} className="w-full">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Verify code <ArrowRight className="w-4 h-4" /></>}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submitJoin} className="space-y-4">
      <div className="p-3 rounded-lg bg-accent/50 text-sm">
        Joining <span className="font-semibold">{info.companyName}</span>
        {info.jobTitle && <span className="text-muted-foreground"> · {info.jobTitle}</span>}
      </div>
      <div className="space-y-2">
        <Label>Full name</Label>
        <Input required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Phone (optional)</Label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className="space-y-2">
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
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4" /> Create staff account</>}
      </Button>
    </form>
  );
}
