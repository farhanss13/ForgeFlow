import { requireUser } from "@/lib/auth-helpers";
import { logout } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-50 via-neutral-100 to-neutral-200 dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-950">
      <div className="w-full max-w-md p-8 bg-card/60 backdrop-blur-md rounded-2xl border border-border/80 shadow-xl text-center space-y-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">ForgeFlow Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Welcome back! You are logged in as <br />
          <strong className="text-foreground">{user.email}</strong>
        </p>
        <div className="p-4 bg-muted/40 rounded-lg border border-border/50 text-left text-xs space-y-2 font-mono break-all text-muted-foreground">
          <div><span className="font-semibold text-foreground">User ID:</span> {user.id}</div>
          <div><span className="font-semibold text-foreground">Auth Role:</span> {user.role}</div>
        </div>
        <form action={logout}>
          <Button type="submit" variant="destructive" className="w-full py-2.5 rounded-lg">
            Sign Out
          </Button>
        </form>
      </div>
    </div>
  );
}
