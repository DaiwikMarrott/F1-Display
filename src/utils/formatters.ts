const UNAVAILABLE = 'Unavailable';

export function finiteOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function nonNegativeOrNull(value: unknown): number | null {
  const finite = finiteOrNull(value);
  return finite !== null && finite >= 0 ? finite : null;
}

export function positiveOrNull(value: unknown): number | null {
  const finite = finiteOrNull(value);
  return finite !== null && finite > 0 ? finite : null;
}

export function clampPercent(value: unknown): number | null {
  const finite = finiteOrNull(value);
  return finite === null ? null : Math.min(100, Math.max(0, finite));
}

export function formatNumber(
  value: unknown,
  options: { digits?: number; suffix?: string; fallback?: string } = {},
): string {
  const finite = finiteOrNull(value);
  if (finite === null) return options.fallback ?? UNAVAILABLE;
  return `${finite.toFixed(options.digits ?? 1)}${options.suffix ?? ''}`;
}

export function formatLapProgress(currentLap: unknown, totalLaps: unknown): string {
  const current = nonNegativeOrNull(currentLap);
  const total = positiveOrNull(totalLaps);
  if (current === null || total === null || current === 0) return 'Waiting for session data';
  if (current > total) return UNAVAILABLE;
  return `LAP ${Math.floor(current)} / ${Math.floor(total)}`;
}

export function formatLapTime(seconds: unknown): string {
  const value = positiveOrNull(seconds);
  if (value === null) return UNAVAILABLE;
  const minutes = Math.floor(value / 60);
  const remaining = value - minutes * 60;
  return `${minutes}:${remaining.toFixed(3).padStart(6, '0')}`;
}

export function formatSignedSeconds(value: unknown): string {
  const finite = finiteOrNull(value);
  if (finite === null) return UNAVAILABLE;
  const sign = finite > 0 ? '+' : finite < 0 ? '−' : '';
  return `${sign}${Math.abs(finite).toFixed(1)}s`;
}

export function safeTireAge(value: unknown): number | null {
  const age = nonNegativeOrNull(value);
  return age === null ? null : Math.floor(age);
}
