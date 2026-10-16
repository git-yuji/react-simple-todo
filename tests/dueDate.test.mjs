import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dueDateState, isDueDate, localDateKey } from '../src/utils/dueDate.ts';

test('期限日は実在するYYYY-MM-DD形式の暦日だけを受け付ける', () => {
  for (const value of ['0001-01-01', '2000-02-29', '2024-02-29', '2026-10-16', '9999-12-31']) {
    assert.equal(isDueDate(value), true, value);
  }
  for (const value of [null, undefined, 20261016, '', '0000-01-01', '1900-02-29', '2026-02-29',
    '2026-04-31', '2026-00-01', '2026-13-01', '2026-01-00', '2026-1-01', '2026-10-16\n',
    ' 2026-10-16', '2026-10-16T00:00:00Z']) {
    assert.equal(isDueDate(value), false, String(value));
  }
});

test('今日・過去・未来と期限なしを区別し、完了済みは強調しない', () => {
  const today = '2026-10-16';
  assert.equal(dueDateState(undefined, false, today), 'none');
  assert.equal(dueDateState(null, false, today), 'none');
  assert.equal(dueDateState('2026-10-15', false, today), 'overdue');
  assert.equal(dueDateState(today, false, today), 'today');
  assert.equal(dueDateState('2026-10-17', false, today), 'normal');
  assert.equal(dueDateState('2026-10-15', true, today), 'normal');
  assert.equal(dueDateState(today, true, today), 'normal');
  assert.equal(dueDateState('2025-12-31', false, '2026-01-01'), 'overdue');
});

test('今日のキーはローカル日付をゼロ埋めして作る', () => {
  assert.equal(localDateKey(new Date(2026, 0, 2, 0, 30)), '2026-01-02');
  assert.equal(localDateKey(new Date(2026, 11, 31, 23, 59)), '2026-12-31');
});
