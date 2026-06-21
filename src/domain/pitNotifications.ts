export function shouldEmitPitNotifications(
  isLiveSession: boolean,
  previousSessionKey: number | null,
  currentSessionKey: number,
): boolean {
  return isLiveSession && previousSessionKey === currentSessionKey;
}

export function plausiblePitDuration(duration: number | null): number | undefined {
  return typeof duration === 'number'
    && Number.isFinite(duration)
    && duration > 0
    && duration <= 120
    ? duration
    : undefined;
}
