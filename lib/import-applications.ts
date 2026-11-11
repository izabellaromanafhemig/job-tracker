import ExcelJS from "exceljs";
import { STATUSES, STATUS_LABELS, type Status } from "@/lib/types";

export const MAX_IMPORT_ROWS = 500;

type RawRow = Record<string, unknown>;

export type ImportedApplication = {
  company: string;
  position: string;
  status: Status;
  applied_on: string;
  notes: string | null;
};

/** Normalizes a header like "Applied on" or "APPLIED_ON" to "applied_on". */
const headerKey = (h: unknown) =>
  String(h ?? "")
    .replace(/^﻿/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

/** Small CSV parser: handles quoted fields, "" escapes and line breaks inside quotes. */
function parseCsv(text: string): RawRow[] {
  text = text.replace(/^﻿/, "");
  const firstLine = text.split(/\r?\n/, 1)[0];
  // Excel set to Portuguese saves CSV files with ";" instead of ",".
  const delimiter =
    (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const [header = [], ...body] = rows.filter((r) => r.some((c) => c.trim() !== ""));
  const keys = header.map(headerKey);
  return body.map((cells) => Object.fromEntries(keys.map((k, i) => [k, cells[i] ?? ""])));
}

async function parseXlsx(buffer: ArrayBuffer): Promise<RawRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const keys: string[] = [];
  sheet.getRow(1).eachCell((cell, col) => (keys[col] = headerKey(cell.text)));

  const rows: RawRow[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const record: RawRow = {};
    keys.forEach((key, col) => {
      if (!key) return;
      const value = row.getCell(col).value;
      record[key] = value instanceof Date ? value : row.getCell(col).text;
    });
    if (Object.values(record).some((v) => String(v ?? "").trim() !== "")) rows.push(record);
  });
  return rows;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Accepts 2026-10-02, 02/10/2026 (day/month/year) or a spreadsheet date. */
function toIsoDate(value: unknown): string | null {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`;
  }
  const text = String(value ?? "").trim();
  let y: number, m: number, d: number;
  let match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  else if ((match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)))
    [d, m, y] = [Number(match[1]), Number(match[2]), Number(match[3])];
  else return null;

  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
}

/** Accepts "interviewing" or "Interviewing"; empty means "applied". */
function toStatus(value: unknown): Status | null {
  const text = String(value ?? "").trim().toLowerCase();
  if (!text) return "applied";
  return (
    STATUSES.find((s) => s === text || STATUS_LABELS[s].toLowerCase() === text) ?? null
  );
}

/**
 * Reads a .csv or .xlsx file. Returns either the applications to insert or a
 * list of problems (with spreadsheet row numbers) — never a partial result.
 */
export async function readApplicationsFile(
  file: File,
): Promise<{ rows: ImportedApplication[] } | { errors: string[] }> {
  const name = file.name.toLowerCase();
  let raw: RawRow[];
  try {
    if (name.endsWith(".csv")) raw = parseCsv(await file.text());
    else if (name.endsWith(".xlsx")) raw = await parseXlsx(await file.arrayBuffer());
    else return { errors: ["Please choose a .csv or .xlsx file."] };
  } catch (e) {
    console.error("readApplicationsFile", e);
    return { errors: ["Could not read the file. Is it a valid CSV or Excel file?"] };
  }

  if (raw.length === 0) return { errors: ["The file has no applications in it."] };
  if (raw.length > MAX_IMPORT_ROWS)
    return { errors: [`The file has ${raw.length} rows; the limit is ${MAX_IMPORT_ROWS}.`] };

  const missing = ["company", "position", "applied_on"].filter((c) => !(c in raw[0]));
  if (missing.length) {
    return {
      errors: [
        `Missing column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}. ` +
          "Expected columns: company, position, status, applied_on, notes.",
      ],
    };
  }

  const rows: ImportedApplication[] = [];
  const errors: string[] = [];

  raw.forEach((r, i) => {
    const line = i + 2; // +1 for the header, +1 because spreadsheets start at 1
    const company = String(r.company ?? "").trim();
    const position = String(r.position ?? "").trim();
    const status = toStatus(r.status);
    const applied_on = toIsoDate(r.applied_on);
    const notes = String(r.notes ?? "").trim();

    const problems = [
      !company && "company is empty",
      !position && "position is empty",
      !status && `status "${r.status}" is not one of: ${STATUSES.join(", ")}`,
      !applied_on && `applied_on "${r.applied_on ?? ""}" is not a valid date (use 2026-10-02)`,
    ].filter(Boolean);

    if (problems.length) errors.push(`Row ${line}: ${problems.join("; ")}.`);
    else
      rows.push({ company, position, status: status!, applied_on: applied_on!, notes: notes || null });
  });

  return errors.length ? { errors } : { rows };
}
