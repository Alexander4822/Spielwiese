import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import type { z } from "zod";

import {
  cashAccountSchema,
  cryptoPositionSchema,
  equityPositionSchema,
  loanSchema,
  realEstateSchema,
} from "../validation/schemas";

type EquityFormValues = z.infer<typeof equityPositionSchema>;
type CryptoFormValues = z.infer<typeof cryptoPositionSchema>;
type CashFormValues = z.infer<typeof cashAccountSchema>;
type LoanFormValues = z.infer<typeof loanSchema>;
type RealEstateFormValues = z.infer<typeof realEstateSchema>;

export function useEquityForm(defaultValues?: Partial<EquityFormValues>) {
  return useForm<EquityFormValues>({
    resolver: zodResolver(equityPositionSchema),
    defaultValues,
    mode: "onSubmit",
  });
}

export function useCryptoForm(defaultValues?: Partial<CryptoFormValues>) {
  return useForm<CryptoFormValues>({
    resolver: zodResolver(cryptoPositionSchema),
    defaultValues,
    mode: "onSubmit",
  });
}

export function useCashAccountForm(defaultValues?: Partial<CashFormValues>) {
  return useForm<CashFormValues>({
    resolver: zodResolver(cashAccountSchema),
    defaultValues,
    mode: "onSubmit",
  });
}

export function useLoanForm(defaultValues?: Partial<LoanFormValues>) {
  return useForm<LoanFormValues>({
    resolver: zodResolver(loanSchema),
    defaultValues,
    mode: "onSubmit",
  });
}

export function useRealEstateForm(defaultValues?: Partial<RealEstateFormValues>) {
  const form = useForm<RealEstateFormValues>({
    resolver: zodResolver(realEstateSchema),
    defaultValues: {
      loans: [],
      ...defaultValues,
    },
    mode: "onSubmit",
  });

  const loans = useFieldArray({
    control: form.control,
    name: "loans",
  });

  return { form, loans };
}

export function useModalEditing<T>(initialValues: T) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(initialValues);

  const editing = useMemo(
    () => ({
      open,
      draft,
      openModal: () => setOpen(true),
      closeModal: () => setOpen(false),
      setDraft,
    }),
    [draft, open],
  );

  return editing;
}
