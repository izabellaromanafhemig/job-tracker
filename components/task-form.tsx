"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { createTask, deleteTask, setTaskDone, updateTask } from "@/app/(app)/tasks/actions";
import { FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState, Task } from "@/lib/types";

type FormAction = (data: FormData) => void;

/** Submits without letting React clear the fields when saving fails. */
function submitWith(action: FormAction) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  };
}

function TaskFields({ task, idPrefix }: { task?: Task; idPrefix: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-title`}>Title</Label>
        <Input id={`${idPrefix}-title`} name="title" required defaultValue={task?.title} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-due`}>Due date</Label>
        <Input
          id={`${idPrefix}-due`}
          name="due_date"
          type="date"
          defaultValue={task?.due_date ?? ""}
        />
      </div>
    </div>
  );
}

export function NewTaskForm({ applicationId }: { applicationId: string }) {
  const [state, formAction, pending] = useActionState(createTask, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} onSubmit={submitWith(formAction)} className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold">Add a task</h3>
      <input type="hidden" name="application_id" value={applicationId} />
      <TaskFields idPrefix="new-task" />
      <FormMessage state={state} />
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Add task"}
        </Button>
      </div>
    </form>
  );
}

/** One task row: mark done, edit, delete. Optionally shows which application it belongs to. */
export function TaskItem({
  task,
  application,
}: {
  task: Task;
  application?: { id: string; label: string };
}) {
  const [editing, setEditing] = useState(false);
  const [doneState, doneAction, donePending] = useActionState(setTaskDone, null);
  const [editState, editAction, editPending] = useActionState(updateTask, null);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteTask, null);
  const [message, setMessage] = useState<ActionState>(null);

  // Show the result of whichever action ran last.
  useEffect(() => setMessage(doneState), [doneState]);
  useEffect(() => setMessage(deleteState), [deleteState]);
  useEffect(() => {
    setMessage(editState);
    if (editState?.ok) setEditing(false);
  }, [editState]);

  return (
    <li className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={submitWith(doneAction)}>
          <input type="hidden" name="id" value={task.id} />
          <input type="hidden" name="done" value={String(!task.done)} />
          <button
            type="submit"
            disabled={donePending}
            aria-label={task.done ? "Mark as not done" : "Mark as done"}
            className="h-5 w-5 rounded border border-input flex items-center justify-center text-xs disabled:opacity-50"
          >
            {task.done ? "✓" : ""}
          </button>
        </form>
        <div className="flex-1 min-w-0">
          <p className={task.done ? "line-through text-muted-foreground" : ""}>{task.title}</p>
          <p className="text-xs text-muted-foreground">
            {task.due_date ? `Due ${task.due_date}` : "No due date"}
            {application && (
              <>
                {" · "}
                <Link href={`/applications/${application.id}`} className="hover:underline">
                  {application.label}
                </Link>
              </>
            )}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setEditing((v) => !v)}>
          {editing ? "Cancel" : "Edit"}
        </Button>
        <form
          onSubmit={(e) => {
            if (!confirm("Delete this task?")) return e.preventDefault();
            submitWith(deleteAction)(e);
          }}
        >
          <input type="hidden" name="id" value={task.id} />
          <Button size="sm" variant="destructive" type="submit" disabled={deletePending}>
            {deletePending ? "Deleting..." : "Delete"}
          </Button>
        </form>
      </div>

      {editing && (
        <form onSubmit={submitWith(editAction)} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={task.id} />
          <TaskFields task={task} idPrefix={`task-${task.id}`} />
          <div>
            <Button type="submit" size="sm" disabled={editPending}>
              {editPending ? "Saving..." : "Save task"}
            </Button>
          </div>
        </form>
      )}

      <FormMessage state={message} />
    </li>
  );
}
