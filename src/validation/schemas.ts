import { z } from "zod";

const idSchema = z.string().uuid();
const currencySchema = z.string().length(3).toUpperCase();

export const equityPositionSchema = z.object({
  id: idSchema.optional(),
  ticker: z.string().min(1),
  shares: z.number().positive(),
  averageBuyPrice: z.number().nonnegative(),
  marketPrice: z.number().nonnegative(),
  currency: currencySchema,
});

export const cryptoPositionSchema = z.object({
  id: idSchema.optional(),
  symbol: z.string().min(1),
  amount: z.number().positive(),
  averageBuyPrice: z.number().nonnegative(),
  marketPrice: z.number().nonnegative(),
  currency: currencySchema,
  custody: z.enum(["exchange", "wallet", "custodian"]),
});

export const cashAccountSchema = z.object({
  id: idSchema.optional(),
  name: z.string().min(1),
  iban: z.string().min(5).max(34),
  balance: z.number(),
  currency: currencySchema,
});

export const loanSchema = z.object({
  id: idSchema.optional(),
  lender: z.string().min(1),
  principal: z.number().positive(),
  outstandingBalance: z.number().nonnegative(),
  interestRatePct: z.number().min(0).max(100),
  maturityDate: z.coerce.date(),
  monthlyPayment: z.number().nonnegative(),
});

export const realEstateSchema = z.object({
  id: idSchema.optional(),
  name: z.string().min(1),
  address: z.string().min(1),
  segment: z.enum(["residential", "commercial", "land", "mixed-use"]),
  baselineValue: z.number().positive(),
  baselineMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Expected format YYYY-MM"),
  currentMarketValue: z.number().positive(),
  loans: z.array(loanSchema).default([]),
});

export const entitySchemas = {
  equity: equityPositionSchema,
  crypto: cryptoPositionSchema,
  cash: cashAccountSchema,
  realEstate: realEstateSchema,
  loan: loanSchema,
} as const;

export type EquityPositionInput = z.infer<typeof equityPositionSchema>;
export type CryptoPositionInput = z.infer<typeof cryptoPositionSchema>;
export type CashAccountInput = z.infer<typeof cashAccountSchema>;
export type LoanInput = z.infer<typeof loanSchema>;
export type RealEstateInput = z.infer<typeof realEstateSchema>;

export type EntityType = keyof typeof entitySchemas;

export function validateEntityInput<TType extends EntityType>(type: TType, payload: unknown) {
  const schema = entitySchemas[type];
  return schema.parse(payload);
}
