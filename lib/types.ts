export const STATUSES = ["applied", "interviewing", "offer", "rejected"] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
};

export type Application = {
  id: string;
  company: string;
  position: string;
  status: Status;
  applied_on: string;
  notes: string | null;
};

export type Task = {
  id: string;
  application_id: string;
  title: string;
  due_date: string | null;
  done: boolean;
};

/** Result returned by every form action, shown to the user by <FormMessage>. */
export type ActionState = { ok: boolean; message: string; details?: string[] } | null;
