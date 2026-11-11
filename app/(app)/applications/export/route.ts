import { NextResponse, type NextRequest } from "next/server";
import {
  applicationsToCsv,
  applicationsToPdf,
  applicationsToXlsx,
} from "@/lib/export-applications";
import { findPalette } from "@/lib/palette";
import { createClient } from "@/lib/supabase/server";
import type { Application } from "@/lib/types";

const CONTENT_TYPES = {
  csv: "text/csv; charset=utf-8",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf",
} as const;

type Format = keyof typeof CONTENT_TYPES;

/** GET /applications/export?format=csv|xlsx|pdf&palette=blue */
export async function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get("format") as Format;
  if (!(format in CONTENT_TYPES)) {
    return NextResponse.json({ error: "Unknown format." }, { status: 400 });
  }
  const palette = findPalette(request.nextUrl.searchParams.get("palette"));

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  // RLS only returns the logged-in user's applications.
  const { data, error } = await supabase
    .from("applications")
    .select("id, company, position, status, applied_on, notes")
    .order("applied_on", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<Application[]>();

  if (error) {
    console.error("export applications", error);
    return NextResponse.json({ error: "Could not load your applications." }, { status: 500 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const body =
    format === "csv"
      ? applicationsToCsv(data)
      : format === "xlsx"
        ? await applicationsToXlsx(data, palette)
        : applicationsToPdf(data, palette, today);

  return new NextResponse(body, {
    headers: {
      "Content-Type": CONTENT_TYPES[format],
      "Content-Disposition": `attachment; filename="applications-${today}.${format}"`,
      "Cache-Control": "no-store",
    },
  });
}
