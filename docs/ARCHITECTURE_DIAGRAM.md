# Architecture Diagram

## High-Level Architecture

```mermaid
flowchart TB
  subgraph Client["Client Layer"]
    Browser["Browser"]
    React["React + Vite Frontend"]
    AuthContext["Auth Context"]
    Axios["Axios API Client"]
  end

  subgraph API["Backend Layer - NestJS"]
    Controllers["REST Controllers"]
    JwtGuard["JWT Auth Guard"]
    RolesGuard["Roles Guard"]
    AuthService["Auth Service"]
    AppService["Applications Service"]
    StateMachine["Application State Machine"]
    AuditService["Audit Log Service"]
    UploadService["File Upload Service"]
  end

  subgraph Data["Data Layer"]
    Postgres[("PostgreSQL")]
    Users["users"]
    Applications["applications"]
    AuditLogs["application_audit_logs"]
    Attachments["attachments"]
  end

  Browser --> React
  React --> AuthContext
  React --> Axios
  Axios --> Controllers
  Controllers --> JwtGuard
  Controllers --> RolesGuard
  Controllers --> AuthService
  Controllers --> AppService
  AppService --> StateMachine
  AppService --> AuditService
  AppService --> UploadService
  AuthService --> Postgres
  AppService --> Postgres
  AuditService --> Postgres
  UploadService --> Postgres
  Postgres --> Users
  Postgres --> Applications
  Postgres --> AuditLogs
  Postgres --> Attachments
```

## Request Flow

```mermaid
sequenceDiagram
  participant User
  participant Frontend as React Frontend
  participant API as NestJS API
  participant Auth as JWT and Role Guards
  participant Workflow as State Machine
  participant DB as PostgreSQL

  User->>Frontend: Login
  Frontend->>API: POST /auth/login
  API->>DB: Find user and password hash
  DB-->>API: User record
  API-->>Frontend: JWT access token

  User->>Frontend: Submit or review claim
  Frontend->>API: Authenticated API request
  API->>Auth: Validate token and role
  Auth-->>API: Authorized request
  API->>Workflow: Validate status transition
  Workflow-->>API: Transition allowed
  API->>DB: Update application and write audit log
  DB-->>API: Updated records
  API-->>Frontend: Updated claim state
```

## Workflow State Machine

```mermaid
stateDiagram-v2
  [*] --> DRAFT

  DRAFT --> SUBMITTED: Applicant
  RETURNED_FOR_CHANGES --> DRAFT: Applicant

  SUBMITTED --> UNDER_REVIEW: Reviewer
  UNDER_REVIEW --> APPROVED: Reviewer
  UNDER_REVIEW --> REJECTED: Reviewer + comment
  UNDER_REVIEW --> RETURNED_FOR_CHANGES: Reviewer + comment

  APPROVED --> [*]
  REJECTED --> [*]
```

## Component Responsibilities

| Component | Responsibility |
| --- | --- |
| React Frontend | User interface for login, applicant dashboard, reviewer dashboard, and claim detail screens |
| Axios API Client | Sends API requests and attaches JWT bearer tokens |
| NestJS Controllers | Define applicant and reviewer REST endpoints |
| JWT Auth Guard | Rejects unauthenticated requests |
| Roles Guard | Enforces applicant-only and reviewer-only routes |
| Applications Service | Owns claim use cases and persistence orchestration |
| State Machine Service | Validates legal workflow transitions |
| Audit Log Service | Records application creation and status changes |
| PostgreSQL | Persists users, applications, audit logs, and attachments |
