export function StatTile({
  label,
  value,
  note,
  noteTone = "muted",
}: {
  label: string;
  value: string | number;
  note?: string;
  noteTone?: "muted" | "alert";
}) {
  return (
    <div className="flex flex-col gap-1 rounded-md border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-3xl font-semibold tabular-nums">{value}</p>
      {note && (
        <p
          className={
            noteTone === "alert"
              ? "text-xs font-medium text-red-700 dark:text-red-400"
              : "text-xs text-muted-foreground"
          }
        >
          {note}
        </p>
      )}
    </div>
  );
}
