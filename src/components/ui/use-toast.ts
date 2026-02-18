"use client";

import { toast } from "sonner";

type ToastInput = {
  title?: string;
  description?: string;
};

export function useToast() {
  return {
    toast: ({ title, description }: ToastInput) => toast(title, { description }),
  };
}
