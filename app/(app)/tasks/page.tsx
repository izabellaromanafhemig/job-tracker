import Link from "next/link";
import { Suspense } from "react";
import { TaskItem } from "@/components/task-form";
import { createClient } from "@/lib/supabase/server";
import type { Task } from "@/lib/types";

type TaskWithApplication = Task & {
  applications: { company: string; position: string } | null;
};

async function TaskList() {
  const supabase = await createClient();
  // RLS only returns rows that belong to the logged-in user.
  const { data, error } = await supabase
    .from("tasks")
    .select("id, application_id, title, due_date, done, applications (company, position)")
    .order("done")
    .order("due_date", { nullsFirst: false })
    .returns<TaskWithApplication[]>();

  if (error) {
    console.error("TaskList", error);
    return (
      <p role="alert" className="text-sm text-red-700 dark:text-red-400">
        Could not load your tasks. Please refresh the page.
      </p>
    );
  }

  if (!data.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No tasks yet. Open an{" "}
        <Link href="/applications" className="underline">
          application
        </Link>{" "}
        to add one.
      </p>
    );
  }

  return (
    <ul className="divide-y border rounded-md">
      {data.map(({ applications, ...task }) => (
        <TaskItem
          key={task.id}
          task={task}
          application={{
            id: task.application_id,
            label: applications
              ? `${applications.position} at ${applications.company}`
              : "Application",
          }}
        />
      ))}
    </ul>
  );
}

export default function TasksPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Tasks</h1>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
        <TaskList />
      </Suspense>
    </>
  );
}
