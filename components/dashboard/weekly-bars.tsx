import { ChartCard, DataTable } from "@/components/dashboard/chart-card";
import { WEEKS_SHOWN, type Stats } from "@/lib/stats";

const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const formatWeek = (iso: string) => shortDate.format(new Date(`${iso}T00:00:00Z`));

/** Vertical bars: applications per week (by application date), oldest week on the left. */
export function WeeklyBars({ weekly }: { weekly: Stats["weekly"] }) {
  const max = Math.max(1, ...weekly.map((w) => w.count));

  const chart = (
    <div className="flex flex-col gap-2">
      <div className="relative h-40">
        {/* Recessive guide lines: top = busiest week, bottom = zero. */}
        <div className="absolute inset-x-0 top-0 border-t border-dashed border-border" />
        <span className="absolute right-0 -top-5 text-xs text-muted-foreground tabular-nums">
          {max}
        </span>
        <div className="absolute inset-x-0 bottom-0 border-t border-border" />
        <div className="absolute inset-0 grid grid-cols-12 items-end gap-0.5">
          {weekly.map((w) => (
            <div
              key={w.weekStart}
              className="group relative flex h-full items-end justify-center"
              tabIndex={0}
              aria-label={`Week of ${formatWeek(w.weekStart)}: ${w.count}`}
            >
              {w.count > 0 && (
                <div
                  className="w-full max-w-10 rounded-t bg-primary"
                  style={{ height: `${(w.count / max) * 100}%` }}
                />
              )}
              <span className="pointer-events-none absolute -top-7 z-10 hidden whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground shadow group-hover:block group-focus-visible:block">
                Week of {formatWeek(w.weekStart)}: {w.count}
              </span>
            </div>
          ))}
        </div>
      </div>
      {/* Label every 3rd week (and the current one) so labels never collide. */}
      <div className="grid grid-cols-12 gap-0.5 text-center text-xs text-muted-foreground">
        {weekly.map((w, i) => (
          <span key={w.weekStart}>
            {i === WEEKS_SHOWN - 1 ? "This wk" : i % 3 === 0 ? formatWeek(w.weekStart) : ""}
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <ChartCard
      title="Applications per week"
      description={`Last ${WEEKS_SHOWN} weeks, by application date. Weeks start on Monday.`}
      chart={chart}
      table={
        <DataTable
          headers={["Week of", "Applications"]}
          rows={weekly.map((w) => [formatWeek(w.weekStart), w.count])}
        />
      }
    />
  );
}
