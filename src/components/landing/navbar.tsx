"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor, Menu, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const { setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg py-1 px-1.5"
          aria-label="ForgeFlow"
        >
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
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <a
            href="#features"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Features
          </a>
          <a
            href="#preview"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Workspace Preview
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            GitHub
          </a>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-lg border border-transparent hover:bg-muted text-muted-foreground h-8 w-8 cursor-pointer transition-colors relative outline-none">
              <Sun className="h-[1.2rem] w-[1.2rem] transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" />
                <span>Light</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Monitor className="mr-2 h-4 w-4" />
                <span>System</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="sm">
            Sign In
          </Button>
          <Button size="sm" className="gap-1">
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Mobile Nav Button */}
        <div className="flex items-center gap-2 md:hidden">
          {/* Theme Toggle (Mobile) */}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-lg border border-transparent hover:bg-muted text-muted-foreground h-8 w-8 cursor-pointer transition-colors relative outline-none">
              <Sun className="h-[1.2rem] w-[1.2rem] transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="h-9 w-9"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-border bg-background px-4 py-4 md:hidden flex flex-col gap-4 animate-in fade-in slide-in-from-top-5 duration-200">
          <nav className="flex flex-col gap-3">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground py-1"
            >
              Features
            </a>
            <a
              href="#preview"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground py-1"
            >
              Workspace Preview
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground py-1"
            >
              GitHub
            </a>
          </nav>
          <div className="h-px bg-border my-1" />
          <div className="flex flex-col gap-2">
            <Button variant="outline" className="w-full">
              Sign In
            </Button>
            <Button className="w-full gap-1">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
