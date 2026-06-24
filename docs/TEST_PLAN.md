# Test Plan

## 1. Objective

This test plan verifies that Claimflow correctly supports authenticated claim submission, reviewer workflow actions, role-based authorization, and audit logging.

## 2. Test Scope

In scope:

- Authentication and JWT-protected routes.
- Applicant workflow.
- Reviewer workflow.
- State machine transition rules.
- Authorization boundaries between applicants and reviewers.
- Audit log creation.
- Basic frontend build validation.

Out of scope:

- Load testing.
- Browser compatibility matrix testing.
- Production deployment testing.
- External object storage testing.

## 3. Test Levels

| Level | Purpose | Example Command |
| --- | --- | --- |
| Unit | Validate isolated services such as the state machine | `npm run test` from `Claimflow/backend` |
| Integration | Validate controller, service, and database behavior | `npm run test:e2e` from `Claimflow/backend` |
| Frontend build | Validate TypeScript and production bundle | `npm run build` from `Claimflow/frontend` |
| Manual workflow | Validate complete user journeys in the browser | Run backend, frontend, and PostgreSQL locally |

## 4. Test Data

| Role | Email | Password |
| --- | --- | --- |
| Applicant | `applicant@test.com` | `password123` |
| Reviewer | `reviewer@test.com` | `password123` |

## 5. Workflow Tests

### Applicant Creates Draft Claim

Steps:

1. Log in as `applicant@test.com`.
2. Create a claim with title, category, amount, and description.
3. Save the claim.

Expected result:

- The claim is created with status `DRAFT`.
- The claim belongs to the logged-in applicant.
- An audit log entry is created with `old_status = null` and `new_status = DRAFT`.

### Applicant Edits Draft Claim

Expected result:

- The update succeeds for the owning applicant.
- The status remains `DRAFT`.
- A different applicant cannot update the claim.

### Applicant Submits Claim

Expected result:

- Status changes from `DRAFT` to `SUBMITTED`.
- An audit log entry records the transition.

### Reviewer Starts Review

Expected result:

- Status changes from `SUBMITTED` to `UNDER_REVIEW`.
- Applicant-only endpoints remain unavailable to the reviewer.
- An audit log entry records the transition.

### Reviewer Approves Claim

Expected result:

- Status changes from `UNDER_REVIEW` to `APPROVED`.
- An audit log entry records the transition.

### Reviewer Rejects Claim

Expected result:

- Status changes from `UNDER_REVIEW` to `REJECTED`.
- The rejection comment is required.
- The comment is stored in the audit log.

### Reviewer Returns Claim for Changes

Expected result:

- Status changes from `UNDER_REVIEW` to `RETURNED_FOR_CHANGES`.
- The return comment is required.
- The comment is stored in the audit log.

### Applicant Resumes Returned Claim

Expected result:

- Status changes from `RETURNED_FOR_CHANGES` to `DRAFT`.
- The applicant can edit the claim again.
- An audit log entry records the transition.

## 6. Authorization Tests

| Scenario | Expected Result |
| --- | --- |
| Unauthenticated user calls protected application endpoint | Request is rejected |
| Applicant calls reviewer application list endpoint | Request is forbidden |
| Reviewer calls applicant-only create endpoint | Request is forbidden |
| Applicant tries to review, approve, reject, or return a claim | Request is forbidden |
| Reviewer tries to submit a draft claim | Request is forbidden |
| Applicant tries to view another applicant's claim | Request is forbidden |
| Applicant tries to edit a non-draft claim | Request is rejected |
| Reviewer rejects without a comment | Request is rejected |
| Reviewer returns for changes without a comment | Request is rejected |

## 7. State Machine Tests

| Current Status | Target Status | Role | Expected |
| --- | --- | --- | --- |
| `DRAFT` | `SUBMITTED` | `APPLICANT` | Allowed |
| `RETURNED_FOR_CHANGES` | `DRAFT` | `APPLICANT` | Allowed |
| `SUBMITTED` | `UNDER_REVIEW` | `REVIEWER` | Allowed |
| `UNDER_REVIEW` | `APPROVED` | `REVIEWER` | Allowed |
| `UNDER_REVIEW` | `REJECTED` | `REVIEWER` | Allowed with comment |
| `UNDER_REVIEW` | `RETURNED_FOR_CHANGES` | `REVIEWER` | Allowed with comment |
| `DRAFT` | `APPROVED` | `REVIEWER` | Rejected as invalid |
| `SUBMITTED` | `APPROVED` | `REVIEWER` | Rejected as invalid |
| `UNDER_REVIEW` | `SUBMITTED` | `REVIEWER` | Rejected as invalid |
| `SUBMITTED` | `UNDER_REVIEW` | `APPLICANT` | Forbidden |

## 8. Audit Log Tests

| Event | Expected Audit Entry |
| --- | --- |
| Claim created | `old_status = null`, `new_status = DRAFT` |
| Claim submitted | `old_status = DRAFT`, `new_status = SUBMITTED` |
| Review started | `old_status = SUBMITTED`, `new_status = UNDER_REVIEW` |
| Claim approved | `old_status = UNDER_REVIEW`, `new_status = APPROVED` |
| Claim rejected | `old_status = UNDER_REVIEW`, `new_status = REJECTED`, comment present |
| Claim returned | `old_status = UNDER_REVIEW`, `new_status = RETURNED_FOR_CHANGES`, comment present |

## 9. Manual End-to-End Checklist

1. Start PostgreSQL with `docker compose up -d` from `Claimflow`.
2. Start the backend with `npm run start:dev` from `Claimflow/backend`.
3. Start the frontend with `npm run dev` from `Claimflow/frontend`.
4. Log in as applicant.
5. Create and submit a claim.
6. Log out and log in as reviewer.
7. Start review and approve the claim.
8. Confirm the claim detail page shows the audit history.
9. Repeat with reject and return-for-changes paths.

## 10. Acceptance Criteria

- Only authenticated users can access protected routes.
- Applicants and reviewers can only access routes for their role.
- Applicants can only manage their own claims.
- Invalid status transitions are rejected.
- Reviewer rejection and return actions require comments.
- Audit logs are created for each status transition.
- Backend unit tests pass.
- Backend e2e tests pass or documented gaps are recorded.
- Frontend production build completes successfully.
