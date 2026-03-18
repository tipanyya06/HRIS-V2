# Madison 88 — Hire Pipeline

Canonical reference for the applicant-to-employee hire flow. All stages, gates, and automation are documented here.

---

## Pipeline Stages

| # | Stage | Status | Description |
|---|-------|--------|-------------|
| 1 | **Applied** | ✅ Done | Applicant submits application via job board. Resume uploaded to Supabase. |
| 2 | **Screening** | ✅ Done | Admin reviews application, moves to screening stage in ATS pipeline. |
| 3 | **Interview** | ✅ Done | Interview scheduled via MS Teams. Admin adds scorecard notes after interview. |
| 4 | **Pre-Employment** | ✅ Done | All required documents must be submitted AND approved by admin before moving to Offer stage. |
| 5 | **Offer** | ✅ Done | Admin extends offer. Applicant must be at this stage for hire to succeed. Offer letter generated here. |
| 6 | **Hired** | ✅ Done | Applicant becomes employee. Company email generated. Welcome email sent via Brevo. |
| 7 | **Onboarding** | 🔲 S9 sprint | New employee completes onboarding checklist. Equipment assigned. System access granted. |

---

## Stage Progression Rules

- Stages must advance **in order**: `applied → screening → interview → offer → hired`
- **Skipping stages is blocked** — e.g. `applied → hired` returns 400 listing the required intermediate stages
- **Moving backwards is blocked** — e.g. `offer → screening` returns 400
- **Rejected** is allowed from any stage at any time

---

## Pre-Employment Gate (Stage 4)

Required documents before moving to Offer:

- Updated resume
- Government IDs
- Medical exam results
- NBI clearance
- Police clearance

**Gate enforcement:** Before `PATCH /:id/hire` OR `PATCH /:id/stage` with `newStage: hired` is allowed, the system verifies:

1. A `PreEmployment` record exists for the linked user
2. All required items have `status === 'approved'`
3. `overallStatus === 'approved'`

If any item is pending or rejected → HTTP 400 listing the specific missing items.

---

## Hire Flow (Stage 6)

Triggered by `PATCH /api/applications/:id/hire` or `PATCH /api/applications/:id/stage` with `{ newStage: 'hired' }`.

What runs on hire:

1. Pre-employment gate check (blocks if not fully approved)
2. Stage order check (applicant must be at `offer`)
3. Company email generated — `firstname.lastname@madison88.com` (deduped with numeric suffix if taken)
4. User record updated → `role: employee`, `isActive: true`, `isVerified: true`, `dateOfEmployment`, `onboardingStatus: pending`
5. Applicant record updated → `isEmployee: true`, `stage: hired`, TTL (`deletedAt`) removed
6. Job slots decremented — job auto-closes if slots reach 0
7. Welcome email sent via Brevo (fire-and-forget, non-blocking)

---

## Automated Tests

Location: `server/src/modules/applications/__tests__/`

| File | Coverage | Result |
|------|----------|--------|
| `updateStage.bugCondition.test.js` | Pre-employment gate missing in `updateStage()` — 3 cases | ✅ 3/3 pass |
| `updateStage.preservation.test.js` | Non-hired transitions, interview lifecycle, approved hire path, `hireApplicant()` gate | ✅ 8/8 pass |

Run:
```bash
cd server
npx vitest run --reporter=verbose src/modules/applications/__tests__/
```

---

## Implementation Notes

- `hireApplicant()` — handles `PATCH /:id/hire`, full hire flow with company email generation
- `updateStage()` — handles `PATCH /:id/stage`, enforces stage order + pre-employment gate when `newStage === 'hired'`
- Pre-employment gate uses `linkedUser` variable (not `user`) to avoid shadowing the existing `user` lookup later in the same block
- `PreEmployment` model is imported once at the bottom of `applications.service.js` alongside `sendWelcomeEmail`

---

*Last updated: March 2026 — Hire flow complete and verified*
