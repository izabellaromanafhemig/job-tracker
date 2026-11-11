import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import type { Palette } from "@/lib/palette";
import { STATUS_LABELS, type Application } from "@/lib/types";

/** Same columns the importer reads, so an exported file can be imported again. */
const COLUMNS = ["company", "position", "status", "applied_on", "notes"] as const;
const HEADERS = ["Company", "Position", "Status", "Applied on", "Notes"];

function csvCell(value: string | null) {
  const text = value ?? "";
  return /[",\r\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function applicationsToCsv(applications: Application[]): string {
  const lines = [
    COLUMNS.join(","),
    ...applications.map((a) => COLUMNS.map((c) => csvCell(a[c])).join(",")),
  ];
  // The BOM makes Excel show accented characters correctly.
  return "﻿" + lines.join("\r\n") + "\r\n";
}

/** "#2563eb" -> "FF2563EB" (the ARGB format Excel uses). */
const argb = (hex: string) => "FF" + hex.slice(1).toUpperCase();

export async function applicationsToXlsx(
  applications: Application[],
  palette: Palette,
): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Applications", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = [
    { header: HEADERS[0], key: "company", width: 24 },
    { header: HEADERS[1], key: "position", width: 30 },
    { header: HEADERS[2], key: "status", width: 14 },
    { header: HEADERS[3], key: "applied_on", width: 13, style: { numFmt: "yyyy-mm-dd" } },
    { header: HEADERS[4], key: "notes", width: 60 },
  ];

  for (const a of applications) {
    const [y, m, d] = a.applied_on.split("-").map(Number);
    sheet.addRow({
      company: a.company,
      position: a.position,
      status: STATUS_LABELS[a.status],
      applied_on: new Date(Date.UTC(y, m - 1, d)),
      notes: a.notes ?? "",
    });
  }

  const border = { style: "thin" as const, color: { argb: "FFE5E5E5" } };
  sheet.eachRow((row, rowNumber) => {
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = { top: border, bottom: border, left: border, right: border };
      cell.alignment = { vertical: "top", wrapText: true };
      if (rowNumber === 1) {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(palette.main) } };
      } else if (rowNumber % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(palette.tint) } };
      }
    });
  });
  sheet.autoFilter = { from: "A1", to: "E1" };

  return (await workbook.xlsx.writeBuffer()) as ArrayBuffer;
}

export function applicationsToPdf(
  applications: Application[],
  palette: Palette,
  generatedOn: string,
): ArrayBuffer {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(palette.main);
  doc.text("Job applications", 40, 48);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor("#737373");
  doc.text(
    `${applications.length} application${applications.length === 1 ? "" : "s"} · generated on ${generatedOn}`,
    40,
    66,
  );

  autoTable(doc, {
    startY: 82,
    head: [HEADERS],
    body: applications.map((a) => [
      a.company,
      a.position,
      STATUS_LABELS[a.status],
      a.applied_on,
      a.notes ?? "",
    ]),
    styles: { font: "helvetica", fontSize: 9, cellPadding: 6, textColor: "#171717" },
    headStyles: { fillColor: palette.main, textColor: "#ffffff", fontStyle: "bold" },
    alternateRowStyles: { fillColor: palette.tint },
    columnStyles: { 2: { cellWidth: 75 }, 3: { cellWidth: 70 }, 4: { cellWidth: 300 } },
    margin: { left: 40, right: 40 },
  });

  return doc.output("arraybuffer");
}
