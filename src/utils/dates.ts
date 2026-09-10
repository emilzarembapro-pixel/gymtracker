export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pl-PL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

export function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat('pl-PL', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

/** YYYY-MM-DD in the *local* timezone — toISOString() would shift the day. */
export function toDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayISO(): string {
  return toDateStr(new Date());
}

/** Local date string N days before today. */
export function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toDateStr(d);
}

export function formatDurationMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h} godz.`;
  return `${h} godz. ${m} min`;
}

export function formatRelativeDate(dateStr: string): string {
  const today = todayISO();

  if (dateStr === today) return 'Dzisiaj';
  if (dateStr === daysAgoISO(1)) return 'Wczoraj';

  const diff = Math.floor(
    (new Date(today).getTime() - new Date(dateStr).getTime()) / 86400000,
  );

  if (diff > 1 && diff <= 6) return `${diff} dni temu`;

  return formatDateShort(dateStr);
}
