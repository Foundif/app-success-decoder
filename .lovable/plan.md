## TillTask — Production Readiness Pass

This is a big batch. I'll group it into 7 work items, then end with a frank "what works / what doesn't" status.

### 1. Brand: logo + color palette everywhere

- Save your uploaded TillTask logo as `src/assets/tilltask-logo.png` (full lockup) and `src/assets/tilltask-mark.png` (just the orange T). Use Lovable Assets so it's CDN-served.
- Replace the briefcase/emoji icon currently used as the brand mark in: splash screen, `auth.tsx` header, app header (`routes/index.tsx`), desktop sidebar (`side-nav.tsx`), mobile bottom nav header, onboarding header, pricing header, profile header, PWA manifest icons, and favicon.
- Update color tokens in `src/styles.css` to the logo palette:
  - `--primary` → orange `oklch(0.68 0.19 45)` (the logo orange `#F26B2A`-ish)
  - `--background` → warm off-white `oklch(0.985 0.008 80)` (matches your screenshot's cream)
  - `--foreground` → near-black `oklch(0.18 0.01 60)`
  - `--accent` / ring / sidebar tokens re-derived from the same hue
- Remove any leftover indigo/blue accents from buttons, plan cards, "Most popular" ribbon.

### 2. Splash screen

- Add `src/components/splash-screen.tsx`: full-screen white background, centered TillTask logo, fades out after fonts + first auth check resolve.
- Mount inside `__root.tsx` so it shows on first load (web + installed PWA). Hidden in `<iframe>` preview to avoid flashing in the editor.

### 3. Mobile sidebar drawer

- Add a **double-line hamburger** (two stacked bars icon) on the mobile header in `routes/index.tsx`, `profile.tsx`, `pricing.tsx`.
- Tapping it opens a `Sheet` drawer (shadcn) from the left with: logo header, full menu (Home, Team, Screens, Payroll, Reports, Profile, Pricing for admins), **current plan badge + status indicator** (Active/Trial/Read-only with days left dot), Sign out.
- Bottom nav stays for one-tap access to the 5 primary tabs; the drawer is the "all menus" view.

### 4. Bottom nav on Profile

- Profile route currently uses `SecondaryShell` which only renders desktop sidebar. Wrap it so on mobile the bottom nav from `AppShell` is still shown. Same fix for `/pricing`.

### 5. Pricing rework (per-user, monthly + yearly)

New plans matching your reference table (per user):

| Plan | Monthly | Yearly (save 20%) | Staff cap | Best for |
|---|---|---|---|---|
| Starter | ₹149/user/mo | ₹1,428/user/yr | up to 10 | Small teams |
| Growth | ₹249/user/mo | ₹2,388/user/yr | up to 50 | Growing companies |
| Scale | ₹399/user/mo | ₹3,828/user/yr | up to 200 | Large teams |
| Enterprise | Custom | Custom | unlimited | 100+ employees ("Contact sales") |

- Database migration: replace rows in `plans` (starter/growth/scale/enterprise), add `price_inr_yearly`, `billing_cycle` column on `subscriptions`, update feature flags to match your comparison table (web/app tracking, project tracking, export reports, payroll reports, API access, priority support, dedicated AM).
- Pricing page: monthly/yearly toggle (yearly highlights "Save 20%"), 4 cards, full feature comparison table below on desktop / accordion on mobile.
- Razorpay order amount = `price_inr_monthly × seats` or `price_inr_yearly × seats` based on toggle and current staff count. Enterprise card opens a `mailto:` instead of checkout.
- `usePlan` feature matrix updated: Starter (10 staff, basic reports, screenshots every 10min, no payroll/export), Growth (50, advanced reports, every 5min, payroll, export), Scale (200, + project tracking, API), Enterprise (unlimited, + dedicated AM).

### 6. Payroll fixes (INR, actually compute)

- Replace every `USD` literal and `$` symbol in payroll UI with `formatINR()` from `src/lib/format.ts`. Symptom in your screenshot is "USD 0.00" — that's a hard-coded label.
- `salary.functions.ts` (or wherever `calculatePayroll` lives): ensure it reads `monthly_salary_inr` from `profiles`, totals from `attendance.active_seconds`, writes rows to `salary_records`. Currently the calculate button runs but returns zero because (a) no employees have a salary set and (b) the aggregate query filters by `currency='USD'`. I'll drop the currency filter, default new staff to ₹0 with an editable salary field on the staff edit form, and recompute.
- Add a "Set monthly salary" inline editor on each row of the payroll table.

### 7. Screen recording clip requests (make it real)

Current state: `request_clip` row gets inserted, but nothing on the staff side picks it up and no clip ever lands. Fixes:

- Staff client (`capture.ts`): subscribe via Supabase realtime to `clip_requests` where `user_id = me AND status='pending'`. On a new request, capture the last N seconds from the in-memory ring buffer (already used for screenshots), upload to the `recordings` storage bucket as `webm`, insert a row into `recording_clips` with the storage path, mark the request `fulfilled`.
- Owner UI: new "Clips" panel under Screens tab listing pending/fulfilled clips for each staff with an inline `<video>` player (signed URL, 1h expiry). "Request clip" button stays; now it also shows status (pending → uploading → ready).
- Migration: `recording_clips` table (user_id, company_id, storage_path, duration_seconds, created_at), storage bucket `recordings` (private, RLS so only same-company admins can read).

---

### Production-readiness status (after this batch)

**Fully functional**
- Auth (email + Google), onboarding, company creation, invite codes (single shared code per company)
- Role-based routing, RLS on all tables
- Staff clock-in/clock-out with persistent timer across reloads
- Screenshot capture every N min, stored in `screenshots` bucket, visible to admin
- Razorpay live checkout (orders, signature verify, webhook)
- PWA installable, splash screen, manifest, icons
- Responsive shell (desktop sidebar, mobile bottom nav + drawer)
- Plan gating (staff cap enforced on invite, payroll/reports tabs hidden on Starter)
- INR everywhere, payroll calculation, clip request → fulfilled flow

**Not yet production-ready (out of scope for this turn)**
- **Email notifications** — no transactional email on invite, clip ready, trial ending, payment failure. Needs Resend or similar.
- **Push notifications** — PWA only, no FCM/APNS for activity alerts.
- **Audit log UI** — rows are written, but no admin-facing viewer.
- **Reports export** — feature flag exists, CSV/PDF export not implemented.
- **Project tracking** — listed in pricing, no projects table or UI yet.
- **API access** (Scale+) — no public API keys / docs.
- **Dispute / refund flow** for Razorpay payments.
- **Geofenced attendance** and **mobile camera selfie clock-in** — not built.
- **Multi-language / i18n** — English only.
- **Production error monitoring** (Sentry) and **rate limiting** on server fns.
- **Backups & data export** for company owners.
- **Legal pages** — Terms, Privacy, Refund policy required for Razorpay live KYC compliance.

Approve and I'll execute steps 1–7 in one batch (one migration for plans + clips, code changes for the rest). Razorpay keys you already added still work.
