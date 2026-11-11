import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { AttentionTask } from "@/lib/stats";

/** Open tasks that are overdue or due within the next 7 days. */
export function AttentionList({ tasks }: { tasks: AttentionTask[] }) {
  return (
    <section className="flex flex-col gap-4 rounded-md border p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">Tasks needing attention</h2>
          <p className="text-sm text-muted-foreground">Overdue or due in the next 7 days.</p>
        </div>
        <Link href="/tasks" className="text-sm hover:underline">
          All tasks →
        </Link>
      </div>
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing due soon. 🎉</p>
      ) : (
        <ul className="divide-y">
          {tasks.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
              <div className="min-w-0">
                <p className="font-medium">{t.title}</p>
                <Link
                  href={`/applications/${t.application_id}`}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  {t.application_label}
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <span className="tabular-nums text-muted-foreground">{t.due_date}</span>
                {t.overdue && (
                  <Badge variant="outline" className="border-red-300 text-red-700 dark:border-red-800 dark:text-red-400">
                    ⚠ Overdue
                  </Badge>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
