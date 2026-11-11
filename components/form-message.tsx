import type { ActionState } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FormMessage({ state }: { state: ActionState }) {
  if (!state) return null;
  return (
    <div
      role={state.ok ? "status" : "alert"}
      className={cn(
        "text-sm rounded-md px-3 py-2",
        state.ok
          ? "bg-green-500/10 text-green-700 dark:text-green-400"
          : "bg-red-500/10 text-red-700 dark:text-red-400",
      )}
    >
      {state.message}
      {state.details && state.details.length > 0 && (
        <ul className="mt-1 list-disc pl-5">
          {state.details.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
