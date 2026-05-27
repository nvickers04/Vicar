import { v4 as uuidv4 } from 'uuid';
import type { CalculationLog } from '../types/index.js';

const logs: CalculationLog[] = [];

/** Compliance guard — logs every bill calculation for audit trail. */
export function logCalculation(
  entry: Omit<CalculationLog, 'id' | 'createdAt'>,
): CalculationLog {
  const log: CalculationLog = {
    ...entry,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  logs.push(log);
  return log;
}

export function getCalculationLogs(clientId?: string): CalculationLog[] {
  if (!clientId) return [...logs];
  return logs.filter((l) => l.clientId === clientId);
}

export function clearCalculationLogs(): void {
  logs.length = 0;
}
