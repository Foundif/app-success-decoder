This is a multi-area change — here's a focused plan before I touch code.

## 1. Responsive app shell (desktop sidebar + mobile bottom nav)
Today `src/routes/index.tsx` ships only a fixed bottom nav, so desktop shows the mobile UI. I'll add a responsive `AppShell`:

- **≥ lg**: collapsible left sidebar (shadcn `Sidebar`) with the same tabs (Home / Team / Screens / Payroll / Reports + Profile + Pricing). Top header keeps logo, notifications, user, logout.
- **< lg**: keep current bottom nav, add a **Profile** entry for staff (currently missing for employees on the bottom bar).
- The sidebar/header also renders when the user is on `/pricing` and `/profile`, so those pages are no longer "naked" on desktop. I'll extract a shared `<AppLayout>` and wrap those routes.

## 2. Onboarding fixes
- **Don't re-show after completion**: `HomeGate` currently routes admins to `/onboarding` whenever `companyId` is set but `onboarding_completed` is false. I'll check the existing `companies.onboarding_completed` flag (set by `completeOnboarding`) and only redirect when it's actually false; once true, never redirect again.
- **Mobile responsiveness**: tighten the stepper (already a horizontal scroller) and the step cards — full-bleed on mobile, larger tap targets, single-column form on xs, sticky bottom action bar so Continue is always reachable.

## 3. Persistent clock-in timer (staff)
Right now `seconds` lives in component state and resets on navigation. Fix:
- On mount, read today's `attendance` row; if `clock_in` is set and `clock_out` is null, restore `tracking=true`, `attendanceId`, and seed `seconds` from `Date.now() - clock_in` (plus `active_seconds` already saved).
- Persist `active_seconds` every 30s so a reload doesn't lose progress.
- The screen-capture session still needs a fresh user gesture after navigation (browser security), so I'll show a "Resume recording" pill that re-prompts permission without resetting the timer.

## 4. Staff profile in bottom nav
Add a **Profile** tab to the employee bottom nav that routes to `/profile` (already exists). Same entry in the desktop sidebar.

## 5. Plan-gated features
Enforce Starter / Growth / Business limits from `plans` + `subscriptions`:
- New `usePlan()` hook returns `{ plan, features, staffLimit, withinTrial }`.
- Feature matrix:
  - **Starter (₹499)**: up to 5 staff, attendance + time tracking, activity alerts, screen recording (1 fps + clips). No payroll, no audit log, no advanced reports.
  - **Growth (₹1,499)**: up to 25 staff, + payroll basics + reports.
  - **Business (₹3,999)**: unlimited + audit log + manual entry.
- Enforcement:
  - Invite code generation refuses when staff count ≥ limit (server-side in `invite.functions.ts` + `onboarding.functions.ts`).
  - Payroll tab and Audit log hidden / show upgrade card when plan < required.
  - Capture session checks plan flag before starting.
- Read-only after trial: unchanged from prior turn, just plug `usePlan().readOnly` into the same gates.

## 6. PWA (installable)
- Add `vite-plugin-pwa` with `registerType: "autoUpdate"`, manifest (name "TillTask", theme `#F97316`, icons 192/512/maskable), and a guarded registration wrapper that **skips registration in Lovable preview / dev / iframe** (per the PWA skill — otherwise the editor preview breaks).
- Add `<InstallPrompt />` component that listens for `beforeinstallprompt`, stashes the event, and renders a dismissible "Install TillTask" banner on `/` for staff + admin once they're signed in. iOS gets a one-time "Add to Home Screen" hint.
- Generate 192/512 maskable icons from the existing briefcase mark.

## Out of scope for this turn
- New Razorpay flows (already in place).
- Backend salary recalculation changes.

## Technical notes
- Sidebar uses shadcn `Sidebar` with `collapsible="icon"`, `w-[var(--sidebar-width)]` (Tailwind v4 fix).
- `usePlan` queries `subscriptions` joined with `plans` via existing `billing.functions.ts`; cached in React Query.
- Timer persistence uses existing `attendance` columns; no migration needed.
- PWA registration lives in `src/lib/pwa.ts` and is called from `__root.tsx` inside a `useEffect`.

Confirm and I'll implement, or tell me which sections to drop / reorder.