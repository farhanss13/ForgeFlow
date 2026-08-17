import { Calendar, Activity } from "lucide-react";
import prisma from "@/lib/prisma";
import { requireProfile } from "@/lib/auth-helpers";

export default async function ActivityPage() {
  const profile = await requireProfile();

  const activities = await prisma.activityRecord.findMany({
    where: {
      project: {
        ownerId: profile.id,
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      project: {
        select: {
          name: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Activity Log</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Audit trail of actions taken in your projects.</p>
      </div>

      <div className="p-6 bg-card/30 backdrop-blur-md border border-border rounded-xl shadow-sm max-w-2xl min-h-[300px] flex flex-col">
        {activities.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-2">
            <Activity className="h-10 w-10 text-muted-foreground/60" />
            <div>
              <p className="text-sm font-medium text-foreground">No recent activity.</p>
              <p className="text-xs text-muted-foreground mt-0.5">Actions you take on projects will show here.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 flex-1">
            {activities.map((act) => (
              <div key={act.id} className="flex gap-3 text-sm pb-4 border-b border-border/40 last:border-0 last:pb-0">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <div className="space-y-0.5 flex-1">
                  <p className="text-foreground text-sm">
                    <span className="font-semibold">{act.action}</span> in{" "}
                    <span className="font-medium text-primary">{act.project.name}</span>
                  </p>
                  <p className="text-muted-foreground text-xs">{act.details}</p>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(act.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
