import { equityPositionSchema, cryptoPositionSchema } from "../validation/schemas";

export type ParsedCsvRow = {
  type: "equity" | "crypto";
  payload: unknown;
};

export function parseSimplePositionsCsv(csvRaw: string): ParsedCsvRow[] {
  const [headerLine, ...lines] = csvRaw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!headerLine) {
    return [];
  }

  const headers = headerLine.split(",").map((h) => h.trim().toLowerCase());

  return lines.map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    const row = Object.fromEntries(headers.map((key, i) => [key, cols[i]]));

    if (row.type === "equity") {
      return {
        type: "equity" as const,
        payload: equityPositionSchema.parse({
          ticker: row.symbol,
          shares: Number(row.quantity),
          averageBuyPrice: Number(row.avg_buy_price),
          marketPrice: Number(row.market_price),
          currency: row.currency,
        }),
      };
    }

    return {
      type: "crypto" as const,
      payload: cryptoPositionSchema.parse({
        symbol: row.symbol,
        amount: Number(row.quantity),
        averageBuyPrice: Number(row.avg_buy_price),
        marketPrice: Number(row.market_price),
        currency: row.currency,
        custody: row.custody || "wallet",
      }),
    };
  });
}
