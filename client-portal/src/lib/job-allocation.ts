import type { Job } from './types';
import { round2 } from './time-utils';

/** Even split: 50/50 for two jobs, 1/3 each for three, etc. */
export function evenAllocation(jobCount: number): number[] {
  if (jobCount <= 0) return [];
  const base = round2(100 / jobCount);
  const percents = Array.from({ length: jobCount }, () => base);
  const sum = percents.reduce((a, b) => a + b, 0);
  percents[jobCount - 1] = round2(percents[jobCount - 1] + (100 - sum));
  return percents;
}

export function rebalanceTwoWay(firstPercent: number): [number, number] {
  const a = round2(Math.min(95, Math.max(5, firstPercent)));
  return [a, round2(100 - a)];
}

export function jobLabels(jobs: Job[], jobIds: string[]): string {
  return jobIds
    .map((id) => jobs.find((j) => j.id === id)?.jobNumber ?? '?')
    .join(' / ');
}
