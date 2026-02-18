import type { AssetClass, Quote } from '../market-data/types';

export interface PriceQuote {
  symbol: string;
  assetClass: AssetClass;
  price: number;
  currency: string;
  provider: string;
  timestamp: string;
}

export interface PriceQuoteRepository {
  saveMany(quotes: PriceQuote[]): Promise<void>;
  getLatestBySymbols(symbols: string[]): Promise<Map<string, PriceQuote>>;
}

export class InMemoryPriceQuoteRepository implements PriceQuoteRepository {
  private readonly store = new Map<string, PriceQuote>();

  async saveMany(quotes: PriceQuote[]): Promise<void> {
    for (const quote of quotes) {
      this.store.set(this.keyFor(quote.symbol, quote.assetClass), quote);
    }
  }

  async getLatestBySymbols(symbols: string[]): Promise<Map<string, PriceQuote>> {
    const result = new Map<string, PriceQuote>();
    for (const symbol of symbols) {
      const eq = this.store.get(this.keyFor(symbol, 'equity'));
      const c = this.store.get(this.keyFor(symbol, 'crypto'));
      const fx = this.store.get(this.keyFor(symbol, 'fx'));
      if (eq) {
        result.set(this.keyFor(symbol, 'equity'), eq);
      }
      if (c) {
        result.set(this.keyFor(symbol, 'crypto'), c);
      }
      if (fx) {
        result.set(this.keyFor(symbol, 'fx'), fx);
      }
    }
    return result;
  }

  private keyFor(symbol: string, assetClass: AssetClass): string {
    return `${assetClass}:${symbol.toUpperCase()}`;
  }
}

export function quoteToPriceQuote(quote: Quote, assetClass: AssetClass): PriceQuote {
  return {
    symbol: quote.symbol,
    assetClass,
    price: quote.price,
    currency: quote.currency,
    provider: quote.provider,
    timestamp: quote.fetchedAt,
  };
}
