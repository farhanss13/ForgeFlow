import * as React from "react";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-10">
      <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Branding */}
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 flex items-center justify-center relative">
            <Image
              src="/branding/forgeflow-logo-dark.png"
              alt="ForgeFlow Icon"
              width={24}
              height={24}
              className="block dark:hidden h-full w-auto object-contain"
            />
            <Image
              src="/branding/forgeflow-logo-light.png"
              alt="ForgeFlow Icon"
              width={24}
              height={24}
              className="hidden dark:block h-full w-auto object-contain"
            />
          </div>
          <span className="font-semibold tracking-tight text-foreground">ForgeFlow</span>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#preview" className="hover:text-foreground transition-colors">
            Workspace Preview
          </a>
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noreferrer" 
            className="hover:text-foreground transition-colors"
          >
            GitHub
          </a>
        </div>

        {/* Copyright */}
        <p className="text-xs text-muted-foreground text-center md:text-right">
          &copy; {new Date().getFullYear()} ForgeFlow. All rights reserved.
        </p>

      </div>
    </footer>
  );
}
