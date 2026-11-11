"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/types";

function readTask(
  formData: FormData,
): { error: string } | { values: { title: string; due_date: string | null } } {
  const title = String(formData.get("title") ?? "").trim();
  const due = String(formData.get("due_date") ?? "");

  if (!title) return { error: "Title is required." } as const;
  if (due && !/^\d{4}-\d{2}-\d{2}$/.test(due))
    return { error: "Please enter a valid due date." } as const;

  return { values: { title, due_date: due || null } } as const;
}

function refresh(applicationId: string) {
  revalidatePath("/tasks");
  revalidatePath(`/applications/${applicationId}`);
}

export async function createTask(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const application_id = String(formData.get("application_id") ?? "");
  const parsed = readTask(formData);
  if ("error" in parsed) return { ok: false, message: parsed.error };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) return { ok: false, message: "Please log in again." };

  // The database only accepts this if the application is also yours.
  const { error } = await supabase
    .from("tasks")
    .insert({ ...parsed.values, application_id, user_id: auth.claims.sub });

  if (error) {
    console.error("createTask", error);
    return { ok: false, message: "Could not save the task. Please try again." };
  }

  refresh(application_id);
  return { ok: true, message: "Task added." };
}

export async function updateTask(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get("id") ?? "");
  const parsed = readTask(formData);
  if ("error" in parsed) return { ok: false, message: parsed.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update(parsed.values)
    .eq("id", id)
    .select("application_id");

  if (error || !data?.length) {
    if (error) console.error("updateTask", error);
    return { ok: false, message: "Could not save the task. Please try again." };
  }

  refresh(data[0].application_id);
  return { ok: true, message: "Task saved." };
}

export async function setTaskDone(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get("id") ?? "");
  const done = formData.get("done") === "true";

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({ done })
    .eq("id", id)
    .select("application_id");

  if (error || !data?.length) {
    if (error) console.error("setTaskDone", error);
    return { ok: false, message: "Could not update the task. Please try again." };
  }

  refresh(data[0].application_id);
  return { ok: true, message: done ? "Marked as done." : "Marked as not done." };
}

export async function deleteTask(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get("id") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .select("application_id");

  if (error || !data?.length) {
    if (error) console.error("deleteTask", error);
    return { ok: false, message: "Could not delete the task. Please try again." };
  }

  refresh(data[0].application_id);
  return { ok: true, message: "Task deleted." };
}
