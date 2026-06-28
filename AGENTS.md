# ClaimFlow Agent Guide

This file gives coding agents the context needed to work safely in this repository.

## Project Overview

ClaimFlow is an expense reimbursement workflow app with:

- NestJS backend API in `Claimflow/backend`
- React + Vite frontend in `Claimflow/frontend`
- Documentation in `docs`
- Render deployment blueprint in `render.yaml`

The core workflow lets applicants create claims and reviewers move claims through approval states while audit logs record each transition.

## Repository Map

```text
Claimflow/backend     NestJS API, TypeORM entities, auth, RBAC, audit logs
Claimflow/frontend    React/Vite UI
docs                  Project documents and deployment notes
render.yaml           Render backend/PostgreSQL blueprint
README.md             Top-level project README
```

## Backend

Location:

```text
Claimflow/backend
```

Important commands:

```bash
npm install
npm run build
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run start:dev
npm run start:prod
```

Local SQLite development:

```env
DB_TYPE=sqlite
DB_DATABASE=claimflow.sqlite
DB_SYNCHRONIZE=true
JWT_SECRET=local_dev_secret
```

Render/PostgreSQL deployment:

```env
NODE_ENV=production
DB_TYPE=postgres
DATABASE_URL=<render-postgres-internal-url>
DB_SYNCHRONIZE=true
JWT_SECRET=<long-random-secret>
CORS_ORIGIN=<vercel-frontend-url>
```

Only use `DB_SSL=true` when the database connection requires SSL.

## Frontend

Location:

```text
Claimflow/frontend
```

Important commands:

```bash
npm install
npm run dev
npm run build
npm run preview
```

Vercel deployment environment variable:

```env
VITE_API_URL=<render-backend-url>
```

Example:

```env
VITE_API_URL=https://claimflow-1.onrender.com
```

## Demo Credentials

```text
Applicant: applicant@test.com / password123
Reviewer: reviewer@test.com / password123
```

## Implementation Notes

- Keep frontend styling consistent with the existing ClaimFlow UI: dark navy sidebar, blue primary actions, compact cards, clear tables, and status badges.
- Use lucide-react icons for interface actions and category/status visuals.
- Keep cards at `8px` radius unless matching an existing component requires otherwise.
- Preserve the existing RBAC model and state machine behavior.
- Audit logs should be recorded for claim transitions.
- Do not remove PostgreSQL support when improving local development.
- SQLite support is for local development and testing.

## Testing Expectations

Before finishing backend changes, prefer:

```bash
cd Claimflow/backend
npm run build
npm test -- --runInBand
npm run test:e2e -- --runInBand
```

Before finishing frontend changes, prefer:

```bash
cd Claimflow/frontend
npm run build
```

## Git Safety

- Check `git status --short` before editing.
- Do not revert unrelated user changes.
- Keep commits focused and descriptive.
- Do not commit secrets, `.env` files, database files, build output, or `node_modules`.

## Deployment Checklist

Backend on Render:

```text
Root Directory: Claimflow/backend
Build Command: npm ci && npm run build
Start Command: npm run start:prod
```

Frontend on Vercel:

```text
Root Directory: Claimflow/frontend
Framework: Vite
Build Command: npm run build
Output Directory: dist
```

After deployment:

1. Set Vercel `VITE_API_URL` to the Render backend URL.
2. Set Render `CORS_ORIGIN` to the Vercel frontend URL.
3. Redeploy both services if environment variables change.
