import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  Briefcase,
  FileText,
  Crown,
  Gift,
  Bell,
  ChevronRight,
  Loader2,
  Palette,
  Image as ImageIcon,
  LogOut,
  User,
  Phone,
  Mail,
  Calendar,
  Wallet,
  Edit3,
  Camera,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { getCompanyProfile, updateCompanyProfile, updateMyProfile } from "@/lib/profile.functions";
import { getBillingStatus } from "@/lib/billing.functions";
import { formatINR } from "@/lib/format";
import { SecondaryShell } from "@/components/side-nav";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — TillTask" }] }),
  component: ProfilePage,
});

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading, profile, companyId, isAdmin, signOut, refresh } = useAuth();
  const fetchCompany = useServerFn(getCompanyProfile);
  const fetchBilling = useServerFn(getBillingStatus);
  const saveCompany = useServerFn(updateCompanyProfile);
  const saveMe = useServerFn(updateMyProfile);

  const [company, setCompany] = useState<any>(null);
  const [billing, setBilling] = useState<any>(null);
  const [editing, setEditing] = useState<null | "agency" | "branding" | "policy" | "personal">(null);
  const [draft, setDraft] = useState<any>({});
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchCompany().then(setCompany).catch(() => {});
    fetchBilling().then(setBilling).catch(() => {});
  }, [user, companyId]);

  function openEdit(which: typeof editing) {
    setEditing(which);
    setDraft(which === "personal" ? { ...profile } : { ...company });
  }

  async function save() {
    if (!editing) return;
    setBusy(true);
    try {
      if (editing === "personal") {
        await saveMe({
          data: {
            full_name: draft.full_name ?? undefined,
            phone: draft.phone ?? null,
            job_title: draft.job_title ?? null,
            department: draft.department ?? null,
            avatar_url: draft.avatar_url ?? null,
          },
        });
        await refresh();
      } else {
        if (!companyId) throw new Error("No company");
        const payload: any = { companyId };
        if (editing === "agency") {
          Object.assign(payload, {
            name: draft.name,
            tagline: draft.tagline ?? null,
            industry: draft.industry ?? null,
            phone: draft.phone ?? null,
            website: draft.website ?? null,
            address: draft.address ?? null,
            city: draft.city ?? null,
            state: draft.state ?? null,
            postal_code: draft.postal_code ?? null,
            gst_number: draft.gst_number ?? null,
            pan_number: draft.pan_number ?? null,
          });
        } else if (editing === "branding") {
          Object.assign(payload, {
            logo_url: draft.logo_url ?? null,
            brand_color: draft.brand_color ?? null,
          });
        } else if (editing === "policy") {
          Object.assign(payload, {
            work_hours_per_day: Number(draft.work_hours_per_day) || 8,
            weekly_off_days: draft.weekly_off_days ?? [0],
            holidays: draft.holidays ?? [],
          });
        }
        await saveCompany({ data: payload });
        const fresh = await fetchCompany();
        setCompany(fresh);
      }
      toast.success("Saved");
      setEditing(null);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function uploadFile(bucket: "avatars" | "logos", field: string) {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f || !user) return;
      setUploading(true);
      try {
        const ext = f.name.split(".").pop() ?? "png";
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from(bucket).upload(path, f, {
          upsert: true,
          contentType: f.type,
        });
        if (error) throw error;
        const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 365);
        setDraft((d: any) => ({ ...d, [field]: signed?.signedUrl ?? null }));
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setUploading(false);
      }
    };
    input.click();
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const displayName = isAdmin
    ? company?.name ?? "Your Company"
    : profile?.full_name ?? "Your Profile";
  const subline = isAdmin
    ? profile?.email ?? user.email
    : profile?.job_title ?? profile?.email ?? "";
  const avatarLetter = (displayName ?? "U").trim()[0]?.toUpperCase() ?? "U";
  const brand = company?.brand_color || "#0F172A";

  return (
    <SecondaryShell active="profile">
    <div className="min-h-screen bg-muted/30">

      <header className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
          <Link to="/" className="p-2 -ml-2 rounded-md hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-semibold truncate">{isAdmin ? "Business profile" : "My profile"}</h1>
          <Button variant="ghost" size="sm" onClick={() => signOut()}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pt-8 pb-24">
        {/* Avatar block */}
        <div className="text-center mb-6">
          <div className="inline-block relative">
            {isAdmin && company?.logo_url ? (
              <img
                src={company.logo_url}
                alt=""
                className="w-24 h-24 rounded-full object-cover shadow-md"
              />
            ) : !isAdmin && profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="w-24 h-24 rounded-full object-cover shadow-md"
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full grid place-items-center text-3xl font-bold text-white shadow-md"
                style={{ background: brand }}
              >
                {avatarLetter}
              </div>
            )}
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight">{displayName}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{subline}</p>
          <Button
            className="mt-4 rounded-full px-6"
            onClick={() => openEdit(isAdmin ? "agency" : "personal")}
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit profile
          </Button>
        </div>

        {isAdmin ? (
          <>
            <SectionLabel>BUSINESS</SectionLabel>
            <SectionCard>
              <Row
                icon={Building2}
                title="Agency details"
                sub={[company?.phone, company?.industry].filter(Boolean).join(" · ") || "Add contact & GST"}
                onClick={() => openEdit("agency")}
              />
              <Row
                icon={Palette}
                title="Branding"
                sub={company?.logo_url ? "Logo & brand color set" : "Add logo, set brand color"}
                onClick={() => openEdit("branding")}
              />
              <Row
                icon={FileText}
                title="Work policy"
                sub={`${company?.work_hours_per_day ?? 8}h/day · ${(company?.weekly_off_days ?? [0]).map((d: number) => WEEKDAYS[d]).join(", ")} off`}
                onClick={() => openEdit("policy")}
              />
            </SectionCard>

            <SectionLabel>PLAN</SectionLabel>
            <SectionCard>
              <Row
                icon={Crown}
                title={billing?.status === "active" ? `${billing.plan?.toUpperCase()} plan` : "Upgrade your plan"}
                sub={
                  billing?.status === "active"
                    ? `Renews in ${billing.daysLeft} days`
                    : billing?.status === "trial"
                      ? `Trial ends in ${billing.daysLeft} day${billing.daysLeft === 1 ? "" : "s"}`
                      : "Trial expired — read-only mode"
                }
                badge={billing?.status === "active" ? "PRO" : undefined}
                onClick={() => navigate({ to: "/pricing" })}
              />
              <Row
                icon={Gift}
                title="Refer & earn credits"
                sub="Coming soon"
                onClick={() => toast.info("Referral program launching soon")}
              />
            </SectionCard>
          </>
        ) : (
          <>
            <SectionLabel>PERSONAL</SectionLabel>
            <SectionCard>
              <Row icon={User} title="Full name" sub={profile?.full_name ?? "—"} onClick={() => openEdit("personal")} />
              <Row icon={Mail} title="Email" sub={profile?.email ?? "—"} />
              <Row icon={Phone} title="Phone" sub={profile?.phone ?? "Add phone number"} onClick={() => openEdit("personal")} />
            </SectionCard>

            <SectionLabel>WORK</SectionLabel>
            <SectionCard>
              <Row icon={Briefcase} title="Job title" sub={profile?.job_title ?? "—"} onClick={() => openEdit("personal")} />
              <Row icon={Building2} title="Department" sub={(profile as any)?.department ?? "Not set"} onClick={() => openEdit("personal")} />
              <Row
                icon={Wallet}
                title="Monthly salary"
                sub={
                  (profile as any)?.monthly_salary
                    ? formatINR(Number((profile as any).monthly_salary))
                    : "Set by your admin"
                }
              />
              <Row
                icon={Calendar}
                title="Expected hours"
                sub={`${(profile as any)?.expected_monthly_hours ?? 160}h / month`}
              />
            </SectionCard>
          </>
        )}

        <SectionLabel>PREFERENCES</SectionLabel>
        <SectionCard>
          <Row icon={Bell} title="Notifications" sub="Activity alerts & weekly digest" />
        </SectionCard>

        <p className="text-center text-xs text-muted-foreground mt-8">
          TillTask · v1.0 · © {new Date().getFullYear()}
        </p>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing === "agency" && "Agency details"}
              {editing === "branding" && "Branding"}
              {editing === "policy" && "Work policy"}
              {editing === "personal" && "Personal details"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {editing === "personal" && (
              <>
                <Field label="Full name">
                  <Input value={draft.full_name ?? ""} onChange={(e) => setDraft({ ...draft, full_name: e.target.value })} />
                </Field>
                <Field label="Phone">
                  <Input value={draft.phone ?? ""} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
                </Field>
                <Field label="Job title">
                  <Input value={draft.job_title ?? ""} onChange={(e) => setDraft({ ...draft, job_title: e.target.value })} />
                </Field>
                <Field label="Department">
                  <Input value={draft.department ?? ""} onChange={(e) => setDraft({ ...draft, department: e.target.value })} />
                </Field>
                <Field label="Avatar">
                  <div className="flex items-center gap-3">
                    {draft.avatar_url && <img src={draft.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />}
                    <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => uploadFile("avatars", "avatar_url")}>
                      <Camera className="w-3.5 h-3.5" /> {uploading ? "Uploading…" : "Upload"}
                    </Button>
                  </div>
                </Field>
              </>
            )}

            {editing === "agency" && (
              <>
                <Field label="Company name">
                  <Input value={draft.name ?? ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                </Field>
                <Field label="Tagline">
                  <Input value={draft.tagline ?? ""} onChange={(e) => setDraft({ ...draft, tagline: e.target.value })} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Industry">
                    <Input value={draft.industry ?? ""} onChange={(e) => setDraft({ ...draft, industry: e.target.value })} />
                  </Field>
                  <Field label="Phone">
                    <Input value={draft.phone ?? ""} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
                  </Field>
                </div>
                <Field label="Website">
                  <Input value={draft.website ?? ""} onChange={(e) => setDraft({ ...draft, website: e.target.value })} />
                </Field>
                <Field label="Address">
                  <Textarea rows={2} value={draft.address ?? ""} onChange={(e) => setDraft({ ...draft, address: e.target.value })} />
                </Field>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="City">
                    <Input value={draft.city ?? ""} onChange={(e) => setDraft({ ...draft, city: e.target.value })} />
                  </Field>
                  <Field label="State">
                    <Input value={draft.state ?? ""} onChange={(e) => setDraft({ ...draft, state: e.target.value })} />
                  </Field>
                  <Field label="PIN">
                    <Input value={draft.postal_code ?? ""} onChange={(e) => setDraft({ ...draft, postal_code: e.target.value })} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="GST number">
                    <Input value={draft.gst_number ?? ""} onChange={(e) => setDraft({ ...draft, gst_number: e.target.value.toUpperCase() })} />
                  </Field>
                  <Field label="PAN">
                    <Input value={draft.pan_number ?? ""} onChange={(e) => setDraft({ ...draft, pan_number: e.target.value.toUpperCase() })} />
                  </Field>
                </div>
              </>
            )}

            {editing === "branding" && (
              <>
                <Field label="Company logo">
                  <div className="flex items-center gap-3">
                    {draft.logo_url ? (
                      <img src={draft.logo_url} alt="" className="w-16 h-16 rounded-xl object-cover border" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl border-dashed border-2 grid place-items-center text-muted-foreground">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}
                    <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => uploadFile("logos", "logo_url")}>
                      <Camera className="w-3.5 h-3.5" /> {uploading ? "Uploading…" : "Upload logo"}
                    </Button>
                  </div>
                </Field>
                <Field label="Brand color">
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={draft.brand_color ?? "#0F172A"}
                      onChange={(e) => setDraft({ ...draft, brand_color: e.target.value })}
                      className="w-12 h-10 rounded border cursor-pointer"
                    />
                    <Input
                      value={draft.brand_color ?? ""}
                      onChange={(e) => setDraft({ ...draft, brand_color: e.target.value })}
                      placeholder="#0F172A"
                    />
                  </div>
                </Field>
              </>
            )}

            {editing === "policy" && (
              <>
                <Field label="Working hours per day">
                  <Input
                    type="number"
                    min={1}
                    max={24}
                    step="0.5"
                    value={draft.work_hours_per_day ?? 8}
                    onChange={(e) => setDraft({ ...draft, work_hours_per_day: e.target.value })}
                  />
                </Field>
                <Field label="Weekly off days">
                  <div className="grid grid-cols-7 gap-1.5">
                    {WEEKDAYS.map((d, i) => {
                      const on = (draft.weekly_off_days ?? [0]).includes(i);
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            const set = new Set<number>(draft.weekly_off_days ?? [0]);
                            on ? set.delete(i) : set.add(i);
                            setDraft({ ...draft, weekly_off_days: [...set].sort() });
                          }}
                          className={`py-2 text-xs rounded-md border ${
                            on ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                          }`}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </Field>
                <Field label="Public holidays (one date per line, YYYY-MM-DD)">
                  <Textarea
                    rows={4}
                    value={(draft.holidays ?? []).join("\n")}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        holidays: e.target.value
                          .split("\n")
                          .map((s) => s.trim())
                          .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s)),
                      })
                    }
                  />
                </Field>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={busy}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] tracking-wider font-semibold text-primary/80 uppercase mt-6 mb-2 px-1">
      {children}
    </div>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return <div className="bg-card rounded-2xl shadow-sm border divide-y">{children}</div>;
}

function Row({
  icon: Icon,
  title,
  sub,
  onClick,
  badge,
}: {
  icon: React.ElementType;
  title: string;
  sub?: string;
  onClick?: () => void;
  badge?: string;
}) {
  const Comp: any = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={`w-full grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 text-left ${onClick ? "hover:bg-muted/50 transition-colors" : ""}`}
    >
      <div className="w-9 h-9 rounded-lg bg-muted grid place-items-center shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold truncate">{title}</div>
        {sub && <div className="text-xs text-primary/70 truncate">{sub}</div>}
      </div>
      <div className="flex items-center gap-2">
        {badge && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success text-success-foreground">
            {badge}
          </span>
        )}
        {onClick && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </div>
    </Comp>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
