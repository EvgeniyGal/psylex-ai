## 1. Stitch Design Assets

- [x] 1.1 Create `docs/stitch/` directory and `docs/stitch/reference.md` index
- [x] 1.3 Document extracted design tokens (colors, fonts, spacing) in `docs/stitch/reference.md` from design-system assets

## 2. Project Bootstrap

- [x] 2.1 Initialize Next.js App Router project with TypeScript strict mode
- [x] 2.2 Install and configure Tailwind CSS, shadcn/ui, lucide-react, Sonner
- [x] 2.3 Add environment variable template (`.env.example`) with `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- [x] 2.4 Configure project structure: `app/`, `components/`, `lib/`, `drizzle/`

## 3. Database Layer

- [x] 3.1 Define Drizzle schema for `sessions` and `users` tables with `user_role` enum
- [x] 3.2 Add `title` and `description` columns to `sessions` and participant users (plaintiff/defendant/mediator)
- [x] 3.3 Set up Drizzle config and Neon PostgreSQL connection in `lib/db.ts`
- [x] 3.4 Generate and commit initial migration
- [x] 3.5 Create `lib/generate-credentials.ts` with `psylex_<UUID>` login and random password helpers
- [x] 3.6 Document manual SQL steps to create initial admin user directly in DB

## 4. Authentication

- [x] 4.1 Configure NextAuth credentials provider with plain-text password lookup
- [x] 4.2 Add session callback to expose `role` in JWT/session
- [x] 4.3 Build `/login` page with React Hook Form + Zod validation
- [x] 4.4 Add middleware protecting `/admin/*` for `admin` role only

## 5. Landing Page

- [x] 5.1 Set up i18n for landing page (EN/UK message files) with browser locale detection
- [x] 5.2 Build hero section with prism visual, headlines, and CTA buttons
- [x] 5.3 Route both hero CTAs to `/login`
- [x] 5.4 Add manual locale switcher (`en`/`uk`) and persist selection to `localStorage`
- [x] 5.5 Build attorney vs PsyLex contrast section (two-column layout)
- [x] 5.6 Build win-win-win section with three benefit cards
- [x] 5.7 Build how-it-works section (Mode A and Mode B steps)
- [x] 5.8 Build footer with logo, nav links, copyright, and disclaimer
- [x] 5.9 Apply Stitch design tokens and verify visual match against cached screenshots

## 6. Admin Dashboard Shell

- [x] 6.1 Create `/admin/layout.tsx` with tab navigation (Settings, Sessions, Mediators)
- [x] 6.2 Build Settings placeholder page matching Stitch admin-settings design
- [x] 6.3 Apply shared admin styling from Stitch design system

## 7. Session Management

- [x] 7.1 Create server action to create session with auto plaintiff + defendant users
- [x] 7.2 Build Sessions page listing all sessions with participants and timestamps
- [x] 7.3 Add and edit session `title` and `description` in Sessions UI
- [x] 7.4 Add and edit plaintiff/defendant `title` and `description` in participant cards
- [x] 7.5 Display role, login, password for each participant
- [x] 7.6 Implement Copy Credentials button with clipboard + Sonner toast
- [x] 7.7 Implement Share / Magic Link button with Web Share API + clipboard fallback
- [x] 7.8 Match Sessions page layout to Stitch admin-sessions design

## 8. Mediator Management

- [x] 8.1 Create server action to create mediator linked to selected session
- [x] 8.2 Enforce one-mediator-per-session constraint
- [x] 8.3 Build Mediators page with create form and mediator list
- [x] 8.4 Add and edit mediator `title` and `description`
- [x] 8.5 Add copy/share credential actions for mediators
- [x] 8.6 Match Mediators page layout to Stitch admin-mediators design

## 9. Polish and Verification

- [x] 9.1 Add responsive styles for landing and admin pages
- [x] 9.3 Add README with setup instructions (Neon, env vars, migrations, seed)
