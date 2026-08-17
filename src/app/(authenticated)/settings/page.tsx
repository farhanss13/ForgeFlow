import { requireProfile } from "@/lib/auth-helpers";

export default async function SettingsPage() {
  const profile = await requireProfile();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your workspace account preferences.</p>
      </div>

      <div className="p-6 bg-card/30 backdrop-blur-md border border-border rounded-xl shadow-sm max-w-xl space-y-4">
        <h3 className="font-semibold text-lg text-foreground">Account Information</h3>
        
        <div className="space-y-4 text-sm">
          <div className="flex justify-between py-2.5 border-b border-border/40">
            <span className="text-muted-foreground">Full Name</span>
            <span className="font-medium text-foreground">{profile.fullName || "Not provided"}</span>
          </div>
          <div className="flex justify-between py-2.5 border-b border-border/40">
            <span className="text-muted-foreground">Email Address</span>
            <span className="font-medium text-foreground">{profile.email}</span>
          </div>
          <div className="flex justify-between py-2.5">
            <span className="text-muted-foreground">Account ID</span>
            <span className="font-mono text-xs text-muted-foreground">{profile.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
