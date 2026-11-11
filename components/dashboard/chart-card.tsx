"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/** A titled card that shows a chart, with a toggle to show the same data as a table. */
export function ChartCard({
  title,
  description,
  chart,
  table,
}: {
  title: string;
  description?: string;
  chart: React.ReactNode;
  table: React.ReactNode;
}) {
  const [showTable, setShowTable] = useState(false);
  return (
    <section className="flex flex-col gap-4 rounded-md border p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowTable((v) => !v)}
          aria-pressed={showTable}
        >
          {showTable ? "Show chart" : "Show as table"}
        </Button>
      </div>
      {showTable ? table : chart}
    </section>
  );
}

/** Small table used for the "Show as table" view. */
export function DataTable({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-muted-foreground">
          {headers.map((h, i) => (
            <th key={h} className={`py-2 font-medium ${i > 0 ? "text-right" : ""}`}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={String(row[0])} className="border-b last:border-0">
            {row.map((cell, i) => (
              <td key={i} className={`py-2 tabular-nums ${i > 0 ? "text-right" : ""}`}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
