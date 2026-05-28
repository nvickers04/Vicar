export type OtRule = 'daily_8' | 'daily_10' | 'weekly_40';
export type EntryMode = 'start_end' | 'start_hours';

export interface ContractorTimeDefaults {
  defaultStartTime: string;
  defaultBreakMinutes: number;
  otRule: OtRule;
  defaultEntryMode: EntryMode;
}

export interface Contractor {
  id: string;
  clientId: string;
  displayName: string;
  roleCode?: string;
  defaultPayRate?: number;
  status?: 'active' | 'inactive';
  timeDefaults: ContractorTimeDefaults;
}

export interface Job {
  id: string;
  clientId: string;
  jobNumber: string;
  name?: string;
  status: 'active' | 'closed' | 'void';
}

export interface PortalUser {
  id: string;
  clientId: string;
  email: string;
  role: 'client';
  name: string;
}

/** Per-day job allocation within a cell. */
export interface JobSplitOverride {
  jobId: string;
  allocationPercent: number;
}

export interface InvoiceLineItem {
  hours: number;
  hourType: 'ST' | 'OT' | 'FEE' | 'PASS_THROUGH';
  amount: number;
}

export interface ClientInvoiceLinesByJob {
  jobId: string;
  jobNumber: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
}

export interface ContractorPaymentLine {
  contractorId: string;
  contractorName?: string;
  jobId: string;
  jobNumber: string;
  stHours: number;
  otHours: number;
  totalAmount: number;
}

export interface WeeklyTimesheetSubmission {
  id: string;
  clientId: string;
  periodStart: string;
  periodEnd: string;
  status: 'draft' | 'submitted';
  entryCount: number;
  totalStHours: number;
  totalOtHours: number;
  payrollResult?: {
    totalInvoice: number;
    totalContractorPayout: number;
    marginPercent: number;
    invoiceLinesByJob?: ClientInvoiceLinesByJob[];
    contractorPayments?: ContractorPaymentLine[];
  };
  submittedAt?: string;
  createdAt: string;
}

export interface PayrollRunPayload {
  periodStart: string;
  periodEnd: string;
  entries: {
    jobId: string;
    contractorId: string;
    workDate: string;
    stHours: number;
    otHours: number;
    payRate?: number;
  }[];
}
