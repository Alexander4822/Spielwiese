"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type ToastProps = {
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
};

export function Toast({ title, description, action, className }: ToastProps) {
  return (
    <div className={cn("w-full rounded-lg border bg-background p-4 text-foreground shadow", className)}>
      <div className="grid gap-1">
        {title ? <p className="text-sm font-semibold">{title}</p> : null}
        {description ? <div className="text-sm text-muted-foreground">{description}</div> : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
