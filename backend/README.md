# Vicar Payroll / Billing Engine

API-first backend for **Time & Expense (T&E)** invoicing with fully flexible, per-client **Pricing Profiles**.

**Target subsystem:** Payroll / Billing Engine  
**Stack:** TypeScript, Express, Postgres (schema in `/schema`), Docker

## What This Does

Each client (or contract) gets a **Pricing Profile** — a configuration that picks one of nine common staffing **markup** models:

| Strategy | Plain English |
|----------|---------------|
| `percentage_markup` | Bill = Pay × (1 + markup%) |
| `burdened_markup` | Markup on loaded cost (pay + taxes + WC + benefits + overhead) |
| `rate_card` | Fixed negotiated bill rates per role |
| `banded` | Pay-rate bands with ST/OT multipliers ([pricing-strategy.md](../docs/pricing-strategy.md)) |
| `blended` | One average bill rate across all workers |
| `fixed_fee` | Flat project / SOW fee |
| `temp_to_hire` | Hourly temp markup + conversion fee on hire |
| `direct_hire` | One-time placement fee |
| `hybrid` | Base model + volume discounts, OT overrides, NTE caps, pass-through admin |

Every invoice stores an **immutable rate snapshot** (what rates were used) and logs every calculation for **compliance** audit.

**Margin guardrails:** Gross margin is checked against Vicar's 34–40% target from [core-business-plan.md](../docs/core-business-plan.md).

## Quick Start (local)

```bash
cd backend
npm install
npm test          # unit tests — all pricing models
npm run dev       # API on http://localhost:3000
```

## Quick Start (Docker + Postgres)

From repo root:

```bash
docker compose up --build
```

Postgres loads `schema/migrations/001_initial.sql` on first boot. The API currently uses an **in-memory store** for simplicity; the SQL schema is ready for Postgres wiring in a follow-up PR.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET/POST/PUT/DELETE | `/pricing-profiles` | CRUD for client pricing configs |
| POST | `/pricing-profiles/:id/calculate` | Preview bill rates without invoicing |
| GET/POST | `/timesheets` | List / create timesheets |
| GET | `/timesheets/:id` | Get one timesheet |
| GET | `/invoices` | List invoices |
| GET | `/invoices/:id` | Get invoice + rate snapshot |
| POST | `/invoices/generate` | Generate invoice from timesheet + profile |
| GET | `/calculation-logs` | Compliance audit log |

### Example: Banded pricing preview

```bash
# Create a pricing profile (banded — Band 1 from pricing-strategy.md)
curl -X POST http://localhost:3000/pricing-profiles \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "00000000-0000-0000-0000-000000000001",
    "name": "Acme — Band 1",
    "strategyType": "banded",
    "params": {
      "bands": [
        { "bandId": "band1", "minPay": 15, "maxPay": 30, "stMultiplier": 1.42, "otMultiplier": 1.35 }
      ]
    }
  }'
```

### Example: Generate invoice

```bash
curl -X POST http://localhost:3000/invoices/generate \
  -H "Content-Type: application/json" \
  -d '{
    "timesheetId": "<timesheet-uuid>",
    "pricingProfileId": "<profile-uuid>"
  }'
```

## Folder Structure

```
backend/
  src/
    types/           # Core interfaces (PricingProfile, Timesheet, Invoice, …)
    pricing/
      strategies/    # One class per pricing model (strategy pattern)
      engine.ts      # calculateBillRate + generateInvoice
      margin-guard.ts
      compliance.ts  # Audit logging
    routes/          # Express routers
    store/           # In-memory persistence (MVP)
  tests/             # Unit tests per pricing model
schema/
  migrations/
    001_initial.sql  # Postgres schema
```

## Flexible Config (JSONB params)

Each `PricingProfile.params` object holds model-specific settings. Examples:

```jsonc
// percentage_markup
{ "markupPercent": 42, "otMultiplier": 1.35 }

// banded (from pricing-strategy.md)
{ "bands": [{ "bandId": "band1", "minPay": 15, "maxPay": 30, "stMultiplier": 1.42, "otMultiplier": 1.35 }] }

// hybrid
{
  "baseStrategy": "percentage_markup",
  "baseParams": { "markupPercent": 42 },
  "rules": [{ "type": "volume_discount", "minHours": 500, "discountPercent": 3 }]
}
```

## Verification

- `npm test` — unit tests including the Band 1 example from `pricing-strategy.md`
- Manual: POST timesheet → POST `/invoices/generate` → confirm snapshot + margin in response
- Compliance: GET `/calculation-logs?clientId=…`

## Rollback

`git revert` — isolated backend addition; no impact on existing docs.

## What Did NOT Change

- No UI
- No real money movement or payroll tax withholding
- No candidate data handling
- Existing planning docs unchanged
