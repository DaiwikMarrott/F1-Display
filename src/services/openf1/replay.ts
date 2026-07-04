type ReplayDatedRecord = {
  date?: string;
  date_start?: string;
};

function timestamp(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getReplayRecordTimestamp(record: ReplayDatedRecord): number | null {
  return timestamp(record.date) ?? timestamp(record.date_start);
}

export function recordsKnownAtReplayTime<T extends ReplayDatedRecord>(
  records: T[],
  replayTimestamp: string,
): T[] {
  const replayTime = timestamp(replayTimestamp);
  if (replayTime === null) return [];
  return records.filter(record => {
    const recordTime = getReplayRecordTimestamp(record);
    return recordTime !== null && recordTime <= replayTime;
  });
}

function iso(value: number): string {
  return new Date(value).toISOString();
}

export function buildReplayWindowPath(
  endpoint: string,
  sessionKey: number,
  replayTimestamp: string,
  lookbackMs: number,
  lookaheadMs = 0,
): string | null {
  const replayTime = timestamp(replayTimestamp);
  if (replayTime === null || !Number.isFinite(sessionKey) || lookbackMs < 0 || lookaheadMs < 0) {
    return null;
  }
  const resource = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${resource}?session_key=${sessionKey}`
    + `&date>=${encodeURIComponent(iso(replayTime - lookbackMs))}`
    + `&date<=${encodeURIComponent(iso(replayTime + lookaheadMs))}`;
}
