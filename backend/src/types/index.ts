/** Supported pricing strategy identifiers — one per client/contract profile. */
export type PricingStrategyType =
  | 'percentage_markup'
  | 'burdened_markup'
  | 'rate_card'
  | 'banded'
  | 'blended'
  | 'fixed_fee'
  | 'temp_to_hire'
  | 'direct_hire'
  | 'hybrid';

/** Gross margin target band from core-business-plan (34–40%). */
export const DEFAULT_MARGIN_MIN = 34;
export const DEFAULT_MARGIN_MAX = 40;

export interface Client {
  id: string;
  name: string;
  externalRef?: string;
  createdAt: string;
}

export interface Contractor {
  id: string;
  clientId: string;
  displayName: string;
  roleCode?: string;
  defaultPayRate?: number;
  createdAt: string;
}

/** Client work order identified by a job number (used on invoices). */
export interface Job {
  id: string;
  clientId: string;
  jobNumber: string;
  name?: string;
  status: 'active' | 'closed' | 'void';
  createdAt: string;
  updatedAt: string;
}

/** Per-day straight-time and overtime hours for one contractor on one job. */
export interface TimesheetEntry {
  id: string;
  clientId: string;
  timesheetId?: string;
  jobId: string;
  contractorId: string;
  /** ISO date (YYYY-MM-DD). */
  workDate: string;
  stHours: number;
  otHours: number;
  payRate: number;
  contractorName?: string;
  roleCode?: string;
  bandId?: string;
  burdenedCostPerHour?: number;
  createdAt: string;
}

/** Per-client (or per-contract) pricing configuration. */
export interface PricingProfile {
  id: string;
  clientId: string;
  contractRef?: string;
  name: string;
  strategyType: PricingStrategyType;
  /** Model-specific parameters — see pricing/types.ts for shapes. */
  params: Record<string, unknown>;
  marginMinPercent: number;
  marginMaxPercent: number;
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  createdAt: string;
}

export interface TimesheetLine {
  contractorId: string;
  contractorName?: string;
  roleCode?: string;
  payRate: number;
  /** Straight-time hours worked. */
  stHours: number;
  /** Overtime hours worked. */
  otHours: number;
  /** Optional burdened (loaded) cost per hour for burdened_markup model. */
  burdenedCostPerHour?: number;
  /** Band label for banded pricing grouping. */
  bandId?: string;
}

export interface Timesheet {
  id: string;
  clientId: string;
  contractorId: string;
  periodStart: string;
  periodEnd: string;
  status: 'draft' | 'submitted' | 'approved' | 'invoiced' | 'void';
  lines: TimesheetLine[];
  notes?: string;
  createdAt: string;
}

export interface InvoiceLineItem {
  description: string;
  contractorId?: string;
  jobId?: string;
  jobNumber?: string;
  roleCode?: string;
  bandId?: string;
  hours: number;
  hourType: 'ST' | 'OT' | 'FEE' | 'PASS_THROUGH';
  payRate: number;
  billRate: number;
  amount: number;
  marginPercent?: number;
}

/** Immutable snapshot of rates used when an invoice is generated. */
export interface RateSnapshot {
  id: string;
  pricingProfileId: string;
  clientId: string;
  strategyType: PricingStrategyType;
  params: Record<string, unknown>;
  computedRates: Record<string, unknown>;
  marginSummary: {
    grossMarginPercent?: number;
    withinTarget?: boolean;
    warnings?: string[];
  };
  createdAt: string;
}

export interface Invoice {
  id: string;
  clientId: string;
  timesheetId?: string;
  pricingProfileId: string;
  rateSnapshotId: string;
  invoiceNumber: string;
  periodStart: string;
  periodEnd: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  adjustments: number;
  total: number;
  marginPercent?: number;
  status: 'draft' | 'issued' | 'paid' | 'void';
  issuedAt?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  invoiceId?: string;
  clientId: string;
  contractorId?: string;
  paymentType: 'contractor_payout' | 'client_receipt' | 'conversion_fee' | 'placement_fee';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'void';
  reference?: string;
  paidAt?: string;
  createdAt: string;
}

/** Compliance audit entry — every calculation is logged. */
export interface CalculationLog {
  id: string;
  clientId: string;
  pricingProfileId?: string;
  invoiceId?: string;
  operation: 'calculate_bill_rate' | 'generate_invoice' | 'margin_check' | 'preview' | 'run_payroll';
  inputPayload: Record<string, unknown>;
  outputPayload: Record<string, unknown>;
  marginPercent?: number;
  withinMarginTarget?: boolean;
  createdAt: string;
}

/** Contractor payout derived from timesheet entries. */
export interface ContractorPaymentLine {
  contractorId: string;
  contractorName?: string;
  jobId: string;
  jobNumber: string;
  stHours: number;
  otHours: number;
  payRate: number;
  stAmount: number;
  otAmount: number;
  totalAmount: number;
}

/** Client invoice subtotal grouped by job number. */
export interface ClientInvoiceLinesByJob {
  jobId: string;
  jobNumber: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  marginPercent?: number;
}

/** Result of runPayroll — client invoice lines per job + contractor payments. */
export interface PayrollRunResult {
  clientId: string;
  periodStart: string;
  periodEnd: string;
  invoiceLinesByJob: ClientInvoiceLinesByJob[];
  totalInvoice: number;
  totalContractorPayout: number;
  marginPercent: number;
  contractorPayments: ContractorPaymentLine[];
  computedRates: Record<string, unknown>;
}
