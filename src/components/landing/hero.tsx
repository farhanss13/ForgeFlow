import * as React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Sparkles, Terminal } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32 lg:py-40 bg-linear-to-b from-background to-muted/20">
      {/* Decorative grid pattern in background */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[14px_24px] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <div className="container mx-auto px-4 md:px-6 flex flex-col items-center text-center gap-6 md:gap-8">
        {/* Subtle Announcement Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground shadow-sm animate-fade-in">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Introducing Phase 1 Foundation</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl max-w-3xl leading-none">
          Your Engineering Workspace,{" "}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-primary via-primary/80 to-primary/60">
            Powered by AI.
          </span>
        </h1>

        {/* Hero Supporting Text */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
          ForgeFlow helps developers transform raw project ideas into structured milestones, actionable tasks, clear documentation, and fluid Kanban workflows.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link href="/signup" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto gap-2 text-base cursor-pointer">
              Get Started
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <a
            href="#features"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted text-foreground h-9 gap-1.5 px-4 text-base font-medium transition-colors w-full sm:w-auto"
          >
            <Terminal className="h-5 w-5" />
            Explore Features
          </a>
        </div>
      </div>
    </section>
  );
}
