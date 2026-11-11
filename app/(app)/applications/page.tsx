import Link from "next/link";
import { Suspense } from "react";
import { ApplicationForm } from "@/components/application-form";
import { ExportApplications, ImportApplications } from "@/components/import-export-applications";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { STATUS_LABELS, type Application } from "@/lib/types";

async function ApplicationList() {
  const supabase = await createClient();
  // RLS only returns rows that belong to the logged-in user.
  const { data, error } = await supabase
    .from("applications")
    .select("id, company, position, status, applied_on, notes")
    .order("applied_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("ApplicationList", error);
    return (
      <p role="alert" className="text-sm text-red-700 dark:text-red-400">
        Could not load your applications. Please refresh the page.
      </p>
    );
  }

  const applications = data as Application[];
  if (applications.length === 0) {
    return <p className="text-sm text-muted-foreground">No applications yet.</p>;
  }

  return (
    <ul className="divide-y border rounded-md">
      {applications.map((a) => (
        <li key={a.id}>
          <Link
            href={`/applications/${a.id}`}
            className="flex items-center justify-between gap-4 p-4 hover:bg-accent"
          >
            <div>
              <p className="font-medium">{a.company}</p>
              <p className="text-sm text-muted-foreground">{a.position}</p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">{a.applied_on}</span>
              <Badge variant="outline">{STATUS_LABELS[a.status]}</Badge>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function ApplicationsPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Applications</h1>
      <section className="flex flex-col gap-4 border rounded-md p-4">
        <h2 className="font-semibold">Add an application</h2>
        <ApplicationForm />
      </section>
      <section className="flex flex-col gap-4 border rounded-md p-4">
        <h2 className="font-semibold">Import / export</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <ImportApplications />
          <ExportApplications />
        </div>
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="font-semibold">Your applications</h2>
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
          <ApplicationList />
        </Suspense>
      </section>
    </>
  );
}
