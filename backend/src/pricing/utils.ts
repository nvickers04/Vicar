import type { InvoiceLineItem, TimesheetLine } from '../types/index.js';

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function roundRate(value: number): number {
  return Math.round(value * 10000) / 10000;
}

export function buildHourlyLineItems(
  lines: TimesheetLine[],
  resolveRates: (line: TimesheetLine) => { stBillRate: number; otBillRate: number; meta?: Record<string, unknown> },
): { lineItems: InvoiceLineItem[]; computedRates: Record<string, unknown> } {
  const lineItems: InvoiceLineItem[] = [];
  const computedRates: Record<string, unknown> = {};

  for (const line of lines) {
    const { stBillRate, otBillRate, meta } = resolveRates(line);
    const key = line.contractorId ?? line.roleCode ?? 'unknown';
    computedRates[key] = { stBillRate, otBillRate, payRate: line.payRate, ...meta };

    if (line.stHours > 0) {
      lineItems.push({
        description: `${line.contractorName ?? line.contractorId} — straight time`,
        contractorId: line.contractorId,
        roleCode: line.roleCode,
        bandId: line.bandId,
        hours: line.stHours,
        hourType: 'ST',
        payRate: line.payRate,
        billRate: stBillRate,
        amount: roundMoney(line.stHours * stBillRate),
        marginPercent: marginPercent(stBillRate, line.payRate),
      });
    }

    if (line.otHours > 0) {
      lineItems.push({
        description: `${line.contractorName ?? line.contractorId} — overtime`,
        contractorId: line.contractorId,
        roleCode: line.roleCode,
        bandId: line.bandId,
        hours: line.otHours,
        hourType: 'OT',
        payRate: line.payRate,
        billRate: otBillRate,
        amount: roundMoney(line.otHours * otBillRate),
        marginPercent: marginPercent(otBillRate, line.payRate),
      });
    }
  }

  return { lineItems, computedRates };
}

export function marginPercent(billRate: number, costRate: number): number {
  if (billRate <= 0) return 0;
  return roundRate(((billRate - costRate) / billRate) * 100);
}

export function subtotalFromLines(lineItems: InvoiceLineItem[]): number {
  return roundMoney(lineItems.reduce((sum, item) => sum + item.amount, 0));
}

export function averagePayRate(lines: TimesheetLine[]): number {
  let totalPay = 0;
  let totalHours = 0;
  for (const line of lines) {
    const hours = line.stHours + line.otHours;
    totalPay += line.payRate * hours;
    totalHours += hours;
  }
  return totalHours > 0 ? roundRate(totalPay / totalHours) : 0;
}

export function linesInBand(lines: TimesheetLine[], bandId: string): TimesheetLine[] {
  return lines.filter((l) => l.bandId === bandId);
}

export function resolveBandForPayRate(
  payRate: number,
  bands: { bandId: string; minPay: number; maxPay: number }[],
): string | undefined {
  const band = bands.find((b) => payRate >= b.minPay && payRate <= b.maxPay);
  return band?.bandId;
}
