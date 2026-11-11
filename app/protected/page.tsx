import { redirect } from "next/navigation";

// Login and sign-up send users here; the app itself lives at /applications.
export default function ProtectedPage() {
  redirect("/applications");
}
