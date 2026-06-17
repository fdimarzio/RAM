# RAM — Relationship Agentic Management

A relationship intelligence platform for tracking people, companies, opportunities, events, tasks, and cases. Built as a prototype in collaboration between Frank and Seiji, coordinated via PAM (Project Agentic Management).

RAM manages the entire relationship ecosystem (clients, partners, investors, advisors, mentors) rather than just sales leads. The goal is to surface what should happen next, not just record what happened.

## Stack

- Vite + React 19
- Supabase (Postgres + REST API + auth)
- Recharts (dashboard visualizations)
- Plain CSS
- Vitest (unit tests) + Playwright (smoke tests) + ESLint

This mirrors the stack used in the `pam` and `options-tracker` projects for consistency across the toolset.

## Getting Started

```bash
npm install
cp .env.example .env.local
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local
npm run dev
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server |
| `npm run build` | Run unit tests, then build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit tests (Vitest) |
| `npm run test:smoke` | Run smoke tests (Playwright) |

## Core Entities

Companies, People, Products & Services, Events & Meetings, Tasks & Follow-Up Actions, Cases, Opportunities. See `/docs` (or PAM project notes) for the full data model.

## MVP Scope

See Functional Requirements & MVP Scope doc in PAM project notes. Out-of-scope items (email/calendar sync, AI recommendations, mobile apps, multi-tenant, etc.) are tracked under the "Nice to Have (Post-MVP Backlog)" milestone in PAM.

## Deployment

Hosted on Vercel, auto-deploying from the `main` branch on push. Database is Supabase (shared with PAM for now).
