# ClaimFlow Deployment Guide

Deploy the backend first on Render, then deploy the frontend on Vercel.

## Backend: Render

Create a new Render Web Service from the GitHub repository.

Use these settings:

| Setting | Value |
| --- | --- |
| Root Directory | `Claimflow/backend` |
| Runtime | `Node` |
| Build Command | `npm ci && npm run build` |
| Start Command | `npm run start:prod` |
| Health Check Path | `/` |

Create a Render PostgreSQL database, then set these backend environment variables:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `DB_TYPE` | `postgres` |
| `DATABASE_URL` | Render PostgreSQL internal connection string |
| `DB_SYNCHRONIZE` | `true` for demo deployment |
| `JWT_SECRET` | Strong random secret |
| `CORS_ORIGIN` | Vercel frontend URL, for example `https://claimflow.vercel.app` |

Only set `DB_SSL=true` if you use an external PostgreSQL connection string that requires SSL.

## Frontend: Vercel

Create a new Vercel project from the same GitHub repository.

Use these settings:

| Setting | Value |
| --- | --- |
| Framework Preset | `Vite` |
| Root Directory | `Claimflow/frontend` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

Set this frontend environment variable:

| Variable | Value |
| --- | --- |
| `VITE_API_URL` | Render backend URL, for example `https://claimflow-api.onrender.com` |

After Vercel deploys, copy the Vercel URL into the Render backend `CORS_ORIGIN` variable and redeploy the backend.

## Deployment Order

1. Push the latest code to GitHub.
2. Deploy the Render backend and PostgreSQL database.
3. Copy the Render backend URL.
4. Deploy the Vercel frontend with `VITE_API_URL` set to the Render backend URL.
5. Copy the Vercel frontend URL into Render as `CORS_ORIGIN`.
6. Redeploy the Render backend.

## Smoke Test

Use these seeded users after deployment:

| Role | Email | Password |
| --- | --- | --- |
| Applicant | `applicant@test.com` | `password123` |
| Reviewer | `reviewer@test.com` | `password123` |

Open the Vercel frontend, log in, create a claim, then review it from the reviewer account.
