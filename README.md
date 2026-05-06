# SuratStudyHub — Coaching Class Management System

A full-stack coaching institute management system built with **NestJS + TypeScript** (backend) and **React 18 + TypeScript + Ant Design 5** (frontend).

---

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [Seed Command](#seed-command)
- [API Documentation](#api-documentation)
- [Architecture Decisions](#architecture-decisions)
  - [Enrollment + Seat Reduction Transaction](#enrollment--seat-reduction-transaction)
  - [Concurrent Batch Seat Reduction](#concurrent-batch-seat-reduction)
  - [Teacher Fee Data Separation via Routing](#teacher-fee-data-separation-via-routing)
  - [Conditional Amount Paid / Due Date Fields](#conditional-amount-paid--due-date-fields)
  - [React Query Cache Invalidation](#react-query-cache-invalidation)
  - [Running Total Monthly Fee Calculation](#running-total-monthly-fee-calculation)

---

## Project Overview

SuratStudyHub is a backend REST API and React frontend for a Surat-based coaching institute. It replaces a manual register and receipt book system with a digital workflow covering student enrollments, batch schedules, fee payments, and attendance tracking.

**User Roles:**

| Role | Can Do | Cannot Do |
|---|---|---|
| Admin | Full access to all features and data | — |
| Teacher | View assigned batches, mark attendance, view student performance | See fee payments, collection reports, or financial data |
| Receptionist | Add students, collect fees, view pending payments | Mark attendance or access academic/attendance records |

---

## Tech Stack

### Backend
- **NestJS** with TypeScript (strict mode)
- **MySQL** relational database
- **TypeORM** as ORM
- **Swagger** at `/api/docs`
- **JWT** authentication with refresh token rotation
- **@nestjs/schedule** for cron jobs

### Frontend
- **React 18 + Vite** with TypeScript (strict mode)
- **Ant Design 5** for all UI components
- **React Router v6** for routing and protected routes
- **Zustand** with persist middleware for auth state
- **TanStack Query v5** for API calls, caching, and mutations
- **Axios** for HTTP requests

---

## Backend Setup

### Prerequisites
- Node.js >= 18
- MySQL 8+

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd StudyHub-Backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Fill in values as described in the Environment Variables section below

# Run database migrations (creates all tables and constraints)
npm run migration:run

# Seed the database
npm run seed

# Start in development mode
npm run start:dev

# Start in production mode
npm run build
npm run start:prod
```

---

## Frontend Setup

### Prerequisites
- Node.js >= 18
- Backend API must be running

### Installation

```bash
# Navigate to frontend folder
cd StudyHub-Frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Fill in VITE_API_BASE_URL with your backend URL

# Start development server
npm run dev

# Build for production
npm run build
npm run preview
```

---

## Environment Variables

### Backend — `.env`

```env
# Application
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=studyhub

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_ACCESS_EXPIRES_IN=1h         # Access token expiry (default: 1 hour)
JWT_REFRESH_EXPIRES_IN=7d        # Refresh token expiry (default: 7 days)

# Brute Force Protection
MAX_LOGIN_ATTEMPTS=5             # Failed attempts before account lock
LOCK_DURATION_MINUTES=15        # How long accounts stay locked
```

### Frontend — `.env`

```env
# API Base URL — must point to your running NestJS backend
VITE_API_BASE_URL=http://localhost:3000
```

---

## Seed Command

The seed script creates all required baseline data using relational references — no hardcoded IDs.

```bash
# Run from the backend directory
npm run seed
```

**What the seed creates:**

| Entity | Count | Details |
|---|---|---|
| Users | 3 | 1 Admin, 1 Teacher, 1 Receptionist |
| Batches | 8+ | Across Maths, Science, English, Gujarati, Hindi — standards 8th–12th |
| Students | 15+ | Mixed enrollment statuses |
| Enrollments | 20+ | Mixed payment statuses: Paid, Pending, Partial |
| Attendance Records | 30+ | Mixed statuses: Present, Absent, Late |

**Default seed credentials:**

| Role | Email | Password |
|---|---|---|
| Admin | admin@studyhub.com | Admin@123 |
| Teacher | teacher@studyhub.com | Teacher@123 |
| Receptionist | receptionist@studyhub.com | Recept@123 |

---

## API Documentation

Swagger is available at:

```
http://localhost:3000/api/docs
```

All endpoints return a standardised `ApiResponse<T>` shape:

```json
// Success
{ "success": true, "data": { ... }, "timestamp": "2026-04-17T10:00:00.000Z" }

// Error
{ "success": false, "message": "...", "statusCode": 422 }
```

---

## Architecture Decisions

### Enrollment + Seat Reduction Transaction

Enrollment creation and seat deduction are wrapped in a **single database transaction** to guarantee atomicity. The flow is:

1. **Service layer** receives the enrollment request with a list of batch IDs.
2. A `QueryRunner` transaction is started using TypeORM's `DataSource.createQueryRunner()`.
3. Inside the transaction, each selected batch is fetched with a **pessimistic write lock** (`SELECT ... FOR UPDATE`) to prevent race conditions.
4. Seat availability is validated across all selected batches. If any batch has 0 available seats, the transaction is rolled back immediately and a `422 Unprocessable Entity` is returned listing the full batch names.
5. If all batches pass validation, the enrollment record is created, `occupied_seats` is incremented, and `available_seats` is decremented for each batch — all within the same transaction.
6. The fee payment record is created inside the same transaction.
7. On any failure (constraint violation, DB error, validation failure), the transaction is rolled back and no partial state is persisted.

This ensures: **if seat deduction fails for any batch, the entire enrollment is discarded**.

```
START TRANSACTION
  → Validate all batch seats (FOR UPDATE lock)
  → Create enrollment record
  → Decrement available_seats for each batch
  → Create payment record
COMMIT  ← only if all steps succeed
ROLLBACK ← if any step fails
```

---

### Concurrent Batch Seat Reduction

Two receptionists enrolling different students into the same batch simultaneously (with only 1 seat remaining) is handled at the **database level**, not the application level.

**How it works:**

- The `batches` table has a `CHECK` constraint:
  ```sql
  CONSTRAINT chk_available CHECK (available_seats >= 0)
  ```
- When two concurrent transactions both try to decrement `available_seats` from `1` to `0`, only one will succeed. The second will attempt to set it to `-1`, which the DB-level `CHECK` constraint will **reject with a constraint violation error**.
- The NestJS service catches this specific database error code and returns a `409 Conflict` with a human-readable message: `"Batch seat was just taken by another enrollment. Please re-check availability."` — the raw database error is never exposed to the client.

**Why not a SELECT-then-INSERT pattern?**

A `SELECT` to check availability followed by an `INSERT` is vulnerable to a time-of-check to time-of-use (TOCTOU) race condition. Between the check and the insert, another request could consume the last seat. The DB-level constraint enforces correctness regardless of how many concurrent requests arrive.

---

### Teacher Fee Data Separation via Routing

Teachers are completely blocked from financial data through **routing**, not just column hiding. This is a two-layer enforcement:

**Layer 1 — Backend (Guard + DTO):**
- The `GET /batches` endpoint for teachers is served by a separate response DTO (`TeacherBatchResponseDto`) that never includes `monthly_fee`, `total_monthly_fee`, or any payment-related fields.
- The `RolesGuard` blocks teachers from accessing `/enrollments`, `/reports`, and any fee-related endpoints entirely with a `403 Forbidden`.

**Layer 2 — Frontend (Route-level blocking):**
- `/batches` — wrapped in `<RoleRoute role={[UserRole.Admin, UserRole.Receptionist]}>`. A Teacher navigating to this URL sees the Ant Design `Result` 403 page, not the batch list.
- `/students` — same `<RoleRoute>` protection. Teachers cannot access student financial records.
- `/students/:id/enroll` — Teacher role blocked at the route level.
- Teachers are redirected to `/my-batches` after login, which is the only batch-related route accessible to them. The `My Batches` page calls `GET /batches/my` (filtered by JWT) and the response DTO for this endpoint never contains fee fields.

**This means:** even if a teacher manually types `/batches` in the browser, they see a 403 page — not a table with hidden columns. The financial data is never fetched, never in the DOM, and never transmitted to the Teacher's browser session.

---

### Conditional Amount Paid / Due Date Fields

The enrollment form at `/students/:id/enroll` conditionally shows or hides the **Amount Paid** and **Due Date** fields based on the selected Payment Status, using Ant Design's `Form.useWatch`.

**Logic:**

| Payment Status | Amount Paid Field | Due Date Field |
|---|---|---|
| `PAID` | Visible & required | Hidden |
| `PARTIAL` | Visible & required | Visible & required |
| `PENDING` | Hidden | Visible & required |

**Implementation:**

```tsx
const paymentStatus = Form.useWatch('paymentStatus', form);

// Amount Paid — shown for PAID and PARTIAL
{(paymentStatus === 'PAID' || paymentStatus === 'PARTIAL') && (
  <Form.Item name="amountPaid" label="Amount Paid" rules={[{ required: true }]}>
    <InputNumber min={0} prefix="₹" />
  </Form.Item>
)}

// Due Date — shown for PENDING and PARTIAL
{(paymentStatus === 'PENDING' || paymentStatus === 'PARTIAL') && (
  <Form.Item name="dueDate" label="Due Date" rules={[{ required: true }]}>
    <DatePicker />
  </Form.Item>
)}
```

`Form.useWatch` subscribes to the live form value without requiring a manual `onChange` handler, so the fields appear and disappear reactively as the user changes the Payment Status select. Ant Design's built-in validation rules are also applied conditionally — fields that are hidden are not validated.

---

### React Query Cache Invalidation

TanStack Query's cache is invalidated in two scenarios to ensure UI data stays in sync with the backend after mutations.

**After Enrollment (`POST /enrollments`):**

When a new enrollment is created, two things change on the server:
1. The student's enrollment record is created.
2. `available_seats` and `occupied_seats` are updated for each selected batch.

So `useMutation` for enrollment invalidates two query keys on success:

```ts
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['batches'] });       // refreshes seat counts
  queryClient.invalidateQueries({ queryKey: ['students'] });      // refreshes student list
  queryClient.invalidateQueries({ queryKey: ['student', studentId] }); // refreshes student detail
}
```

**After Marking Attendance (`POST /attendance`):**

When attendance is marked, the batch's student list needs to reflect the updated `Last Attendance Status` and `Attendance This Month (%)` columns.

```ts
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['batch-students', batchId] }); // refreshes the student table
}
```

The modal closes only after `onSuccess` fires, ensuring the table is already refreshing when the user sees it. If the mutation fails (e.g., 409 duplicate attendance), the modal stays open and shows the API error as an Ant Design `Alert` without invalidating anything.

---

### Running Total Monthly Fee Calculation

The enrollment form shows a **live running total** of the monthly fee as the user selects batches from the multi-select dropdown. This is a display-only calculation — the server computes the authoritative total on submission.

**How it works:**

1. The batch list is fetched with `useQuery(['batches', { status: 'Active' }])` and stored in memory.
2. The selected batch IDs are watched with `Form.useWatch('batchIds', form)`.
3. The running total is computed using the `calcTotalFee` utility from `src/utils/calcTotalFee.ts`:

```ts
// src/utils/calcTotalFee.ts
export function calcTotalFee(selectedBatchIds: string[], batches: Batch[]): number {
  return selectedBatchIds.reduce((total, id) => {
    const batch = batches.find(b => b.id === id);
    return total + (batch?.monthlyFee ?? 0);
  }, 0);
}
```

4. In the component, the total is re-derived on every render whenever `selectedBatchIds` changes:

```tsx
const selectedBatchIds = Form.useWatch('batchIds', form) ?? [];
const runningTotal = calcTotalFee(selectedBatchIds, batches);

// Displayed below the Select
<Text strong>Estimated Monthly Fee: {formatCurrency(runningTotal)}</Text>
```

5. `formatCurrency` from `src/utils/formatCurrency.ts` formats the number as `₹4,500`.
6. On form submission, `batchIds` is sent to `POST /enrollments`. The backend re-calculates `total_monthly_fee` server-side as the authoritative sum — the client-side display value is never trusted.

---

## Reports

All four business reports use raw SQL queries (no ORM query builder). See `reports.sql` for the full queries and explanations.

| Report | Description |
|---|---|
| Daily Admission & Collection Summary | New admissions, fee collected, pending fees, top 3 batches for a given date |
| Batch Occupancy Report | All active batches with occupancy % sorted highest first |
| Low Occupancy Alert | Active batches below 50% occupancy, flagged AT RISK below 30% |
| Fee Pending Report | Students with outstanding fees sorted by pending amount |

---

## Background Tasks

A nightly cron job runs at **11:30 PM** using `@nestjs/schedule`:

```ts
@Cron('30 23 * * *')
async dailyAdmissionReport() {
  // Queries enrollments created today
  // Logs: total admissions, fee collected, pending fees, top batches
}
```

---

## Submission Checklist

| Deliverable | Status |
|---|---|
| GitHub repository (private) | ✅ |
| ERD / database schema diagram | ✅ (see `/docs/erd.png`) |
| README with setup, .env, seed command | ✅ |
| Screenshots of all 4 SQL queries with results | ✅ (see `/screenshots/`) |
| Swagger docs at `/api/docs` | ✅ |
| README: enrollment + seat reduction transaction | ✅ |
| README: concurrent seat reduction handling | ✅ |
| README: Teacher fee separation via routing | ✅ |
| README: conditional Amount Paid / Due Date fields | ✅ |
| README: React Query cache invalidation | ✅ |
| README: running total monthly fee calculation | ✅ |
