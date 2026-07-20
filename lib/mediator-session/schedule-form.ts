import {
  DEFAULT_SCHEDULE_DURATION_MINUTES,
  isScheduleDurationOption,
  pad2,
  snapToScheduleMinute,
  type ScheduleDurationOption,
  type ScheduleMinuteOption,
} from "@/lib/mediator-session/schedule-options";

export type ScheduleParts = {
  date: string;
  hour: string;
  minute: ScheduleMinuteOption;
};

export function toScheduleParts(iso: string | null | undefined): ScheduleParts | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return {
    date: `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`,
    hour: pad2(date.getHours()),
    minute: snapToScheduleMinute(date.getMinutes()),
  };
}

export function partsToIso(parts: ScheduleParts): string | null {
  if (!parts.date || parts.hour === "") return null;
  const [year, month, day] = parts.date.split("-").map(Number);
  const hour = Number(parts.hour);
  if (![year, month, day, hour].every((n) => Number.isFinite(n))) return null;
  const local = new Date(year, month - 1, day, hour, parts.minute, 0, 0);
  if (Number.isNaN(local.getTime())) return null;
  return local.toISOString();
}

export function normalizeDuration(value: number | null | undefined): ScheduleDurationOption {
  if (typeof value === "number" && isScheduleDurationOption(value)) return value;
  return DEFAULT_SCHEDULE_DURATION_MINUTES;
}

export function dateKeyFromDate(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function dateKeyFromIso(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return dateKeyFromDate(date);
}
