import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, Kanban, GitFork, LayoutGrid, FileText, ClipboardList } from "lucide-react";

interface FeatureItem {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const featuresList: FeatureItem[] = [
  {
    title: "AI Project Planning",
    description: "Turn a raw project idea into clean milestones and actionable development tasks in seconds.",
    icon: BrainCircuit,
  },
  {
    title: "Project Management",
    description: "Organize engineering projects, track major milestones, configure tasks, and view progress.",
    icon: LayoutGrid,
  },
  {
    title: "Kanban Workflow",
    description: "Manage developmental tasks and progress easily using a modern visual Kanban board.",
    icon: Kanban,
  },
  {
    title: "Developer Documentation",
    description: "Keep technical documentation, design blueprints, and project wiki files organized in one workspace.",
    icon: FileText,
  },
  {
    title: "AI Task Assistant",
    description: "Get contextual assistance to break down complex tasks, refine details, and improve requirements.",
    icon: ClipboardList,
  },
  {
    title: "GitHub Integration",
    description: "Connect code branch activities, commits, and pull requests directly to project tracker elements.",
    icon: GitFork,
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 md:py-28 container mx-auto px-4 md:px-6 scroll-mt-16">
      <div className="flex flex-col items-center text-center gap-4 mb-16">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Everything You Need to Build Better Software
        </h2>
        <p className="text-muted-foreground max-w-2xl text-base md:text-lg">
          ForgeFlow combines planning, tracking, documentation, and intelligence into one platform designed for solo developers and agile teams.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {featuresList.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <Card key={i} className="group hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md">
              <CardHeader className="flex flex-row items-center gap-4 pb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                  <Icon className="h-5.5 w-5.5" />
                </div>
                <CardTitle className="text-xl tracking-tight">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
