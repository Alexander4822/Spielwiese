"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const routes = [
  { href: "/overview", label: "Overview" },
  { href: "/equities", label: "Equities" },
  { href: "/crypto", label: "Crypto" },
  { href: "/real-estate", label: "Real Estate" },
  { href: "/cash", label: "Cash" },
  { href: "/settings", label: "Settings" },
];

type DashboardShellProps = {
  children: ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Family Office</p>
            <h1 className="text-xl font-semibold text-primary">Portfolio Cockpit</h1>
          </div>
          <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs uppercase tracking-wide">
            Neutral Theme
          </Badge>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 lg:flex-row">
        <aside className="lg:w-56">
          <nav className="grid gap-2">
            {routes.map((route) => {
              const isActive = pathname === route.href;
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  {route.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
