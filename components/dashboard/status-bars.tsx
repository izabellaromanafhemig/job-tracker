import { ChartCard, DataTable } from "@/components/dashboard/chart-card";
import type { Stats } from "@/lib/stats";

/** Horizontal bars: how many applications are in each status. */
export function StatusBars({ byStatus, total }: { byStatus: Stats["byStatus"]; total: number }) {
  const max = Math.max(1, ...byStatus.map((s) => s.count));

  const chart = (
    <ul className="flex flex-col gap-3">
      {byStatus.map((s) => (
        <li key={s.status} className="grid grid-cols-[6.5rem_1fr_5.5rem] items-center gap-3 text-sm">
          <span>{s.label}</span>
          <div className="group relative h-5" tabIndex={0} aria-label={`${s.label}: ${s.count}`}>
            {s.count > 0 && (
              <div
                className="h-full rounded-r bg-primary"
                style={{ width: `${(s.count / max) * 100}%` }}
              />
            )}
            <span className="pointer-events-none absolute -top-8 left-0 z-10 hidden whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground shadow group-hover:block group-focus-visible:block">
              {s.label}: {s.count} of {total} ({s.percent}%)
            </span>
          </div>
          <span className="text-right tabular-nums">
            {s.count} <span className="text-muted-foreground">({s.percent}%)</span>
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <ChartCard
      title="Applications by status"
      description="Where each application stands right now."
      chart={chart}
      table={
        <DataTable
          headers={["Status", "Applications", "Share"]}
          rows={byStatus.map((s) => [s.label, s.count, `${s.percent}%`])}
        />
      }
    />
  );
}
