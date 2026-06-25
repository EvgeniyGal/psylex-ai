## Why

PsyLex needs a shippable MVP "first look" that demonstrates the product vision end-to-end: a conversion-focused landing page, working authentication, and an admin dashboard for creating mediation sessions and distributing participant credentials. The requirements are defined but no application code exists yet; this change establishes the foundation so stakeholders can see and use the core workflow.

## What Changes

- Bootstrap a Next.js (App Router) application with TypeScript, Tailwind CSS, and shadcn/ui per the agreed stack
- Implement the public landing page (hero, contrast, win-win, how-it-works, footer) aligned with Stitch design references
- Set up PostgreSQL on Neon with Drizzle ORM, versioned migrations, and core `users` / `sessions` schema
- Implement custom NextAuth login (login + plain-text password, no hashing for MVP)
- Build admin dashboard with Settings (placeholder), Sessions, and Mediators tabs
- Session creation auto-generates plaintiff and defendant users with `psylex_<UUID>` logins and random passwords
- Mediator creation with auto-generated credentials linked to a session
- Add `title` and `description` metadata for sessions and participants (plaintiff, defendant, mediator)
- Copy Credentials and Share / Magic Link actions for each generated participant
- Cache Stitch design assets (screenshots + HTML) under `docs/stitch/` as implementation reference
- Bilingual copy (English + Ukrainian) on the landing page per requirements

## Capabilities

### New Capabilities

- `landing-page`: Public marketing page with hero, attorney-vs-PsyLex contrast, win-win-win section, dual-mode how-it-works, and footer
- `authentication`: Custom NextAuth login using auto-generated `psylex_<UUID>` logins and plain-text password verification
- `admin-dashboard`: Authenticated admin shell with tab navigation (Settings, Sessions, Mediators)
- `session-management`: Session CRUD, auto-creation of plaintiff/defendant users, title/description management, credential display, copy, and share actions
- `mediator-management`: Admin flow to create mediators with auto-generated credentials and participant title/description bound to a session
- `data-persistence`: PostgreSQL schema (users, sessions) including title/description metadata, Drizzle ORM models, relations, and versioned migrations

### Modified Capabilities

<!-- No existing specs in openspec/specs/ -->

## Impact

- **New codebase**: Greenfield Next.js app (`app/`, `components/`, `lib/`, `drizzle/`)
- **Database**: Neon PostgreSQL instance with `users` and `sessions` tables; plain-text `password` column (MVP only)
- **Dependencies**: Next.js, NextAuth, Drizzle ORM, Tailwind, shadcn/ui, React Hook Form, Zod, Sonner
- **Design reference**: Google Stitch project `4139161588628616929` — landing, admin screens, logo, prism art, design system
- **Security note**: Plain-text passwords and no permission model beyond `role` field are intentional MVP shortcuts documented as non-goals
