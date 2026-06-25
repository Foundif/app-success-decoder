import { useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { LogOut, Crown, Sparkles } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { usePlan } from "@/lib/usePlan";
import { BrandLockup } from "@/components/brand";
import { visibleNav, setPendingTab, planDisplay } from "@/lib/nav-items";

/** Double-line hamburger button that opens the full menu drawer on mobile. */
export function MobileMenuTrigger({ children }: { children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { profile, signOut, primaryRole } = useAuth();
  const plan = usePlan();
  const isAdmin = primaryRole !== "employee" && !!primaryRole;
  const items = visibleNav(primaryRole, plan);
  const { label: planLabel, sublabel: planSub } = planDisplay(plan);


  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children ?? (
          <Button
            size="icon"
            variant="ghost"
            className="lg:hidden"
            aria-label="Open menu"
          >
            {/* Double-line hamburger */}
            <div className="flex flex-col gap-[5px]">
              <span className="block w-5 h-[2px] bg-foreground rounded-full" />
              <span className="block w-5 h-[2px] bg-foreground rounded-full" />
            </div>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-3 border-b">
          <SheetTitle className="text-left">
            <BrandLockup className="h-7" />
          </SheetTitle>
          <SheetDescription className="text-left text-xs">
            {isAdmin ? "Business Operations" : "Team Member"}
          </SheetDescription>
        </SheetHeader>

        {/* Plan status card */}
        {isAdmin && (
          <div className="px-4 pt-3">
            <div className="rounded-2xl border bg-muted/40 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      plan.isActive ? "bg-success" : "bg-destructive"
                    }`}
                  />
                  <Crown className="w-4 h-4 text-primary" />
                  {planLabel} plan
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {planSub}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1 truncate">{profile?.email}</div>
              {(plan.readonly || !plan.tier || plan.status === "trial") && (
                <button
                  onClick={() => {
                    setOpen(false);
                    navigate({ to: "/pricing" });
                  }}
                  className="mt-2 w-full inline-flex items-center justify-center gap-1.5 bg-foreground text-background rounded-xl py-2 text-xs font-semibold hover:opacity-90 transition"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Upgrade
                </button>
              )}
            </div>
          </div>
        )}

        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {items.map((it) => {
            const Icon = it.icon;
            return (
              <button
                key={it.id}
                onClick={() => {
                  setOpen(false);
                  if (it.tab) setPendingTab(it.tab);
                  navigate({ to: it.to });
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[15px] font-medium text-foreground hover:bg-muted/70 transition-colors"
              >
                <Icon className="w-5 h-5 shrink-0 text-muted-foreground" />
                <span className="truncate">{it.label}</span>
              </button>
            );
          })}
        </nav>


        <div className="p-3 border-t space-y-2">
          <div className="px-2 py-2 text-xs text-muted-foreground truncate">
            {profile?.full_name ?? profile?.email}
          </div>
          <button
            onClick={async () => {
              setOpen(false);
              await signOut();
              navigate({ to: "/auth" });
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border bg-card hover:bg-muted transition"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
