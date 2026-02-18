import { quoteToPriceQuote, type PriceQuoteRepository } from '../persistence/price-quote-repository';
import { buildEquityProvidersFromEnv, CoinGeckoProvider, CompositeMarketDataProvider, EcbFxProvider } from './providers';
import type { FxRate, MarketDataStatus, Quote } from './types';

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
  updatedAt: number;
};

const CACHE_TTLS_MS = {
  equity: 10 * 60 * 1000,
  crypto: 60 * 1000,
  fx: 24 * 60 * 60 * 1000,
};

export class MarketDataService {
  private readonly provider: CompositeMarketDataProvider;
  private readonly cache = new Map<string, CacheEntry<Quote | FxRate>>();
  private readonly inflight = new Map<string, Promise<Quote | FxRate | undefined>>();

  private status: MarketDataStatus = {
    degradedMode: false,
  };

  constructor(private readonly repository: PriceQuoteRepository) {
    const equities = buildEquityProvidersFromEnv();
    this.provider = new CompositeMarketDataProvider(
      new CoinGeckoProvider(),
      equities.primary,
      equities.fallback,
      new EcbFxProvider(),
    );
  }

  getStatus(): MarketDataStatus {
    return this.status;
  }

  async refreshPrices(input: { equities?: string[]; cryptos?: string[]; fxPairs?: string[] }): Promise<{
    equities: Quote[];
    cryptos: Quote[];
    fx: FxRate[];
  }> {
    const equities = await this.refreshEquities(input.equities ?? []);
    const cryptos = await this.refreshCryptos(input.cryptos ?? []);
    const fx = await this.refreshFx(input.fxPairs ?? []);

    await this.repository.saveMany([
      ...equities.map((quote) => quoteToPriceQuote(quote, 'equity')),
      ...cryptos.map((quote) => quoteToPriceQuote(quote, 'crypto')),
      ...fx.map((rate) => ({
        symbol: rate.pair,
        assetClass: 'fx' as const,
        price: rate.rate,
        currency: rate.pair.slice(3, 6),
        provider: rate.provider,
        timestamp: rate.fetchedAt,
      })),
    ]);

    return { equities, cryptos, fx };
  }

  private async refreshEquities(symbols: string[]): Promise<Quote[]> {
    const quotes = await Promise.all(symbols.map((symbol) => this.getOrRefreshQuote('equity', symbol)));
    const result = quotes.filter((value): value is Quote => Boolean(value));
    if (result.length > 0) {
      this.status.lastEquityRefresh = new Date().toISOString();
    }
    return result;
  }

  private async refreshCryptos(symbols: string[]): Promise<Quote[]> {
    const quotes = await Promise.all(symbols.map((symbol) => this.getOrRefreshQuote('crypto', symbol)));
    const result = quotes.filter((value): value is Quote => Boolean(value));
    if (result.length > 0) {
      this.status.lastCryptoRefresh = new Date().toISOString();
    }
    return result;
  }

  private async refreshFx(pairs: string[]): Promise<FxRate[]> {
    const rates = await Promise.all(pairs.map((pair) => this.getOrRefreshRate(pair)));
    const result = rates.filter((value): value is FxRate => Boolean(value));
    if (result.length > 0) {
      this.status.lastFxRefresh = new Date().toISOString();
    }
    return result;
  }

  private async getOrRefreshQuote(assetClass: 'equity' | 'crypto', symbol: string): Promise<Quote | undefined> {
    const cacheKey = `${assetClass}:${symbol.toUpperCase()}`;
    const now = Date.now();
    const existing = this.cache.get(cacheKey);

    if (existing && existing.expiresAt > now) {
      return existing.value as Quote;
    }

    if (this.inflight.has(cacheKey)) {
      return (await this.inflight.get(cacheKey)) as Quote | undefined;
    }

    const request = (async () => {
      try {
        const providerResult =
          assetClass === 'equity'
            ? await this.provider.getEquityQuotes([symbol])
            : await this.provider.getCryptoQuotes([symbol]);

        const quote = providerResult.find((item) => item.symbol.toUpperCase() === symbol.toUpperCase());
        if (!quote) {
          return undefined;
        }

        this.cache.set(cacheKey, {
          value: quote,
          updatedAt: now,
          expiresAt: now + CACHE_TTLS_MS[assetClass],
        });

        this.status.degradedMode = false;
        this.status.degradedReason = undefined;
        return quote;
      } catch (error) {
        if (existing) {
          this.status.degradedMode = true;
          this.status.degradedReason = `${assetClass} provider failed; serving stale cache`;
          return existing.value as Quote;
        }
        this.status.degradedMode = true;
        this.status.degradedReason = (error as Error).message;
        return undefined;
      } finally {
        this.inflight.delete(cacheKey);
      }
    })();

    this.inflight.set(cacheKey, request);
    return request;
  }

  private async getOrRefreshRate(pair: string): Promise<FxRate | undefined> {
    const normalized = pair.replace('/', '').toUpperCase();
    const cacheKey = `fx:${normalized}`;
    const now = Date.now();
    const existing = this.cache.get(cacheKey);

    if (existing && existing.expiresAt > now) {
      return existing.value as FxRate;
    }

    if (this.inflight.has(cacheKey)) {
      return (await this.inflight.get(cacheKey)) as FxRate | undefined;
    }

    const request = (async () => {
      try {
        const rates = await this.provider.getFxRates([normalized]);
        const rate = rates.find((item) => item.pair === normalized);
        if (!rate) {
          return undefined;
        }

        this.cache.set(cacheKey, {
          value: rate,
          updatedAt: now,
          expiresAt: now + CACHE_TTLS_MS.fx,
        });

        this.status.degradedMode = false;
        this.status.degradedReason = undefined;
        return rate;
      } catch (error) {
        if (existing) {
          this.status.degradedMode = true;
          this.status.degradedReason = 'FX provider failed; serving stale cache';
          return existing.value as FxRate;
        }
        this.status.degradedMode = true;
        this.status.degradedReason = (error as Error).message;
        return undefined;
      } finally {
        this.inflight.delete(cacheKey);
      }
    })();

    this.inflight.set(cacheKey, request);
    return request;
  }
}
