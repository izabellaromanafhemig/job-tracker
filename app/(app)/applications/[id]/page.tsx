import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ApplicationForm, DeleteApplicationButton } from "@/components/application-form";
import { NewTaskForm, TaskItem } from "@/components/task-form";
import { createClient } from "@/lib/supabase/server";
import type { Application, Task } from "@/lib/types";

async function ApplicationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // RLS: another user's application simply isn't found.
  const { data: application, error } = await supabase
    .from("applications")
    .select("id, company, position, status, applied_on, notes")
    .eq("id", id)
    .maybeSingle<Application>();

  if (error || !application) notFound();

  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("id, application_id, title, due_date, done")
    .eq("application_id", id)
    .order("done")
    .order("due_date", { nullsFirst: false })
    .returns<Task[]>();

  return (
    <>
      <div>
        <Link href="/applications" className="text-sm text-muted-foreground hover:underline">
          ← All applications
        </Link>
        <h1 className="text-2xl font-bold mt-2">
          {application.position} at {application.company}
        </h1>
      </div>

      <section className="flex flex-col gap-4 border rounded-md p-4">
        <h2 className="font-semibold">Details</h2>
        <ApplicationForm application={application} />
      </section>

      <section className="flex flex-col gap-4 border rounded-md p-4">
        <h2 className="font-semibold">Tasks</h2>
        {tasksError ? (
          <p role="alert" className="text-sm text-red-700 dark:text-red-400">
            Could not load the tasks. Please refresh the page.
          </p>
        ) : tasks && tasks.length > 0 ? (
          <ul className="divide-y border rounded-md">
            {tasks.map((t) => (
              <TaskItem key={t.id} task={t} />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No tasks yet.</p>
        )}
        <NewTaskForm applicationId={application.id} />
      </section>

      <section>
        <DeleteApplicationButton id={application.id} />
      </section>
    </>
  );
}

export default function ApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
      <ApplicationDetail params={params} />
    </Suspense>
  );
}
