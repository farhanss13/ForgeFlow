import { requireUser } from "@/lib/auth-helpers";
import Link from "next/link";

export default async function ProjectsPage() {
  await requireUser();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-50 via-neutral-100 to-neutral-200 dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-950">
      <div className="w-full max-w-md p-8 bg-card/60 backdrop-blur-md rounded-2xl border border-border/80 shadow-xl text-center space-y-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Projects Overview</h1>
        <p className="text-muted-foreground text-sm">Protected route: Projects list will go here in Phase 4.</p>
        <Link href="/dashboard" className="text-sm font-semibold text-primary hover:underline">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
