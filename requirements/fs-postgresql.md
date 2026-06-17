# Tack stack

## Frontend

**Framework**

- Next.js
- App Router
- Server Components by default
- Server Actions
- Route Handlers
- TypeScript (strict mode)

**UI & UX**

- Tailwind CSS
- shadcn/ui
- Radix UI
- lucide-react (icons)

**Forms & Validation**

- React Hook Form
- Zod

**State Management**

- React Server Components (default)
- React Context (light client state)
- TanStack Query (optional, client-heavy flows)

**Notifications**

- Sonner (toaster / user feedback)

## Backend

**Authentication**

- NextAuth.js (Custom auth with only login and password, without encrypting)
- Login + Password
- Magic Link
- Session management via cookies

**API Layer**

- Next.js Server Actions
- Route Handlers (/app/api) where needed
- No traditional REST unless required

## Database Layer

**Database**

- PostgreSQL 
- Managed on Neon

**ORM**

- Drizzle ORM
- Type-safe queries
- Schema-first design
- Relation management
- ZOD

**Migrations**

- Versioned migrations
- Safe schema evolution
- Enforced in CI/CD


