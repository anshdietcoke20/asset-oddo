# AssetFlow — Build Plan

Enterprise Asset & Resource Management System (Odoo hackathon brief). Source docs: `AssetFlow problem statement.pdf` (features/roles/workflows) + `DESIGN.md` (Binance-style visual system — dark canvas, yellow `#FCD535` CTAs, BinanceNova/BinancePlex-style type, flat card surfaces).

## Stack decisions (locked in)

- **Framework**: Next.js 16.2.10 (App Router) + React 19 + TypeScript — already scaffolded in `app/`. Must re-check `node_modules/next/dist/docs/01-app` for this version's breaking changes (params/cookies/headers async-ness, route handler signatures, middleware syntax) *before* writing the first route handler, since AGENTS.md flags this version as non-standard.
- **Database**: Postgres via Neon or Supabase (free tier) + Prisma ORM. Waiting on `DATABASE_URL` from the user — this blocks Section 0 migrations but not scaffolding.
- **Auth**: Custom — bcrypt password hashes, signed httpOnly session cookie (stateless, no DB session table). Signup always creates an `EMPLOYEE`; only Admin can promote to `DEPARTMENT_HEAD` / `ASSET_MANAGER` from the Employee Directory (per spec — no self-elevation).
- **Styling**: Tailwind v4, theme tokens (colors/type/radii/spacing) translated 1:1 from `DESIGN.md` into `tailwind.config` / `globals.css` `@theme`. Dark canvas as the default app shell (matches "product dashboard" framing in DESIGN.md), yellow reserved for primary actions only, trading-green/red repurposed semantically for Available/Overdue-style status pills where it reads naturally — but not for generic success/error (per DESIGN.md "Don't" rules), which get their own neutral tokens.
- **Testing**: Vitest for business-logic units (overlap detection, allocation-conflict guard, RBAC helpers) + the `/verify` skill (drive the real dev server) as the manual gate before every PR. A small Playwright smoke suite (login, allocate-conflict, booking-overlap) gets added in the final polish section.
- **File uploads** (asset/maintenance photos): deferred decision — revisit when the Assets section starts. Default plan: Vercel Blob if deploying to Vercel; fallback to local `/public/uploads` (dev-only) if we stay local-first for the hackathon demo.
- **Deployment**: Vercel (README already references it). Confirmed later in the polish section.

## Assumptions (flag if wrong)

1. **Single-tenant**: one AssetFlow instance = one organization. "Organization Setup" (Screen 3) configures *the* org's departments/categories/directory, not a multi-org switcher.
2. **Bootstrap admin**: since signup can never create an Admin, a seed script creates exactly one initial Admin account (fixed dev credentials, documented in README) — mirrors a real "IT provisions the first admin" flow rather than a hidden "first signup = admin" rule.
3. **Asset status is a single field**: maintenance approval sets `status = UNDER_MAINTENANCE` regardless of prior allocation state; resolution sets it back to `AVAILABLE` — matches the spec's literal transition examples (`Allocated → Available`, `Available ↔ Under Maintenance`) rather than modeling allocation and maintenance as independent concurrent states.
4. **Resources = Assets with `isShared = true`**: no separate Resource table — Screen 4's "shared/bookable flag" is what makes an asset show up in the Screen 6 booking calendar.
5. **Forgot-password** sends a reset token; actual email delivery falls back to console-logging the link in dev if no email provider key is configured (no blocking external signup required to keep building).

## Data model (Prisma, Postgres) — built in Section 0

```
Employee        id, name, email, passwordHash, role[ADMIN|ASSET_MANAGER|DEPARTMENT_HEAD|EMPLOYEE],
                 departmentId?, status[ACTIVE|INACTIVE], createdAt
Department       id, name, headId?(Employee), parentDepartmentId?(self), status[ACTIVE|INACTIVE]
AssetCategory     id, name, extraFields(Json?)            // e.g. warranty period schema
Asset             id, assetTag(auto AF-0001), name, categoryId, serialNumber, acquisitionDate,
                  acquisitionCost, condition, location, photos(String[]), isShared,
                  status[AVAILABLE|ALLOCATED|RESERVED|UNDER_MAINTENANCE|LOST|RETIRED|DISPOSED]
AssetAllocation   id, assetId, employeeId?, departmentId?, allocatedAt, expectedReturnDate?,
                  returnedAt?, conditionCheckinNotes?, status[ACTIVE|RETURNED]
TransferRequest   id, assetId, requestedById, toEmployeeId?, toDepartmentId?,
                  status[REQUESTED|APPROVED|REJECTED], approvedById?, createdAt, resolvedAt?
Booking           id, assetId, bookedById, onBehalfOfDepartmentId?, startTime, endTime,
                  status[UPCOMING|ONGOING|COMPLETED|CANCELLED], purpose?
MaintenanceRequest id, assetId, raisedById, issueDescription, priority, photoUrl?,
                  status[PENDING|APPROVED|REJECTED|TECHNICIAN_ASSIGNED|IN_PROGRESS|RESOLVED],
                  approvedById?, technicianName?, resolutionNotes?, createdAt, resolvedAt?
AuditCycle        id, name, scopeDepartmentId?, scopeLocation?, startDate, endDate,
                  status[OPEN|CLOSED], createdById
AuditCycleAuditor  auditCycleId, employeeId                // M:N
AuditItem         id, auditCycleId, assetId, result[PENDING|VERIFIED|MISSING|DAMAGED],
                  notes?, verifiedById?, verifiedAt?
Notification      id, userId, type, message, entityType?, entityId?, isRead, createdAt
ActivityLog       id, actorId, action, entityType, entityId, metadata(Json?), createdAt
```

## How we'll work (per section)

1. `git checkout main && git pull`, then `git checkout -b <section-branch>`.
2. Implement the section end to end (schema + server logic + UI, styled per `DESIGN.md`).
3. Add/extend Vitest coverage for the section's business rules; run `npm run lint` + `npm run build`.
4. Run the `/verify` skill against the live dev server to confirm the golden path and edge cases actually work — not just that tests pass.
5. Show you a summary + how to try it locally; wait for your explicit approval.
6. `gh pr create --base main` — you review/approve on GitHub (or tell me here to merge).
7. Merge via `gh pr merge`, then `git checkout main && git pull`.
8. **Commit/PR hygiene**: plain, human-style commit messages and PR bodies — no "Co-Authored-By: Claude", no "Generated with Claude Code" footers, no AI attribution anywhere.

## Sections / branches

- [ ] **0. `foundation`** — Prisma schema + migrations against the Postgres `DATABASE_URL`; Tailwind theme from `DESIGN.md` tokens; base UI kit (Button, Input, Card, Badge, Table, Modal, Toast) matching `button-primary`, `text-input-on-light`, `markets-table-card`-style surfaces etc.; app shell (top nav + role-aware side nav); `logActivity()` + `notify()` shared utilities used by every later section; seed script (1 bootstrap Admin + light demo data). *No user-facing screens beyond a shell yet.*
- [ ] **1. `auth`** — Screen 1: signup (employee-only), login, logout, forgot/reset password, session cookie + middleware route protection, role-based post-login redirect.
- [ ] **2. `org-setup`** — Screen 3 (Admin-only, 3 tabs): Departments (create/edit/deactivate, head assignment, parent hierarchy), Asset Categories (+ optional category-specific fields), Employee Directory (promote to Department Head / Asset Manager — the only place roles are assigned).
- [ ] **3. `assets`** — Screen 4: register assets (auto asset tag, category, cost, condition, location, photos, shared/bookable flag), search/filter (tag, serial, category, status, dept, location), per-asset history (allocation + maintenance timeline).
- [ ] **4. `allocation`** — Screen 5: allocate to employee/department with conflict blocking + "currently held by X" + Transfer Request button, transfer approval workflow, return flow with condition check-in notes, auto-flagged overdue allocations.
- [ ] **5. `booking`** — Screen 6: resource calendar view, time-slot overlap validation, booking statuses, cancel/reschedule, pre-slot reminder notification.
- [ ] **6. `maintenance`** — Screen 7: raise request (asset, issue, priority, photo), approval workflow, asset status auto-transitions, maintenance history per asset.
- [ ] **7. `audit`** — Screen 8: create audit cycle (scope + date range), assign auditors, per-asset Verified/Missing/Damaged marking, auto-generated discrepancy report, close cycle (locks + updates statuses, e.g. confirmed-missing → Lost).
- [ ] **8. `dashboard-and-activity`** — Screen 2 + Screen 10: KPI dashboard (assets available/allocated, maintenance today, active bookings, pending transfers, upcoming/overdue returns) with quick actions; notifications feed; full activity log. (Logging/notify calls were wired into every prior section as they were built — this section is mostly the display layer.)
- [ ] **9. `reports`** — Screen 9: utilization trends, most-used vs idle assets, maintenance frequency by asset/category, assets due for maintenance/retirement, department allocation summary, booking heatmap, CSV export.
- [ ] **10. `polish-and-deploy`** — responsive QA pass across breakpoints (per `DESIGN.md` responsive rules), Playwright smoke suite (login, allocation conflict, booking overlap), env/README docs, Vercel deploy configuration and a live deploy check.

## Open item before Section 0 can finish

- [ ] Waiting on `DATABASE_URL` (Neon or Supabase Postgres connection string) from the user.
