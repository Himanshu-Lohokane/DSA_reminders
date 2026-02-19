import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTodayDate(): string {
  // Returns YYYY-MM-DD in UTC
  return new Date().toISOString().split('T')[0];
}

export function getDateKeyInTimeZone(date: Date, timeZone?: string): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find(p => p.type === 'year')?.value ?? '0000';
  const month = parts.find(p => p.type === 'month')?.value ?? '00';
  const day = parts.find(p => p.type === 'day')?.value ?? '00';

  return `${year}-${month}-${day}`;
}

export function getTodayDateInTimeZone(timeZone?: string): string {
  return getDateKeyInTimeZone(new Date(), timeZone);
}

export function getDateTimePartsInTimeZone(timeZone?: string): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(new Date());
  const read = (type: string) => parts.find(p => p.type === type)?.value ?? '0';

  return {
    year: Number(read('year')),
    month: Number(read('month')),
    day: Number(read('day')),
    hour: Number(read('hour')),
    minute: Number(read('minute')),
  };
}

export function getWeekdayIndexInTimeZone(timeZone?: string): number {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short'
  }).format(new Date());

  const order = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const index = order.indexOf(weekday);
  return index === -1 ? 0 : index;
}

export function getTimeAgo(timestamp: string | null | undefined): string {
  if (!timestamp) return 'Never';
  const now = Date.now();
  const then = parseInt(timestamp) * 1000;
  const diff = now - then;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return 'Long ago';
}
