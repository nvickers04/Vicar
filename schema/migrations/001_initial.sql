-- Vicar Payroll / Billing Engine — initial schema
-- Target subsystem: Payroll / Billing Engine
-- Rollback: DROP SCHEMA vicar CASCADE; (or reverse migration in a future down script)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS vicar;

-- ---------------------------------------------------------------------------
-- Clients & contractors
-- ---------------------------------------------------------------------------

CREATE TABLE vicar.clients (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    external_ref    TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE vicar.contractors (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id       UUID NOT NULL REFERENCES vicar.clients (id),
    display_name    TEXT NOT NULL,
    role_code       TEXT,
    default_pay_rate NUMERIC(12, 4),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contractors_client ON vicar.contractors (client_id);

-- ---------------------------------------------------------------------------
-- Pricing profiles — one per client or contract, JSONB holds model-specific params
-- Supported strategy_type values match PricingStrategyType in backend code.
-- ---------------------------------------------------------------------------

CREATE TABLE vicar.pricing_profiles (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id           UUID NOT NULL REFERENCES vicar.clients (id),
    contract_ref        TEXT,
    name                TEXT NOT NULL,
    strategy_type       TEXT NOT NULL CHECK (strategy_type IN (
        'percentage_markup',
        'burdened_markup',
        'rate_card',
        'banded',
        'blended',
        'fixed_fee',
        'temp_to_hire',
        'direct_hire',
        'hybrid'
    )),
    params              JSONB NOT NULL DEFAULT '{}',
    margin_min_percent  NUMERIC(5, 2) NOT NULL DEFAULT 34.00,
    margin_max_percent  NUMERIC(5, 2) NOT NULL DEFAULT 40.00,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    effective_from      DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to        DATE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT pricing_profiles_margin_range CHECK (margin_min_percent <= margin_max_percent)
);

CREATE INDEX idx_pricing_profiles_client ON vicar.pricing_profiles (client_id);
CREATE INDEX idx_pricing_profiles_active ON vicar.pricing_profiles (client_id, is_active);

-- ---------------------------------------------------------------------------
-- Timesheets — line items stored as JSONB for flexibility (ST/OT hours per worker)
-- ---------------------------------------------------------------------------

CREATE TABLE vicar.timesheets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id       UUID NOT NULL REFERENCES vicar.clients (id),
    contractor_id   UUID NOT NULL REFERENCES vicar.contractors (id),
    period_start    DATE NOT NULL,
    period_end      DATE NOT NULL,
    status          TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN (
        'draft', 'submitted', 'approved', 'invoiced', 'void'
    )),
    lines           JSONB NOT NULL DEFAULT '[]',
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT timesheets_period CHECK (period_end >= period_start)
);

CREATE INDEX idx_timesheets_client_period ON vicar.timesheets (client_id, period_start, period_end);
CREATE INDEX idx_timesheets_contractor ON vicar.timesheets (contractor_id);

-- ---------------------------------------------------------------------------
-- Rate snapshots — immutable record of rates used at invoice time
-- ---------------------------------------------------------------------------

CREATE TABLE vicar.rate_snapshots (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pricing_profile_id  UUID NOT NULL REFERENCES vicar.pricing_profiles (id),
    client_id           UUID NOT NULL REFERENCES vicar.clients (id),
    strategy_type       TEXT NOT NULL,
    params              JSONB NOT NULL,
    computed_rates      JSONB NOT NULL,
    margin_summary      JSONB NOT NULL DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rate_snapshots_client ON vicar.rate_snapshots (client_id);

-- ---------------------------------------------------------------------------
-- Invoices — totals + immutable line_items JSONB; links to snapshot
-- ---------------------------------------------------------------------------

CREATE TABLE vicar.invoices (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id           UUID NOT NULL REFERENCES vicar.clients (id),
    timesheet_id        UUID REFERENCES vicar.timesheets (id),
    pricing_profile_id  UUID NOT NULL REFERENCES vicar.pricing_profiles (id),
    rate_snapshot_id    UUID NOT NULL REFERENCES vicar.rate_snapshots (id),
    invoice_number      TEXT NOT NULL UNIQUE,
    period_start        DATE NOT NULL,
    period_end          DATE NOT NULL,
    line_items          JSONB NOT NULL DEFAULT '[]',
    subtotal            NUMERIC(14, 2) NOT NULL DEFAULT 0,
    adjustments         NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total               NUMERIC(14, 2) NOT NULL DEFAULT 0,
    margin_percent      NUMERIC(6, 3),
    status              TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'issued', 'paid', 'void'
    )),
    issued_at           TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoices_client ON vicar.invoices (client_id);
CREATE INDEX idx_invoices_timesheet ON vicar.invoices (timesheet_id);

-- ---------------------------------------------------------------------------
-- Payments — contractor payouts and client receipts
-- ---------------------------------------------------------------------------

CREATE TABLE vicar.payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id      UUID REFERENCES vicar.invoices (id),
    client_id       UUID NOT NULL REFERENCES vicar.clients (id),
    contractor_id   UUID REFERENCES vicar.contractors (id),
    payment_type    TEXT NOT NULL CHECK (payment_type IN (
        'contractor_payout', 'client_receipt', 'conversion_fee', 'placement_fee'
    )),
    amount          NUMERIC(14, 2) NOT NULL,
    currency        CHAR(3) NOT NULL DEFAULT 'USD',
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'completed', 'failed', 'void'
    )),
    reference       TEXT,
    paid_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_invoice ON vicar.payments (invoice_id);
CREATE INDEX idx_payments_contractor ON vicar.payments (contractor_id);

-- ---------------------------------------------------------------------------
-- Calculation audit log — compliance guard: every bill calculation is logged
-- ---------------------------------------------------------------------------

CREATE TABLE vicar.calculation_logs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id           UUID NOT NULL REFERENCES vicar.clients (id),
    pricing_profile_id  UUID REFERENCES vicar.pricing_profiles (id),
    invoice_id          UUID REFERENCES vicar.invoices (id),
    operation           TEXT NOT NULL CHECK (operation IN (
        'calculate_bill_rate', 'generate_invoice', 'margin_check', 'preview'
    )),
    input_payload       JSONB NOT NULL,
    output_payload      JSONB NOT NULL,
    margin_percent      NUMERIC(6, 3),
    within_margin_target BOOLEAN,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_calculation_logs_client ON vicar.calculation_logs (client_id, created_at DESC);
CREATE INDEX idx_calculation_logs_invoice ON vicar.calculation_logs (invoice_id);
