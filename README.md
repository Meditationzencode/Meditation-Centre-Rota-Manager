# Meditation Centre Rota Manager

**A full-stack rota management web application for a Buddhist meditation centre.**

🔗 **Live demo: [sangha-rota.vercel.app](https://sangha-rota.vercel.app/login)**

Meditation Centre Rota Manager is a database-backed scheduling web application designed to replace spreadsheet-based rota management for a Buddhist meditation centre. The application supports user authentication, role-based access, shift creation, volunteer availability, weekly and monthly rota views, and admin tools. It is designed with privacy, maintainability, and real-world usability in mind.

All data is entirely fictional — no real organisation information is included.

### Try the live demo

| Role | Email | Password |
|---|---|---|
| Admin | `admin@bodhigrove.demo` | `Demo1234!` |
| Coordinator | `coord1@bodhigrove.demo` | `Demo1234!` |
| Volunteer | `vol1@bodhigrove.demo` | `Demo1234!` |

---

## Tech stack

| Layer        | Choice                              |
|--------------|-------------------------------------|
| Framework    | Next.js 15 (App Router)             |
| Language     | TypeScript                          |
| Auth         | Supabase Auth (email/password)      |
| Database     | PostgreSQL via Supabase             |
| ORM / client | Supabase JS client + `@supabase/ssr`|
| Styling      | Tailwind CSS                        |
| Deployment   | Vercel                              |

## Features

- **Authentication** — Supabase Auth with session cookies (SSR-safe)
- **Role-based access** — three roles enforced in middleware, UI, and at database level via Row Level Security
- **Weekly rota calendar** — browse by week, view duties, locations, sign-up counts
- **Volunteer sign-up / cancel** — one-click via React Server Actions
- **Schedule management** — coordinators & admins create, edit, delete slots
- **Member management** — admins create accounts, change roles, activate/deactivate
- **Profile page** — update name and password

---

## Getting started

### 1. Clone & install

```bash
git clone https://github.com/Meditationzencode/Meditation-Centre-Rota-Manager
cd Meditation-Centre-Rota-Manager
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free project.
2. In **Project Settings → API**, copy your **Project URL** and **anon key**.
3. Also copy the **service role key** (needed for admin user creation).

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Run the database setup

In the **Supabase SQL Editor**, run these files in order:

```
supabase/schema.sql   ← creates tables, indexes, and the auto-profile trigger
supabase/rls.sql      ← enables Row Level Security and sets all policies
```

### 5. Seed the database

Run the setup script — it creates all demo auth users, profiles, rota slots, and sample signups automatically:

```bash
npm run setup
```

This creates the following demo accounts (password: `Demo1234!`):

| Email                       | Role        | Name            |
|-----------------------------|-------------|-----------------|
| admin@bodhigrove.demo       | Admin       | Ananda Sharma   |
| coord1@bodhigrove.demo      | Coordinator | Maya Patel      |
| coord2@bodhigrove.demo      | Coordinator | Rohan Desai     |
| vol1@bodhigrove.demo        | Volunteer   | James Whitfield |
| vol2@bodhigrove.demo        | Volunteer   | Priya Nair      |
| vol3@bodhigrove.demo        | Volunteer   | Tom Eriksson    |
| vol4@bodhigrove.demo        | Volunteer   | Suki Tanaka     |

### 6. Start the development server

```bash
npm run dev
# → http://localhost:3000
```

---

## Deploying to Vercel

```bash
vercel
```

Add the same three environment variables in **Vercel → Project → Settings → Environment Variables**.

Set the **Site URL** in Supabase Dashboard → Authentication → URL Configuration to your Vercel production URL.

---

## Role permissions

| Feature                         | Admin | Coordinator | Volunteer |
|---------------------------------|:-----:|:-----------:|:---------:|
| View rota                       | ✓     | ✓           | ✓         |
| Sign up for / cancel slots      | ✓     | ✓           | ✓         |
| Create / edit / delete slots    | ✓     | ✓           | –         |
| View all member accounts        | ✓     | –           | –         |
| Create / edit / delete accounts | ✓     | –           | –         |

---

## Project structure

```
src/
├── app/
│   ├── (auth)/login/          ← sign-in page (no nav)
│   ├── (app)/                 ← protected layout with nav + footer
│   │   ├── dashboard/
│   │   ├── rota/              ← weekly calendar view
│   │   ├── admin/
│   │   │   ├── schedule/      ← slot management (coordinator + admin)
│   │   │   └── members/       ← user management (admin only)
│   │   └── profile/
│   ├── api/auth/callback/     ← Supabase OAuth redirect handler
│   ├── layout.tsx             ← root HTML + fonts
│   └── globals.css
├── components/
│   ├── nav.tsx                ← sticky nav with user dropdown
│   ├── rota/rota-grid.tsx     ← 7-column interactive calendar
│   └── ui/badge.tsx
├── lib/
│   ├── actions.ts             ← all Server Actions (auth, rota, admin)
│   ├── supabase/
│   │   ├── client.ts          ← browser Supabase client
│   │   └── server.ts          ← server + admin Supabase clients
│   ├── types.ts
│   └── utils.ts
└── middleware.ts              ← session guard, redirects unauthenticated users

supabase/
├── schema.sql                 ← tables, indexes, auto-profile trigger
├── rls.sql                    ← Row Level Security policies
└── seed.sql                   ← demo rota data
```

## Security notes

- **Row Level Security** is enabled on all tables — Supabase enforces access at the database level regardless of application code.
- The `my_role()` helper function runs with `SECURITY DEFINER` to safely read the caller's role.
- The service role key is server-side only and never exposed to the browser.
- Session cookies are `httpOnly` and `sameSite: lax`, managed by `@supabase/ssr`.
- Volunteers cannot escalate their own role — the RLS `UPDATE` policy on profiles checks the current role before allowing changes.

---

*This is a fictional demo project. Bodhi Grove Meditation Centre does not exist.*
