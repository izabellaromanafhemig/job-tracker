"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { importApplications } from "@/app/(app)/applications/actions";
import { FormMessage } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { currentPaletteValue } from "@/lib/palette";
import type { ActionState } from "@/lib/types";

// Server actions accept up to 1 MB by default; that is thousands of rows.
const MAX_FILE_BYTES = 1024 * 1024;

export function ExportApplications() {
  const download = (format: "csv" | "xlsx" | "pdf") => {
    // PDF and Excel files use the color scale currently picked on the site.
    const params = new URLSearchParams({ format, palette: currentPaletteValue() });
    window.location.href = `/applications/export?${params}`;
  };

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">Export</h3>
      <p className="text-sm text-muted-foreground">
        Download all your applications. PDF and Excel files use your current site colors.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => download("csv")}>
          CSV
        </Button>
        <Button variant="outline" size="sm" onClick={() => download("xlsx")}>
          Excel (XLSX)
        </Button>
        <Button variant="outline" size="sm" onClick={() => download("pdf")}>
          PDF
        </Button>
      </div>
    </div>
  );
}

export function ImportApplications() {
  const [state, formAction, pending] = useActionState(importApplications, null);
  const [localError, setLocalError] = useState<ActionState>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const file = data.get("file");
        if (file instanceof File && file.size > MAX_FILE_BYTES) {
          setLocalError({ ok: false, message: "The file is too large (max 1 MB)." });
          return;
        }
        setLocalError(null);
        startTransition(() => formAction(data));
      }}
      className="flex flex-col gap-2"
    >
      <h3 className="text-sm font-semibold">Import</h3>
      <p className="text-sm text-muted-foreground">
        Add applications from a .csv or .xlsx file with the columns{" "}
        <code>company, position, status, applied_on, notes</code>. A file exported above
        works too.
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <div className="grid gap-2">
          <Label htmlFor="import-file" className="sr-only">
            File to import
          </Label>
          <Input
            id="import-file"
            name="file"
            type="file"
            required
            accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="max-w-xs"
          />
        </div>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Importing..." : "Import"}
        </Button>
      </div>
      <FormMessage state={localError ?? state} />
    </form>
  );
}
