import Link from "next/link";
import { Suspense } from "react";
import { AttentionList } from "@/components/dashboard/attention-list";
import { StatTile } from "@/components/dashboard/stat-tile";
import { StatusBars } from "@/components/dashboard/status-bars";
import { WeeklyBars } from "@/components/dashboard/weekly-bars";
import { Button } from "@/components/ui/button";
import { computeStats, localToday, type StatsApplication } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";

type TaskRow = {
  id: string;
  title: string;
  due_date: string | null;
  done: boolean;
  application_id: string;
  applications: { company: string; position: string } | null;
};

async function Dashboard() {
  const supabase = await createClient();
  // RLS only returns rows that belong to the logged-in user.
  const [apps, tasks] = await Promise.all([
    supabase.from("applications").select("status, applied_on").returns<StatsApplication[]>(),
    supabase
      .from("tasks")
      .select("id, title, due_date, done, application_id, applications (company, position)")
      .returns<TaskRow[]>(),
  ]);

  if (apps.error || tasks.error) {
    console.error("Dashboard", apps.error ?? tasks.error);
    return (
      <p role="alert" className="text-sm text-red-700 dark:text-red-400">
        Could not load your stats. Please refresh the page.
      </p>
    );
  }

  if (apps.data.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-md border p-6">
        <p className="font-medium">No data yet</p>
        <p className="text-sm text-muted-foreground">
          Add or import your first application to see your stats here.
        </p>
        <Button asChild size="sm">
          <Link href="/applications">Go to Applications</Link>
        </Button>
      </div>
    );
  }

  const stats = computeStats(
    apps.data,
    tasks.data.map(({ applications, ...t }) => ({
      ...t,
      application_label: applications
        ? `${applications.position} at ${applications.company}`
        : "Application",
    })),
    localToday(),
  );

  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Total applications" value={stats.total} />
        <StatTile label="Active" value={stats.active} note="Applied or interviewing" />
        <StatTile
          label="Interview rate"
          value={stats.interviewRate === null ? "—" : `${stats.interviewRate}%`}
          note="Now interviewing or with an offer"
        />
        <StatTile label="Offers" value={stats.offers} />
        <StatTile label="Last 30 days" value={stats.last30Days} note="Applications sent" />
        <StatTile
          label="Open tasks"
          value={stats.openTasks}
          note={stats.overdueTasks > 0 ? `⚠ ${stats.overdueTasks} overdue` : "None overdue"}
          noteTone={stats.overdueTasks > 0 ? "alert" : "muted"}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <StatusBars byStatus={stats.byStatus} total={stats.total} />
        <WeeklyBars weekly={stats.weekly} />
      </div>
      <AttentionList tasks={stats.attention} />
    </>
  );
}

export default function DashboardPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
        <Dashboard />
      </Suspense>
    </>
  );
}
