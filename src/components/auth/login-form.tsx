"use client";

import { useActionState } from "react";
import Link from "next/link";
import Image from "next/image";
import { login } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";

interface LoginFormProps {
  redirectTo: string;
}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(login, null);

  return (
    <div className="w-full max-w-md px-8 py-10 bg-card/60 backdrop-blur-md rounded-2xl border border-border/80 shadow-xl">
      <div className="flex flex-col items-center mb-8">
        <div className="h-12 w-12 flex items-center justify-center relative mb-4">
          <Image
            src="/branding/forgeflow-logo-dark.png"
            alt="ForgeFlow Icon"
            width={48}
            height={48}
            className="block dark:hidden h-full w-auto object-contain"
            priority
          />
          <Image
            src="/branding/forgeflow-logo-light.png"
            alt="ForgeFlow Icon"
            width={48}
            height={48}
            className="hidden dark:block h-full w-auto object-contain"
            priority
          />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Welcome Back</h2>
        <p className="text-sm text-muted-foreground mt-1">Sign in to your ForgeFlow account</p>
      </div>

      <form action={formAction} className="space-y-5">
        <input type="hidden" name="redirectTo" value={redirectTo} />

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full px-3 py-2 bg-background/50 border border-input rounded-lg text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="you@example.com"
            disabled={isPending}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full px-3 py-2 bg-background/50 border border-input rounded-lg text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="••••••••"
            disabled={isPending}
          />
        </div>

        {state?.error && (
          <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-lg font-medium">
            {state.error}
          </div>
        )}

        <Button type="submit" disabled={isPending} className="w-full py-2.5 rounded-lg flex items-center justify-center">
          {isPending ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-primary-foreground" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing in...
            </span>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-foreground font-semibold hover:underline">
          Sign up
        </Link>
      </div>
    </div>
  );
}
