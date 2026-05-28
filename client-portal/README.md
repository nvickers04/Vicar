# Vicar Client Portal

Spreadsheet-style weekly timesheet for client companies. Submits to `POST /payroll/run`.

## Run

```bash
cd ../backend && npm run dev    # port 3000
cd client-portal && npm run dev # port 3001
```

Login: **client@acme.com** / **demo123**

## Matrix UI

A clean, Excel-like weekly grid. Cells start **empty** — click any cell to enter a day's
time and job in a roomy popover.

| Feature | Details |
|---------|---------|
| **Grid** | Employees ↓ rows, Mon–Sun → columns; cells blank until entered (no auto-fill) |
| **Cell editor (popover)** | Free-text Start/End or Start+Hours, **per-cell break**, computed hours, job allocation |
| **Smart text entry** | Type `730`, `7:30a`, `1530`, `3p` — parsed to a time. Hours/break are plain text too |
| **Entry method** | Per employee: `Start–End` (auto hours) or `Start+Hours` — set in sidebar settings |
| **Job splits** | Per day, multi-job; even split default; prominent slider for 2 jobs |
| **Employees** | Add / remove in the sidebar |
| **Jobs** | Add / edit (number + name) / remove in the sidebar |
| **Settings** | Default start, break, entry method — **Apply** to selected (or all) employees |
| **Batch bar** | Select rows/columns → set start/end/hours/break/jobs across the selection |
| **Totals** | ST / OT hours broken down **per job**, plus weekly totals |
| **Submit** | Submit week → `POST /payroll/run` |

## Backend CRUD

`/contractors` and `/jobs` support `GET POST PATCH DELETE` (in-memory store, demo).

## Verification

Automated end-to-end test (Playwright):

```bash
npm run dev            # needs backend on :3000 with CORS_ORIGIN=http://localhost:3001
node scripts/drive.mjs # logs in, edits, batches, manages, submits; screenshots to /shots
```

Covers: empty-by-default grid, free-text time entry, per-cell break recompute, 2-job slider,
Escape close, add employee, add job, apply settings, ST/OT-by-job totals, submit → dashboard.
