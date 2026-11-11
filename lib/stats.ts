import { STATUSES, STATUS_LABELS, type Status } from "@/lib/types";

export type StatsApplication = { status: Status; applied_on: string };

export type StatsTask = {
  id: string;
  title: string;
  due_date: string | null;
  done: boolean;
  application_id: string;
  application_label: string;
};

export type AttentionTask = StatsTask & { due_date: string; overdue: boolean };

export type Stats = {
  total: number;
  active: number;
  offers: number;
  /** (interviewing + offer) / total, 0–100; null when there are no applications. */
  interviewRate: number | null;
  last30Days: number;
  openTasks: number;
  overdueTasks: number;
  byStatus: { status: Status; label: string; count: number; percent: number }[];
  /** Oldest week first. `weekStart` is a Monday (YYYY-MM-DD). */
  weekly: { weekStart: string; count: number }[];
  attention: AttentionTask[];
};

export const WEEKS_SHOWN = 12;
const ATTENTION_DAYS = 7;
const ATTENTION_MAX = 8;

// Dates are handled as "YYYY-MM-DD" strings (what Postgres returns for `date`).
// Arithmetic goes through UTC so time zones never shift a day.
const toUtc = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
const fromUtc = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const addDays = (iso: string, days: number) => fromUtc(toUtc(iso) + days * 86_400_000);

/** Monday of the week containing `iso`. */
export function weekStartOf(iso: string): string {
  const weekday = new Date(toUtc(iso)).getUTCDay(); // 0 = Sunday
  return addDays(iso, -((weekday + 6) % 7));
}

/** Today's date on this machine as YYYY-MM-DD. */
export function localToday(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function computeStats(
  applications: StatsApplication[],
  tasks: StatsTask[],
  today: string,
): Stats {
  const total = applications.length;
  const count = (s: Status) => applications.filter((a) => a.status === s).length;

  const byStatus = STATUSES.map((status) => {
    const n = count(status);
    return {
      status,
      label: STATUS_LABELS[status],
      count: n,
      percent: total ? Math.round((n / total) * 100) : 0,
    };
  });
  const n = Object.fromEntries(byStatus.map((s) => [s.status, s.count])) as Record<Status, number>;

  const thirtyDaysAgo = addDays(today, -29); // today counts as one of the 30 days
  const last30Days = applications.filter(
    (a) => a.applied_on >= thirtyDaysAgo && a.applied_on <= today,
  ).length;

  const currentWeek = weekStartOf(today);
  const firstWeek = addDays(currentWeek, -7 * (WEEKS_SHOWN - 1));
  const weekly = Array.from({ length: WEEKS_SHOWN }, (_, i) => ({
    weekStart: addDays(firstWeek, 7 * i),
    count: 0,
  }));
  for (const a of applications) {
    if (a.applied_on < firstWeek || a.applied_on > addDays(currentWeek, 6)) continue;
    const index = (toUtc(weekStartOf(a.applied_on)) - toUtc(firstWeek)) / (7 * 86_400_000);
    weekly[index].count++;
  }

  const open = tasks.filter((t) => !t.done);
  const overdueTasks = open.filter((t) => t.due_date !== null && t.due_date < today).length;
  const horizon = addDays(today, ATTENTION_DAYS);
  const attention = open
    .filter((t): t is StatsTask & { due_date: string } => t.due_date !== null && t.due_date <= horizon)
    .sort((a, b) => a.due_date.localeCompare(b.due_date) || a.title.localeCompare(b.title))
    .slice(0, ATTENTION_MAX)
    .map((t) => ({ ...t, overdue: t.due_date < today }));

  return {
    total,
    active: n.applied + n.interviewing,
    offers: n.offer,
    interviewRate: total ? Math.round(((n.interviewing + n.offer) / total) * 100) : null,
    last30Days,
    openTasks: open.length,
    overdueTasks,
    byStatus,
    weekly,
    attention,
  };
}
