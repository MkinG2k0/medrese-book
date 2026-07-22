/** Часовой пояс приложения (календарные дни журнала). */
export const APP_TIMEZONE = "Europe/Moscow";

const CALENDAR_DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

/** Календарная дата YYYY-MM-DD в часовом поясе приложения. */
export function getLocalDateString(
  date: Date = new Date(),
  timeZone: string = APP_TIMEZONE,
): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(date);
}

export function isValidCalendarDate(dateStr: string): boolean {
  return CALENDAR_DATE_FORMAT.test(dateStr);
}

/** Календарный день позже «сегодня» в часовом поясе приложения. */
export function isFutureCalendarDay(
  calendarDay: string,
  today: string = getLocalDateString(),
): boolean {
  return calendarDay > today;
}

/**
 * Временно разрешает выбор/оценку будущих дней в журнале.
 * Env: `NEXT_PUBLIC_ALLOW_FUTURE_JOURNAL_DATES=true` (в проде обычно не задавать).
 */
export function allowFutureJournalDates(): boolean {
  const value = process.env.NEXT_PUBLIC_ALLOW_FUTURE_JOURNAL_DATES;
  return value === "true" || value === "1";
}

/** Блокирует ли день для навигации в журнале (с учётом временного флага). */
export function isJournalFutureDayBlocked(
  calendarDay: string,
  today: string = getLocalDateString(),
): boolean {
  if (allowFutureJournalDates()) return false;
  return isFutureCalendarDay(calendarDay, today);
}

/** Совпадает ли момент времени с календарным днём YYYY-MM-DD. */
export function isSameCalendarDay(
  date: Date,
  dateStr: string,
  timeZone: string = APP_TIMEZONE,
): boolean {
  return getLocalDateString(date, timeZone) === dateStr;
}

/**
 * Широкий интервал для выборки сессий из БД с последующей фильтрацией
 * по календарному дню (покрывает старые записи с произвольным временем).
 */
export function getCalendarDayQueryRange(dateStr: string): {
  start: Date;
  end: Date;
} {
  const noon = new Date(`${dateStr}T12:00:00.000Z`);
  const dayMs = 24 * 60 * 60 * 1000;
  return {
    start: new Date(noon.getTime() - dayMs),
    end: new Date(noon.getTime() + dayMs),
  };
}

/** Дата сессии для выбранного календарного дня (полдень UTC). */
export function toSessionDate(calendarDateStr: string): Date {
  return new Date(`${calendarDateStr}T12:00:00.000Z`);
}
