"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import {
  createApplication,
  deleteApplication,
  updateApplication,
} from "@/app/(app)/applications/actions";
import { FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { STATUSES, STATUS_LABELS, type Application } from "@/lib/types";

const fieldClass =
  "flex w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm";

/** Without `application` it creates a new one; with it, it edits that one. */
export function ApplicationForm({ application }: { application?: Application }) {
  const [state, formAction, pending] = useActionState(
    application ? updateApplication : createApplication,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the "new application" form after a successful save.
  useEffect(() => {
    if (state?.ok && !application) formRef.current?.reset();
  }, [state, application]);

  return (
    <form
      ref={formRef}
      // Submit manually so React does not clear the fields when saving fails.
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
      className="flex flex-col gap-4"
    >
      {application && <input type="hidden" name="id" value={application.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="company">Company</Label>
          <Input id="company" name="company" required defaultValue={application?.company} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="position">Position</Label>
          <Input id="position" name="position" required defaultValue={application?.position} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={application?.status ?? "applied"}
            className={`${fieldClass} h-9`}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="applied_on">Application date</Label>
          <Input
            id="applied_on"
            name="applied_on"
            type="date"
            required
            defaultValue={application?.applied_on}
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={application?.notes ?? ""}
          className={`${fieldClass} py-2`}
        />
      </div>
      <FormMessage state={state} />
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : application ? "Save changes" : "Add application"}
        </Button>
      </div>
    </form>
  );
}

export function DeleteApplicationButton({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(deleteApplication, null);
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!confirm("Delete this application and all its tasks?")) e.preventDefault();
      }}
      className="flex flex-col gap-2 items-start"
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="destructive" disabled={pending}>
        {pending ? "Deleting..." : "Delete application"}
      </Button>
      <FormMessage state={state} />
    </form>
  );
}
