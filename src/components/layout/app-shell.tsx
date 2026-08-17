"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { LayoutDashboard, FolderKanban, Activity, Settings, LogOut, Menu, X, Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/auth/actions";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface AppShellProps {
  children: React.ReactNode;
  user: {
    email: string;
    fullName: string | null;
  };
}

export function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname();
  const { setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navigation = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Projects", href: "/projects", icon: FolderKanban },
    { name: "Activity", href: "/activity", icon: Activity },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const displayName = user.fullName || user.email;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-border bg-card/40 backdrop-blur-md">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center px-6 mb-6 gap-2.5">
            <div className="h-8 w-8 flex items-center justify-center relative">
              <Image
                src="/branding/forgeflow-logo-dark.png"
                alt="ForgeFlow Icon"
                width={32}
                height={32}
                className="block dark:hidden h-full w-auto object-contain"
                priority
              />
              <Image
                src="/branding/forgeflow-logo-light.png"
                alt="ForgeFlow Icon"
                width={32}
                height={32}
                className="hidden dark:block h-full w-auto object-contain"
                priority
              />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">ForgeFlow</span>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors group ${
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile section at the bottom of sidebar */}
        <div className="flex-shrink-0 flex border-t border-border p-4 bg-muted/20">
          <div className="flex items-center w-full justify-between">
            <div className="flex items-center max-w-[150px]">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold uppercase">
                {displayName.charAt(0)}
              </div>
              <div className="ml-3 truncate">
                <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <form action={logout}>
              <Button type="submit" variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                <LogOut className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col w-full md:pl-64 flex-1 overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center justify-between h-16 px-4 md:px-8 border-b border-border bg-background/95 backdrop-blur-md z-10">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden mr-2"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="h-6 w-6 text-foreground" />
            </Button>
            <h2 className="text-lg font-semibold text-foreground capitalize">
              {pathname === "/dashboard" ? "Overview" : pathname.split("/")[1] || "Overview"}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground h-8 w-8 cursor-pointer transition-colors relative outline-none">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="h-4 w-4 mr-2" /> Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="h-4 w-4 mr-2" /> Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <Monitor className="h-4 w-4 mr-2" /> System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main page content scrollable container */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer Menu */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out md:hidden flex flex-col pt-5 pb-4 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 flex items-center justify-center relative">
              <Image
                src="/branding/forgeflow-logo-dark.png"
                alt="ForgeFlow Icon"
                width={32}
                height={32}
                className="block dark:hidden h-full w-auto object-contain"
              />
              <Image
                src="/branding/forgeflow-logo-light.png"
                alt="ForgeFlow Icon"
                width={32}
                height={32}
                className="hidden dark:block h-full w-auto object-contain"
              />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">ForgeFlow</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors group ${
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className={`mr-3 h-5 w-5 ${isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User profile section at the bottom */}
        <div className="flex-shrink-0 flex border-t border-border p-4 bg-muted/20">
          <div className="flex items-center w-full justify-between">
            <div className="flex items-center max-w-[150px]">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold uppercase">
                {displayName.charAt(0)}
              </div>
              <div className="ml-3 truncate">
                <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <form action={logout}>
              <Button type="submit" variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                <LogOut className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
