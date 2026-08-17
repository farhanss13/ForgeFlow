import { requireProfile } from "@/lib/auth-helpers";
import { AppShell } from "@/components/layout/app-shell";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();

  const user = {
    email: profile.email,
    fullName: profile.fullName,
  };

  return <AppShell user={user}>{children}</AppShell>;
}
