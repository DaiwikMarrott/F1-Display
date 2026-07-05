import { describe, expect, it } from 'vitest';
import {
  buildReplayWindowPath,
  getReplayMapTimestamp,
  recordsKnownAtReplayTime,
} from './replay';

describe('bounded replay records', () => {
  it('keeps only records known at or before the replay timestamp', () => {
    const records = [
      { id: 1, date: '2025-05-25T13:00:10Z' },
      { id: 2, date_start: '2025-05-25T13:00:20Z' },
      { id: 3, date: '2025-05-25T13:00:30Z' },
      { id: 4, date: 'invalid' },
    ];

    expect(recordsKnownAtReplayTime(records, '2025-05-25T13:00:20Z').map(record => record.id))
      .toEqual([1, 2]);
  });

  it('builds a session-aware bounded historical window', () => {
    const path = buildReplayWindowPath(
      '/location',
      9555,
      '2025-05-25T13:10:00Z',
      2_000,
      1_000,
    );

    expect(path).toContain('/location?session_key=9555');
    expect(path).toContain('&date>=');
    expect(path).toContain('&date<=');
    expect(path).not.toContain('latest');
  });

  it('coalesces frequent replay ticks into stable request buckets', () => {
    const start = '2025-05-25T13:00:00Z';
    expect(getReplayMapTimestamp(start, '2025-05-25T13:01:00Z'))
      .toBe(getReplayMapTimestamp(start, '2025-05-25T13:04:59Z'));
    expect(getReplayMapTimestamp(start, '2025-05-25T13:05:00Z'))
      .not.toBe(getReplayMapTimestamp(start, '2025-05-25T13:04:59Z'));
  });
});
