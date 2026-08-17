import { LoginForm } from "@/components/auth/login-form";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const redirectTo = (resolvedParams?.next as string) || "/dashboard";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-50 via-neutral-100 to-neutral-200 dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-950 px-4 py-8">
      <LoginForm redirectTo={redirectTo} />
    </div>
  );
}
