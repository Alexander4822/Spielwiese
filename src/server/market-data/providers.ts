import type { FxRate, MarketDataProvider, Quote } from './types';

const BATCH_SIZE = 25;
const REQUEST_TIMEOUT_MS = 8_000;
const MAX_RETRIES = 3;

const CRYPTO_SYMBOL_MAPPING: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  BNB: 'binancecoin',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  AVAX: 'avalanche-2',
};

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

async function withBackoff<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  let attempt = 0;
  let lastError: unknown;
  while (attempt <= retries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      attempt += 1;
      if (attempt > retries) {
        break;
      }
      const delay = 250 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 100);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'spielwiese-market-data-service/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Provider responded with ${response.status}: ${url}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export class CoinGeckoProvider {
  readonly name = 'coingecko';

  async getCryptoQuotes(symbols: string[]): Promise<Quote[]> {
    const normalized = symbols.map((symbol) => symbol.toUpperCase());
    const ids = normalized
      .map((symbol) => CRYPTO_SYMBOL_MAPPING[symbol])
      .filter((id): id is string => Boolean(id));

    if (ids.length === 0) {
      return [];
    }

    const uniqueIds = [...new Set(ids)];
    const result: Quote[] = [];

    for (const batch of chunk(uniqueIds, BATCH_SIZE)) {
      const payload = await withBackoff(() =>
        fetchJson<Record<string, { usd: number }>>(
          `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(batch.join(','))}&vs_currencies=usd`,
        ),
      );

      for (const [coinId, value] of Object.entries(payload)) {
        const symbol = Object.keys(CRYPTO_SYMBOL_MAPPING).find((key) => CRYPTO_SYMBOL_MAPPING[key] === coinId);
        if (!symbol || value?.usd === undefined) {
          continue;
        }
        result.push({
          symbol,
          price: value.usd,
          currency: 'USD',
          fetchedAt: new Date().toISOString(),
          provider: this.name,
        });
      }
    }

    return result;
  }
}

export class StooqProvider {
  readonly name = 'stooq';

  async getEquityQuotes(symbols: string[]): Promise<Quote[]> {
    if (symbols.length === 0) {
      return [];
    }

    const pairs = chunk(symbols, BATCH_SIZE);
    const quotes: Quote[] = [];

    for (const batch of pairs) {
      const payload = await withBackoff(() =>
        fetch(`https://stooq.com/q/l/?s=${batch.map((symbol) => symbol.toLowerCase()).join(',')}&f=sd2t2ohlcv&h&e=csv`).then((r) => {
          if (!r.ok) {
            throw new Error(`Stooq failed with ${r.status}`);
          }
          return r.text();
        }),
      );

      const lines = payload.split('\n').map((line) => line.trim()).filter(Boolean);
      for (let i = 1; i < lines.length; i += 1) {
        const [symbol, date, time, , , close] = lines[i].split(',');
        const parsed = Number(close);
        if (!symbol || Number.isNaN(parsed)) {
          continue;
        }
        quotes.push({
          symbol: symbol.toUpperCase(),
          price: parsed,
          currency: 'USD',
          fetchedAt: new Date(`${date}T${time}Z`).toISOString(),
          provider: this.name,
        });
      }
    }

    return quotes;
  }
}

export class YahooProvider {
  readonly name = 'yahoo';

  async getEquityQuotes(symbols: string[]): Promise<Quote[]> {
    if (symbols.length === 0) {
      return [];
    }

    const quotes: Quote[] = [];
    for (const batch of chunk(symbols, BATCH_SIZE)) {
      const payload = await withBackoff(() =>
        fetchJson<{ quoteResponse?: { result?: Array<{ symbol: string; regularMarketPrice: number; currency?: string; regularMarketTime?: number }> } }>(
          `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(batch.join(','))}`,
        ),
      );

      for (const row of payload.quoteResponse?.result ?? []) {
        if (typeof row.regularMarketPrice !== 'number') {
          continue;
        }

        quotes.push({
          symbol: row.symbol.toUpperCase(),
          price: row.regularMarketPrice,
          currency: row.currency ?? 'USD',
          fetchedAt: new Date((row.regularMarketTime ?? Math.floor(Date.now() / 1000)) * 1000).toISOString(),
          provider: this.name,
        });
      }
    }

    return quotes;
  }
}

export class EcbFxProvider {
  readonly name = 'ecb';

  async getFxRates(pairs: string[]): Promise<FxRate[]> {
    if (pairs.length === 0) {
      return [];
    }

    const payload = await withBackoff(() =>
      fetch(
        'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml',
        {
          headers: {
            Accept: 'application/xml',
            'User-Agent': 'spielwiese-market-data-service/1.0',
          },
        },
      ).then((r) => {
        if (!r.ok) {
          throw new Error(`ECB failed with ${r.status}`);
        }
        return r.text();
      }),
    );

    const rateRegex = /currency='([A-Z]{3})'\s+rate='([\d.]+)'/g;
    const ratesByEur = new Map<string, number>([['EUR', 1]]);
    let match: RegExpExecArray | null;

    while ((match = rateRegex.exec(payload)) !== null) {
      ratesByEur.set(match[1], Number(match[2]));
    }

    const now = new Date().toISOString();
    const output: FxRate[] = [];

    for (const pair of pairs) {
      const normalized = pair.replace('/', '').toUpperCase();
      const base = normalized.slice(0, 3);
      const quote = normalized.slice(3, 6);
      if (!ratesByEur.has(base) || !ratesByEur.has(quote)) {
        continue;
      }

      const basePerEur = ratesByEur.get(base) ?? 0;
      const quotePerEur = ratesByEur.get(quote) ?? 0;
      const derivedRate = quotePerEur / basePerEur;

      output.push({
        pair: `${base}${quote}`,
        rate: derivedRate,
        fetchedAt: now,
        provider: this.name,
      });
    }

    return output;
  }
}

export class CompositeMarketDataProvider implements MarketDataProvider {
  constructor(
    private readonly cryptoProvider = new CoinGeckoProvider(),
    private readonly equityPrimary: { getEquityQuotes(symbols: string[]): Promise<Quote[]> } = new StooqProvider(),
    private readonly equityFallback: { getEquityQuotes(symbols: string[]): Promise<Quote[]> } = new YahooProvider(),
    private readonly fxProvider = new EcbFxProvider(),
  ) {}

  async getEquityQuotes(symbols: string[]): Promise<Quote[]> {
    try {
      return await this.equityPrimary.getEquityQuotes(symbols);
    } catch {
      return this.equityFallback.getEquityQuotes(symbols);
    }
  }

  async getCryptoQuotes(symbols: string[]): Promise<Quote[]> {
    return this.cryptoProvider.getCryptoQuotes(symbols);
  }

  async getFxRates(pairs: string[]): Promise<FxRate[]> {
    return this.fxProvider.getFxRates(pairs);
  }
}

export function buildEquityProvidersFromEnv(): {
  primary: { getEquityQuotes(symbols: string[]): Promise<Quote[]> };
  fallback: { getEquityQuotes(symbols: string[]): Promise<Quote[]> };
} {
  const premiumEnabled = process.env.PREMIUM_EQUITY_PROVIDER === 'yahoo';
  if (premiumEnabled) {
    return {
      primary: new YahooProvider(),
      fallback: new StooqProvider(),
    };
  }

  return {
    primary: new StooqProvider(),
    fallback: new YahooProvider(),
  };
}
