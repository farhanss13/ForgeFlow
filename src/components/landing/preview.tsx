import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  FolderGit2,
  CheckSquare,
  FileText,
  BrainCircuit,
  Settings,
  TrendingUp,
  Activity,
  User,
  Clock
} from "lucide-react";

export function ProductPreview() {
  return (
    <section id="preview" className="py-20 bg-muted/30 border-y border-border">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center text-center gap-4 mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            A Workspace Designed for Action
          </h2>
          <p className="text-muted-foreground max-w-2xl text-base md:text-lg">
            Say goodbye to clunky tool-switching. Plan docs, organize tasks, and run AI assistance in one integrated board.
          </p>
        </div>

        {/* Workspace Preview Frame */}
        <div className="w-full max-w-5xl mx-auto rounded-xl border border-border bg-background shadow-2xl overflow-hidden flex flex-col md:flex-row h-145 md:h-155">

          {/* Sidebar */}
          <aside className="w-full md:w-60 border-b md:border-b-0 md:border-r border-border bg-muted/20 shrink-0 flex flex-col p-4">
            {/* Project Header Selector */}
            <div className="flex items-center gap-3 px-2 py-1.5 mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground font-semibold">
                FF
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-semibold leading-none">ForgeFlow Inc.</span>
                <span className="text-xs text-muted-foreground">Solo Workspace</span>
              </div>
            </div>

            {/* Sidebar Navigation Links */}
            <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
              <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-md bg-muted text-sm font-medium text-foreground whitespace-nowrap">
                <FolderGit2 className="h-4 w-4 text-primary" />
                <span>Overview</span>
              </a>
              <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 text-sm font-medium text-muted-foreground hover:text-foreground whitespace-nowrap">
                <CheckSquare className="h-4 w-4" />
                <span>Projects</span>
              </a>
              <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 text-sm font-medium text-muted-foreground hover:text-foreground whitespace-nowrap">
                <FileText className="h-4 w-4" />
                <span>Documents</span>
              </a>
              <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 text-sm font-medium text-muted-foreground hover:text-foreground whitespace-nowrap">
                <BrainCircuit className="h-4 w-4" />
                <span>AI Planner</span>
              </a>
              <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 text-sm font-medium text-muted-foreground hover:text-foreground whitespace-nowrap">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </a>
            </nav>
          </aside>

          {/* Main Dashboard Preview Content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background flex flex-col gap-6 text-left">
            {/* Top Workspace Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold tracking-tight">ForgeFlow Platform</h3>
                <p className="text-xs text-muted-foreground">SaaS Workspace Foundation Setup</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-xs font-semibold px-2 py-0.5">
                  Phase 1 Active
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Dashboard Widget Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Stat Card 1 */}
              <Card className="shadow-none">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <span className="text-xs font-medium text-muted-foreground">Milestones Completed</span>
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2 / 5</div>
                  <div className="text-[10px] text-muted-foreground">Next: Configure Supabase Auth</div>
                </CardContent>
              </Card>

              {/* Stat Card 2 */}
              <Card className="shadow-none">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <span className="text-xs font-medium text-muted-foreground">Active Task Cards</span>
                  <CheckSquare className="h-4 w-4 text-indigo-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12 Tasks</div>
                  <div className="text-[10px] text-muted-foreground">8 TODO | 4 In Progress</div>
                </CardContent>
              </Card>

              {/* Stat Card 3 */}
              <Card className="shadow-none sm:col-span-2 lg:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <span className="text-xs font-medium text-muted-foreground">System Health</span>
                  <Activity className="h-4 w-4 text-emerald-500 animate-pulse" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-500">Perfect</div>
                  <div className="text-[10px] text-muted-foreground">Frontend validation passing</div>
                </CardContent>
              </Card>
            </div>

            {/* Bottom Section: Recent Tasks & Activity Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Tasks List Mock */}
              <Card className="shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-muted-foreground" />
                    Sprint Task Queue
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {[
                    { title: "Draft Database Plan Schema", badge: "TODO", color: "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200" },
                    { title: "Bootstrap Next.js Project Foundation", badge: "DONE", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
                    { title: "Setup light & dark theme custom components", badge: "DONE", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
                  ].map((task, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-md border border-border bg-muted/10 text-xs">
                      <span className="font-medium truncate max-w-55">{task.title}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${task.color}`}>
                        {task.badge}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Activity Log Mock */}
              <Card className="shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Recent Updates
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {[
                    { desc: "Developer initialized Next.js project base", time: "5 mins ago", icon: User },
                    { desc: "AI finalized blueprint implementation docs", time: "1 hour ago", icon: BrainCircuit },
                  ].map((act, i) => (
                    <div key={i} className="flex gap-3 text-xs">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-muted-foreground shrink-0">
                        <act.icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{act.desc}</span>
                        <span className="text-[10px] text-muted-foreground">{act.time}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

            </div>
          </main>
        </div>
      </div>
    </section>
  );
}
