export type AssetCategory = "Equities" | "Crypto" | "Real Estate" | "Cash";

export type Position = {
  id: string;
  name: string;
  category: AssetCategory;
  valueEur: number;
  change24h?: number;
  updatedAt?: string;
};

export type RealEstatePosition = {
  id: string;
  objectName: string;
  marketValueEur: number;
  mortgageRemainingEur: number;
};

export const LAST_PRICE_REFRESH = "2026-02-11T12:00:00.000Z";

export const positions: Position[] = [
  { id: "eq-1", name: "MSCI World ETF", category: "Equities", valueEur: 55000, change24h: 0.42, updatedAt: LAST_PRICE_REFRESH },
  { id: "eq-2", name: "Tech Growth ETF", category: "Equities", valueEur: 12000, change24h: -0.11, updatedAt: LAST_PRICE_REFRESH },
  { id: "cr-1", name: "Bitcoin", category: "Crypto", valueEur: 18000, change24h: 1.24, updatedAt: LAST_PRICE_REFRESH },
  { id: "cr-2", name: "Ethereum", category: "Crypto", valueEur: 7500, change24h: -0.63, updatedAt: LAST_PRICE_REFRESH },
  { id: "ca-1", name: "Main Bank Account", category: "Cash", valueEur: 16500, updatedAt: LAST_PRICE_REFRESH },
  { id: "ca-2", name: "Emergency Fund", category: "Cash", valueEur: 8000, updatedAt: LAST_PRICE_REFRESH },
];

export const realEstatePositions: RealEstatePosition[] = [
  { id: "re-1", objectName: "Apartment Berlin", marketValueEur: 420000, mortgageRemainingEur: 235000 },
  { id: "re-2", objectName: "Family House Hamburg", marketValueEur: 680000, mortgageRemainingEur: 280000 },
];

export const liabilities = 545000;

export const snapshots = [
  { date: "2025-10-01", netWorth: 382000 },
  { date: "2025-11-01", netWorth: 390500 },
  { date: "2025-12-01", netWorth: 397100 },
  { date: "2026-01-01", netWorth: 404900 },
  { date: "2026-02-01", netWorth: 411200 },
];

export const getTotalAssets = () => {
  const liquid = positions.reduce((sum, item) => sum + item.valueEur, 0);
  const realEstate = realEstatePositions.reduce((sum, item) => sum + item.marketValueEur, 0);

  return liquid + realEstate;
};

export const getTotalLiabilities = () => {
  const propertyDebt = realEstatePositions.reduce((sum, item) => sum + item.mortgageRemainingEur, 0);
  return liabilities + propertyDebt;
};

export const getNetWorth = () => getTotalAssets() - getTotalLiabilities();

export const getAllocation = () => {
  const totals: Record<AssetCategory, number> = {
    Equities: 0,
    Crypto: 0,
    "Real Estate": 0,
    Cash: 0,
  };

  positions.forEach((position) => {
    totals[position.category] += position.valueEur;
  });

  totals["Real Estate"] = realEstatePositions.reduce((sum, item) => sum + item.marketValueEur, 0);

  const total = Object.values(totals).reduce((sum, value) => sum + value, 0);

  return Object.entries(totals).map(([name, value]) => ({
    name,
    value,
    percentage: total === 0 ? 0 : (value / total) * 100,
  }));
};
