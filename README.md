# Claimflow

Claimflow is a full-stack claims workflow application for submitting, reviewing, and approving expense claims. It separates applicant and reviewer responsibilities, enforces role-based authorization, and records status changes in an audit trail.

## Project Structure

```text
Claimflow/
  backend/      NestJS API, PostgreSQL persistence, JWT auth, workflow rules
  frontend/     React + Vite user interface
  docker-compose.yml full local Docker stack
```

## Core Features

- Applicant and reviewer login using JWT authentication.
- Applicants can create draft claims with category, description, amount, and optional attachment.
- Applicants can edit only their own draft claims.
- Applicants can submit claims for review.
- Reviewers can list submitted claims, start review, approve, reject, or return claims for changes.
- Rejection and return-for-changes actions require reviewer comments.
- Every application creation and status transition is written to an audit log.

## Workflow

```mermaid
stateDiagram-v2
  [*] --> DRAFT
  DRAFT --> SUBMITTED: Applicant submits
  SUBMITTED --> UNDER_REVIEW: Reviewer starts review
  UNDER_REVIEW --> APPROVED: Reviewer approves
  UNDER_REVIEW --> REJECTED: Reviewer rejects with comment
  UNDER_REVIEW --> RETURNED_FOR_CHANGES: Reviewer returns with comment
  RETURNED_FOR_CHANGES --> DRAFT: Applicant resumes editing
```

## Technology Stack

- Frontend: React, Vite, TypeScript, React Query, Axios, Tailwind CSS
- Backend: NestJS, TypeScript, TypeORM, Passport JWT, bcrypt
- Local development: Docker Compose for frontend, backend, and PostgreSQL
- Local fallback database: SQLite through TypeORM
- Deployment database: PostgreSQL through TypeORM

## Local Setup

### Docker Setup

The recommended local setup runs the whole application with Docker Compose.

Prerequisites:

- Docker Desktop
- Windows Subsystem for Linux 2, if running on Windows

On Windows, if Docker Desktop says the engine cannot start, open PowerShell as Administrator and run:

```powershell
wsl --install
```

Restart Windows if prompted, then start Docker Desktop.

From the repository root, run:

```powershell
cd Claimflow
docker compose up -d --build
```

The app will be available at:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`
- PostgreSQL: `localhost:5432`

Stop the stack with:

```powershell
docker compose down
```

To reset the local PostgreSQL data as well:

```powershell
docker compose down -v
```

### Manual Local Setup

You can also run the app without Docker by installing dependencies locally.

For SQLite, create `Claimflow/backend/.env` and use:

```text
DB_TYPE=sqlite
DB_DATABASE=claimflow.sqlite
JWT_SECRET=super-secret-key-change-in-production
PORT=3000
```

TypeORM creates the SQLite database file automatically when the backend starts.

For PostgreSQL deployment, set `DB_TYPE=postgres` and provide `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, and `DB_DATABASE`.

### Backend

```powershell
cd Claimflow\backend
npm install
npm run start:dev
```

The backend defaults to `http://localhost:3000`.

### Frontend

```powershell
cd Claimflow\frontend
npm install
npm run dev
```

The frontend uses `VITE_API_URL` when provided, otherwise it calls `http://localhost:3000`.

## Seed Users

| Role | Email | Password |
| --- | --- | --- |
| Applicant | `applicant@test.com` | `password123` |
| Reviewer | `reviewer@test.com` | `password123` |

## Main API Areas

- `POST /auth/login`
- `GET /applications/my`
- `POST /applications`
- `PATCH /applications/:id`
- `POST /applications/:id/submit`
- `POST /applications/:id/draft`
- `GET /reviewer/applications`
- `GET /reviewer/applications/:id`
- `POST /reviewer/applications/:id/start-review`
- `POST /reviewer/applications/:id/approve`
- `POST /reviewer/applications/:id/reject`
- `POST /reviewer/applications/:id/return`

## Testing Strategy

- Unit tests cover workflow transition rules.
- E2E tests cover API behavior, authentication, authorization, and audit logging.
- Invalid transitions are tested to ensure illegal workflow changes are blocked.

## Documentation

- [Software Design Document](SOFTWARE_DESIGN_DOCUMENT.md)
- [Architecture Diagram](ARCHITECTURE_DIAGRAM.md)
- [Database ERD](DATABASE_ERD.md)
- [Test Plan](TEST_PLAN.md)
