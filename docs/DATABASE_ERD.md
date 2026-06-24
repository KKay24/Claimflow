# Database ERD

## Entity Relationship Diagram

```mermaid
erDiagram
  users ||--o{ applications : submits
  users ||--o{ application_audit_logs : performs
  applications ||--o{ application_audit_logs : has
  applications ||--o| attachments : has

  users {
    uuid id PK
    varchar name
    varchar email UK
    varchar password_hash
    enum role
    timestamp created_at
    timestamp updated_at
  }

  applications {
    uuid id PK
    varchar title
    enum category
    text description
    decimal amount
    varchar attachment_url
    enum status
    uuid applicant_id FK
    timestamp created_at
    timestamp updated_at
  }

  application_audit_logs {
    uuid id PK
    uuid application_id FK
    uuid user_id FK
    varchar old_status
    varchar new_status
    text comment
    timestamp created_at
  }

  attachments {
    uuid id PK
    uuid application_id FK
    varchar file_name
    varchar file_url
    varchar mime_type
    integer file_size
    timestamp created_at
  }
```

## Tables

### users

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID | Primary key |
| `name` | varchar | Display name |
| `email` | varchar | Unique login email |
| `password_hash` | varchar | bcrypt password hash |
| `role` | enum | `APPLICANT` or `REVIEWER` |
| `created_at` | timestamp | Created timestamp |
| `updated_at` | timestamp | Updated timestamp |

### applications

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID | Primary key |
| `title` | varchar | Claim title |
| `category` | enum | `TRAVEL`, `FUEL`, `INTERNET`, `MEALS`, `EQUIPMENT`, `OTHER` |
| `description` | text | Optional claim details |
| `amount` | decimal(10,2) | Claim amount |
| `attachment_url` | varchar | Optional attachment location |
| `status` | enum | Current workflow status |
| `applicant_id` | UUID | Foreign key to `users.id` |
| `created_at` | timestamp | Created timestamp |
| `updated_at` | timestamp | Updated timestamp |

### application_audit_logs

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID | Primary key |
| `application_id` | UUID | Foreign key to `applications.id` |
| `user_id` | UUID | Foreign key to `users.id` |
| `old_status` | varchar | Previous status, nullable for creation |
| `new_status` | varchar | New status |
| `comment` | text | Optional transition comment |
| `created_at` | timestamp | Time of event |

### attachments

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID | Primary key |
| `application_id` | UUID | Foreign key to `applications.id` |
| `file_name` | varchar | Original or stored file name |
| `file_url` | varchar | File URL or local reference |
| `mime_type` | varchar | MIME type |
| `file_size` | integer | Size in bytes |
| `created_at` | timestamp | Created timestamp |

## Relationship Rules

- A user with role `APPLICANT` can own many applications.
- An application belongs to exactly one applicant.
- An application can have many audit log entries.
- A user can perform many audit log events.
- An application can have zero or one attachment record.
- Deleting a user cascades to their applications and audit logs through configured relations.
- Deleting an application cascades to its audit logs and attachment relation.
