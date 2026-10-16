// 時刻・タイムゾーンを含まない暦日（YYYY-MM-DD）として扱います。
export function isDueDate(value: unknown): value is string {
  if (typeof value !== 'string' || value.length !== 10 || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1 || month < 1 || month > 12) return false;
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day >= 1 && day <= days[month - 1];
}

export function localDateKey(date: Date): string {
  return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function dueDateState(dueDate: string | null | undefined, completed: boolean, today: string) {
  if (!dueDate) return 'none';
  if (completed) return 'normal';
  if (dueDate < today) return 'overdue';
  if (dueDate === today) return 'today';
  return 'normal';
}
