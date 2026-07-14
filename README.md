# PsyLex MVP First Look

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS + lightweight shadcn setup
- NextAuth credentials auth (plain-text password for MVP)
- Drizzle ORM + Neon PostgreSQL

## Setup

1. Copy `.env.example` to `.env`
2. Fill in `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
3. Install dependencies:

```bash
npm install
```

4. Generate migration files:


```bash
npm run db:generate
```

5. Apply migrations:

```bash
npm run db:migrate
```

6. Create admin user manually in DB (example):

```sql
INSERT INTO users (id, login, password, role, title, description, session_id)
VALUES (
  gen_random_uuid(),
  'psylex_550e8400-e29b-41d4-a716-446655440000',
  'change-me',
  'admin',
  'Admin',
  'System administrator',
  NULL
);
```

7. Run app:

```bash
npm run dev
```

## Routes

- `/` landing page (EN/UK with localStorage persistence)
- `/login` admin login
- `/admin/settings` settings placeholder
- `/admin/sessions` sessions + plaintiff/defendant management
- `/admin/mediators` mediator management
