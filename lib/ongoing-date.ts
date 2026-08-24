import { format } from "date-fns";

// The API stores the tournament date as UTC midnight of the chosen calendar day. Formatting with
// local getters would show the previous day west of UTC, so the UTC y/m/d is pinned into a local
// Date before formatting. Every page that renders a tournament date must go through here.
export function eventCalendarDay(dateString: string): Date {
  const stored = new Date(dateString);
  return new Date(stored.getUTCFullYear(), stored.getUTCMonth(), stored.getUTCDate());
}

export function formatEventDateShort(dateString: string): string {
  return format(eventCalendarDay(dateString), "d MMM yyyy");
}

export function formatEventDateLong(dateString: string): string {
  return format(eventCalendarDay(dateString), "PPP");
}

// "Today" is the viewer's own local calendar day, not a UTC one — matches how a person reads "is
// this tournament happening today", not the storage convention above.
export function isEventToday(dateString: string): boolean {
  const day = eventCalendarDay(dateString);
  const today = new Date();
  return (
    day.getFullYear() === today.getFullYear() &&
    day.getMonth() === today.getMonth() &&
    day.getDate() === today.getDate()
  );
}

// startTime is a venue-local wall-clock string ("HH:MM"), never an instant — appended verbatim,
// never reparsed as a Date. Every page's event meta line must go through here.
export function eventMetaLine(
  event: { date: string; startTime: string | null; location: string | null },
  dateStyle: "short" | "long",
): string {
  const formattedDate =
    dateStyle === "short" ? formatEventDateShort(event.date) : formatEventDateLong(event.date);
  return [formattedDate, event.startTime, event.location]
    .filter((part): part is string => Boolean(part))
    .join(" · ");
}
