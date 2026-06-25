## Context

PsyLex is a greenfield project with requirements documented in `requirements/` but no application code yet. The MVP "first look" must deliver a public landing page, admin authentication, and session/mediator management backed by PostgreSQL on Neon. UI designs exist in Google Stitch project **PsyLex Human-Centric Landing Page** (ID `4139161588628616929`) and should be cached locally under `docs/stitch/` before implementation.

**Stack** (from `requirements/fs-postgresql.md`):
- Next.js App Router, TypeScript strict, Server Components + Server Actions
- Tailwind CSS, shadcn/ui, Radix UI, lucide-react
- React Hook Form + Zod for forms
- NextAuth.js (credentials provider, plain-text password)
- Drizzle ORM + Neon PostgreSQL
- Sonner for toasts

## Goals / Non-Goals

**Goals:**

- Ship a visually polished landing page matching Stitch designs with EN/UK copy
- Bootstrap Next.js app with full stack wiring (auth, DB, admin shell)
- Admin can create sessions (auto plaintiff + defendant) and mediators with visible credentials
- Copy / Share credential actions for all generated participants
- Versioned Drizzle migrations with manual admin provisioning in database

**Non-Goals:**

- Password hashing, reset, or email delivery
- Messenger integrations (Share uses Web Share API or clipboard fallback)
- Permission model beyond `role` field check for admin routes
- Mode A / Mode B actual conflict-resolution workflows (landing CTAs route to login only)
- Multi-session mediator assignment, audit logs, notifications, advanced settings

## Decisions

### 1. Monolithic Next.js app

**Decision:** Single Next.js application with App Router — public routes at `/`, admin at `/admin/*`, auth at `/login`.

**Rationale:** Requirements specify Server Actions and Route Handlers only where needed; no separate API service. Simplest path for MVP.

**Alternatives:** Separate frontend/backend — rejected as over-engineering for scope.

### 2. Stitch assets as design source of truth

**Decision:** Download and cache Stitch screenshots + HTML to `docs/stitch/` before building UI. Implement React components that replicate Stitch layouts using Tailwind/shadcn tokens extracted from the design system screen.

**Stitch project reference:**

| Asset | Screen ID | Local filename | Purpose |
|-------|-----------|----------------|---------|
| Prism hero art | `439cef063c644a748e736da04ec6ac28` | `prism-concept.png` | Hero visual metaphor |
| Logo | `6a083dbbd6704172a6dd7124e35f29f5` | `logo.png` | Brand mark |
| Design System | `asset-stub-assets_3ff8f14bec7d444e8876edaff18e1443` | `design-system.html` + `.png` | Colors, typography, spacing tokens |
| Landing page | `10542681353879881039` | `landing-how-it-works.html` + `.png` | Full landing layout reference |
| Admin Settings | `c1d10cd876204d948c6f251dce359da5` | `admin-settings.html` + `.png` | Settings tab placeholder |
| Admin Sessions | `f3c62eb393d74211b14458d98342016d` | `admin-sessions.html` + `.png` | Sessions tab layout |
| Admin Mediators | `27c3a600e85a40fc8824fb686d3f7501` | `admin-mediators.html` + `.png` | Mediators tab layout |

**Download method:** Call Stitch MCP `get_screen` with `name: projects/4139161588628616929/screens/{screenId}`, then `curl -L` the `htmlCode.downloadUrl` and `screenshot.downloadUrl` from the response. Requires `STITCH_API_KEY` or Stitch MCP configured in Cursor.

### 3. Database schema (Drizzle)

```text
sessions
  id          UUID PK DEFAULT gen_random_uuid()
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()

users
  id          UUID PK DEFAULT gen_random_uuid()
  login       TEXT NOT NULL UNIQUE
  password    TEXT NOT NULL
  role        user_role NOT NULL  -- enum: admin | mediator | plaintiff | defendant
  session_id  UUID REFERENCES sessions(id) ON DELETE SET NULL
```

**Login generation:** `psylex_` + `crypto.randomUUID()`.
**Password generation:** 12-character alphanumeric random string.

### 4. NextAuth credentials provider

**Decision:** Custom Credentials provider that looks up user by `login`, compares `password` as plain string, and puts `{ id, login, role }` in JWT/session.

**Rationale:** Explicit MVP requirement for plain-text storage.

**Middleware:** `middleware.ts` protects `/admin/*` — requires session with `role === 'admin'`.

### 5. Admin dashboard structure

```text
app/
  (public)/
    page.tsx              # Landing page
    login/page.tsx        # Admin login
  admin/
    layout.tsx            # Sidebar/tab shell
    settings/page.tsx     # Placeholder
    sessions/page.tsx     # Session list + create
    mediators/page.tsx    # Mediator create + list
```

**Server Actions** in `app/admin/sessions/actions.ts` and `app/admin/mediators/actions.ts` for mutations. Revalidate paths after create.

### 6. Credential copy/share UX

**Copy:** `navigator.clipboard.writeText()` with Sonner toast.

**Share:** Try `navigator.share({ text })` first; on unsupported browsers, fall back to clipboard copy with toast "Copied for sharing".

### 7. i18n approach for landing page

**Decision:** Use locale detection from browser language on first visit, then allow manual locale switching (`en`/`uk`) with the selected locale persisted in `localStorage`. Admin UI remains English for MVP.

**Rationale:** Requirements specify bilingual landing content and explicit user control over language preference.

### 8. Landing CTA destination

**Decision:** Both landing CTAs ("Start on my own" and "For Mediators →") route to `/login`.

**Rationale:** MVP has one implemented entry flow (authentication) and no separate onboarding yet.

### 9. Visual metaphor implementation

**Decision:** Use the Stitch prism image as hero background/element with CSS subtle animation (opacity pulse or slow gradient shift on the convergence glow). Avoid heavy canvas/WebGL for MVP.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Plain-text passwords | Documented non-goal; restrict admin access; plan hashing for v2 |
| Stitch HTML uses inline Tailwind that may not map 1:1 to shadcn | Extract design tokens from design-system screen; build components manually rather than pasting HTML |
| No RBAC beyond role enum | Admin middleware checks `role === 'admin'` only |
| Web Share API unavailable on desktop | Clipboard fallback always available |
| Stitch MCP auth not configured in CI | Cache assets in repo under `docs/stitch/` during setup task |

## Migration Plan

1. Create Neon database and set `DATABASE_URL`
2. Run `drizzle-kit push` or `drizzle-kit migrate` for initial schema
3. Manually create one admin user directly in the database (`role = 'admin'`)
4. Deploy to Vercel (or similar) with env vars: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
5. No data migration — greenfield

## Open Questions

- None for current MVP scope.
