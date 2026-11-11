import { AuthButton } from "@/components/auth-button";
import { PaletteSwitcher } from "@/components/palette-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import { Suspense } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
        <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
          <div className="flex gap-6 items-center">
            <Link href="/applications" className="font-semibold">
              Job Tracker
            </Link>
            <Link href="/dashboard" className="hover:underline">
              Dashboard
            </Link>
            <Link href="/applications" className="hover:underline">
              Applications
            </Link>
            <Link href="/tasks" className="hover:underline">
              Tasks
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <PaletteSwitcher />
            <ThemeSwitcher />
            <Suspense>
              <AuthButton />
            </Suspense>
          </div>
        </div>
      </nav>
      <div className="flex-1 w-full max-w-5xl flex flex-col gap-8 p-5">
        {children}
      </div>
    </main>
  );
}
