import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Loader2,
  Building2,
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  Copy,
  Rocket,
  Briefcase,
  Clock,
  Camera,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import {
  setupCompany,
  generateInviteCodes,
  completeOnboarding,
} from "@/lib/onboarding.functions";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Setup — TillTask" }] }),
  component: OnboardingPage,
});

type EmpRow = { name: string; email: string; jobTitle: string };
type Step = 1 | 2 | 3 | 4;

const STEPS: { id: Step; title: string; sub: string; icon: React.ElementType }[] = [
  { id: 1, title: "Company", sub: "Tell us about your team", icon: Building2 },
  { id: 2, title: "Invite", sub: "Generate staff codes", icon: Users },
  { id: 3, title: "Tracking", sub: "Activate attendance", icon: Clock },
  { id: 4, title: "Done", sub: "You're ready to go", icon: Rocket },
];

function OnboardingPage() {
  const navigate = useNavigate();
  const { user, loading, companyId, refresh } = useAuth();
  const setup = useServerFn(setupCompany);
  const genCodes = useServerFn(generateInviteCodes);
  const complete = useServerFn(completeOnboarding);

  const [step, setStep] = useState<Step>(1);
  const [busy, setBusy] = useState(false);
  const [newCompanyId, setNewCompanyId] = useState<string | null>(null);
  const [companyInviteCode, setCompanyInviteCode] = useState<string | null>(null);

  // step 1
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [size, setSize] = useState("1-10");

  // step 2
  const [emps, setEmps] = useState<EmpRow[]>([{ name: "", email: "", jobTitle: "" }]);
  const [issuedInvites, setIssuedInvites] = useState<
    Array<{ code: string; intended_name: string | null; job_title: string | null }>
  >([]);

  // step 3
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [screenshotsEnabled, setScreenshotsEnabled] = useState(true);
  const [autoBreaks, setAutoBreaks] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
    if (!loading && companyId) setNewCompanyId(companyId);
  }, [user, loading, companyId, navigate]);

  async function submitCompany(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { company } = await setup({
        data: { name, industry: industry || undefined, size },
      });
      setNewCompanyId(company.id);
      setCompanyInviteCode(company.invite_code);
      await refresh();
      setStep(2);
      toast.success("Company created");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submitEmps() {
    if (!newCompanyId) return;
    const valid = emps.filter((e) => e.name.trim().length > 0);
    if (valid.length === 0) {
      setStep(3);
      return;
    }
    setBusy(true);
    try {
      const { invites } = await genCodes({
        data: {
          companyId: newCompanyId,
          employees: valid.map((e) => ({
            name: e.name,
            email: e.email || undefined,
            jobTitle: e.jobTitle || undefined,
          })),
        },
      });
      setIssuedInvites(invites);
      toast.success(`Generated ${invites.length} invite code${invites.length === 1 ? "" : "s"}`);
      setStep(3);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function activateTracking() {
    if (!newCompanyId) return;
    setBusy(true);
    try {
      // settings are stored client-side as part of the seed config for now;
      // backend onboarding flag flips on completion.
      await complete({ data: { companyId: newCompanyId } });
      toast.success("Tracking activated");
      setStep(4);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <div className="font-bold leading-none">TillTask Setup</div>
              <div className="text-xs text-muted-foreground">Step {step} of 4</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/" })}>
            Skip for now
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 grid lg:grid-cols-[260px_1fr] gap-8">
        {/* Stepper */}
        <Stepper step={step} />

        {/* Step content */}
        <div>
          {step === 1 && (
            <StepCard
              icon={Building2}
              title="Set up your company"
              sub="This becomes your TillTask workspace. You can change details later."
            >
              <form onSubmit={submitCompany} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Company name</Label>
                  <Input
                    required
                    placeholder="Acme Inc."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Industry (optional)</Label>
                    <Input
                      placeholder="e.g. Design, Software"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Team size</Label>
                    <select
                      className="w-full h-9 rounded-md border bg-transparent px-3 text-sm"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                    >
                      {["1-10", "11-50", "51-200", "201-1000", "1000+"].map((s) => (
                        <option key={s} value={s}>
                          {s} people
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={busy}>
                    {busy ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Continue <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </StepCard>
          )}

          {step === 2 && (
            <StepCard
              icon={Users}
              title="Invite your team"
              sub="We'll generate a unique invite code per staff member. Share with them — they sign up via the Staff tab."
            >
              <div className="space-y-3 mb-4">
                {emps.map((e, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2">
                    <Input
                      className="col-span-12 sm:col-span-4"
                      placeholder="Name"
                      value={e.name}
                      onChange={(ev) => {
                        const c = [...emps];
                        c[i].name = ev.target.value;
                        setEmps(c);
                      }}
                    />
                    <Input
                      className="col-span-7 sm:col-span-4"
                      placeholder="Email (optional)"
                      value={e.email}
                      onChange={(ev) => {
                        const c = [...emps];
                        c[i].email = ev.target.value;
                        setEmps(c);
                      }}
                    />
                    <Input
                      className="col-span-4 sm:col-span-3"
                      placeholder="Role"
                      value={e.jobTitle}
                      onChange={(ev) => {
                        const c = [...emps];
                        c[i].jobTitle = ev.target.value;
                        setEmps(c);
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="col-span-1"
                      onClick={() => setEmps(emps.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEmps([...emps, { name: "", email: "", jobTitle: "" }])}
                  className="w-full"
                >
                  <Plus className="w-4 h-4" /> Add another
                </Button>
              </div>
              <div className="flex justify-between gap-2 pt-2">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(3)}>
                    Skip
                  </Button>
                  <Button onClick={submitEmps} disabled={busy}>
                    {busy ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Generate codes <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </StepCard>
          )}

          {step === 3 && (
            <StepCard
              icon={Clock}
              title="Activate attendance & tracking"
              sub="Enable the features your team needs. You can change these any time from Settings."
            >
              <div className="space-y-3 mb-5">
                <Toggle
                  icon={Clock}
                  title="Time tracking"
                  sub="Clock in/out, breaks, automatic active vs idle calculation."
                  on={trackingEnabled}
                  setOn={setTrackingEnabled}
                />
                <Toggle
                  icon={Camera}
                  title="Periodic screenshots"
                  sub="Capture work-context screenshots for admin review."
                  on={screenshotsEnabled}
                  setOn={setScreenshotsEnabled}
                />
                <Toggle
                  icon={Sparkles}
                  title="Smart breaks"
                  sub="Auto-pause tracking after extended idle periods."
                  on={autoBreaks}
                  setOn={setAutoBreaks}
                />
              </div>
              <div className="flex justify-between gap-2 pt-2">
                <Button variant="ghost" onClick={() => setStep(2)}>
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                <Button onClick={activateTracking} disabled={busy}>
                  {busy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Activate tracking <Rocket className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </StepCard>
          )}

          {step === 4 && (
            <StepCard
              icon={CheckCircle2}
              title="You're all set"
              sub="Your company workspace is live. Share invite codes with your team to get started."
              success
            >
              <div className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-3">
                  <SuccessTile icon={Building2} title="Company created" />
                  <SuccessTile
                    icon={Users}
                    title={`${issuedInvites.length} invite${issuedInvites.length === 1 ? "" : "s"} ready`}
                  />
                  <SuccessTile icon={Clock} title="Tracking active" />
                </div>

                {companyInviteCode && (
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                    <div className="text-xs uppercase font-semibold text-primary mb-1">
                      Company-wide invite code
                    </div>
                    <div className="flex items-center justify-between">
                      <code className="text-lg font-mono font-bold">{companyInviteCode}</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          navigator.clipboard.writeText(companyInviteCode);
                          toast.success("Copied");
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Anyone with this code can join your company as staff.
                    </p>
                  </div>
                )}

                {issuedInvites.length > 0 && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    <div className="text-sm font-semibold">Per-employee codes</div>
                    {issuedInvites.map((inv) => (
                      <div
                        key={inv.code}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-muted text-sm"
                      >
                        <div>
                          <div className="font-medium">{inv.intended_name ?? "—"}</div>
                          {inv.job_title && (
                            <div className="text-xs text-muted-foreground">{inv.job_title}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-xs">{inv.code}</code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              navigator.clipboard.writeText(inv.code);
                              toast.success("Copied");
                            }}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Button onClick={() => navigate({ to: "/" })} className="w-full" size="lg">
                  Go to dashboard <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </StepCard>
          )}
        </div>
      </div>
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  return (
    <aside className="lg:sticky lg:top-20 self-start">
      <ol className="flex lg:flex-col gap-2 lg:gap-1 overflow-x-auto lg:overflow-visible">
        {STEPS.map((s) => {
          const Icon = s.icon;
          const done = step > s.id;
          const active = step === s.id;
          return (
            <li
              key={s.id}
              className={`flex items-center gap-3 p-2.5 rounded-lg min-w-[160px] lg:min-w-0 ${
                active ? "bg-primary/10" : ""
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                  done
                    ? "bg-success text-success-foreground"
                    : active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <div>
                <div className={`text-sm font-medium ${active ? "" : "text-muted-foreground"}`}>
                  {s.title}
                </div>
                <div className="text-[11px] text-muted-foreground hidden lg:block">{s.sub}</div>
              </div>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

function StepCard({
  icon: Icon,
  title,
  sub,
  children,
  success,
}: {
  icon: React.ElementType;
  title: string;
  sub: string;
  children: React.ReactNode;
  success?: boolean;
}) {
  return (
    <Card className="p-6 sm:p-8">
      <div className="flex items-start gap-3 mb-5">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            success ? "bg-success/15 text-success" : "bg-primary/15 text-primary"
          }`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold leading-tight">{title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{sub}</p>
        </div>
      </div>
      {children}
    </Card>
  );
}

function Toggle({
  icon: Icon,
  title,
  sub,
  on,
  setOn,
}: {
  icon: React.ElementType;
  title: string;
  sub: string;
  on: boolean;
  setOn: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => setOn(!on)}
      className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
        on ? "border-primary/40 bg-primary/5" : "hover:bg-muted/60"
      }`}
    >
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
          on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        }`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
      <div
        className={`w-10 h-6 rounded-full p-0.5 transition-colors shrink-0 ${
          on ? "bg-primary" : "bg-muted"
        }`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-background shadow transition-transform ${
            on ? "translate-x-4" : ""
          }`}
        />
      </div>
    </button>
  );
}

function SuccessTile({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="p-3 rounded-lg bg-success/10 border border-success/30 text-center">
      <Icon className="w-5 h-5 text-success mx-auto mb-1.5" />
      <div className="text-xs font-medium">{title}</div>
    </div>
  );
}
