"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { readApplicationsFile } from "@/lib/import-applications";
import { createClient } from "@/lib/supabase/server";
import { STATUSES, type ActionState, type Status } from "@/lib/types";

type ApplicationValues = {
  company: string;
  position: string;
  status: Status;
  applied_on: string;
  notes: string | null;
};

function readApplication(
  formData: FormData,
): { error: string } | { values: ApplicationValues } {
  const company = String(formData.get("company") ?? "").trim();
  const position = String(formData.get("position") ?? "").trim();
  const status = String(formData.get("status") ?? "");
  const applied_on = String(formData.get("applied_on") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();

  if (!company) return { error: "Company is required." } as const;
  if (!position) return { error: "Position is required." } as const;
  if (!STATUSES.includes(status as Status))
    return { error: "Please choose a valid status." } as const;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(applied_on))
    return { error: "Application date is required." } as const;

  return {
    values: {
      company,
      position,
      status: status as Status,
      applied_on,
      notes: notes || null,
    },
  } as const;
}

export async function createApplication(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = readApplication(formData);
  if ("error" in parsed) return { ok: false, message: parsed.error };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) return { ok: false, message: "Please log in again." };

  // user_id is set explicitly; RLS rejects any value other than your own.
  const { error } = await supabase
    .from("applications")
    .insert({ ...parsed.values, user_id: auth.claims.sub });

  if (error) {
    console.error("createApplication", error);
    return { ok: false, message: "Could not save the application. Please try again." };
  }

  revalidatePath("/applications");
  return { ok: true, message: `Application to ${parsed.values.company} saved.` };
}

export async function updateApplication(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get("id") ?? "");
  const parsed = readApplication(formData);
  if ("error" in parsed) return { ok: false, message: parsed.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .update(parsed.values)
    .eq("id", id)
    .select("id");

  if (error || !data?.length) {
    if (error) console.error("updateApplication", error);
    return { ok: false, message: "Could not save the changes. Please try again." };
  }

  revalidatePath("/applications");
  revalidatePath(`/applications/${id}`);
  return { ok: true, message: "Changes saved." };
}

export async function importApplications(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Please choose a file to import." };
  }

  const result = await readApplicationsFile(file);
  if ("errors" in result) {
    return {
      ok: false,
      message: "Nothing was imported. Please fix these problems and try again:",
      details: result.errors.slice(0, 10).concat(
        result.errors.length > 10 ? [`…and ${result.errors.length - 10} more.`] : [],
      ),
    };
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) return { ok: false, message: "Please log in again." };

  // Any user_id column in the file is ignored: rows always belong to you.
  const userId = auth.claims.sub;
  const { error } = await supabase
    .from("applications")
    .insert(result.rows.map((row) => ({ ...row, user_id: userId })));

  if (error) {
    console.error("importApplications", error);
    return { ok: false, message: "Could not import the applications. Please try again." };
  }

  revalidatePath("/applications");
  const n = result.rows.length;
  return { ok: true, message: `Imported ${n} application${n === 1 ? "" : "s"}.` };
}

export async function deleteApplication(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get("id") ?? "");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .delete()
    .eq("id", id)
    .select("id");

  if (error || !data?.length) {
    if (error) console.error("deleteApplication", error);
    return { ok: false, message: "Could not delete the application. Please try again." };
  }

  revalidatePath("/applications");
  revalidatePath("/tasks");
  redirect("/applications");
}
