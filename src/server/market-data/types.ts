export type AssetClass = 'equity' | 'crypto' | 'fx';

export interface Quote {
  symbol: string;
  price: number;
  currency: string;
  fetchedAt: string;
  provider: string;
}

export interface FxRate {
  pair: string;
  rate: number;
  fetchedAt: string;
  provider: string;
}

export interface MarketDataProvider {
  getEquityQuotes(symbols: string[]): Promise<Quote[]>;
  getCryptoQuotes(symbols: string[]): Promise<Quote[]>;
  getFxRates(pairs: string[]): Promise<FxRate[]>;
}

export interface MarketDataStatus {
  lastEquityRefresh?: string;
  lastCryptoRefresh?: string;
  lastFxRefresh?: string;
  degradedMode: boolean;
  degradedReason?: string;
}
