import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const EPX_URL = 'https://europace.de/epx-hedonic/';
const HEALTH_MIN_ROWS = 6;
const WARN_MESSAGE = 'EPX source unavailable; using cached indices';

type RawCategory = 'Eigentumswohnungen' | 'Bestandshäuser' | 'Neubauhäuser';

export type EpxCategory = 'apartments' | 'existingHomes' | 'newHomes';

export interface EpxIndex {
  month: string;
  apartments: number;
  existingHomes: number;
  newHomes: number;
}

export interface EpxFetchResult {
  status: 'ok' | 'warning';
  source: 'html' | 'cache';
  indices: EpxIndex[];
  warnings: string[];
}

export interface EpxProvider {
  fetchSeries(): Promise<EpxIndex[]>;
}

export interface FetchEpxOptions {
  persistPath?: string;
  logger?: Pick<Console, 'warn' | 'error'>;
  provider?: EpxProvider;
}

const CATEGORY_MAP: Record<RawCategory, EpxCategory> = {
  Eigentumswohnungen: 'apartments',
  Bestandshäuser: 'existingHomes',
  Neubauhäuser: 'newHomes',
};

const DEFAULT_PERSIST_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  'epx-index-cache.json',
);

/**
 * Primary entrypoint to fetch EPX indices, validate parser health and upsert locally cached values.
 * Falls back to the latest known good cache when parsing/fetching fails.
 */
export async function fetchAndPersistEpxIndices(
  options: FetchEpxOptions = {},
): Promise<EpxFetchResult> {
  const persistPath = options.persistPath ?? DEFAULT_PERSIST_PATH;
  const logger = options.logger ?? console;

  try {
    const sourceData = options.provider
      ? await options.provider.fetchSeries()
      : await fetchFromHtmlSource();

    assertHealth(sourceData);

    const cached = await readCachedIndices(persistPath);
    const upserted = upsertByMonth(cached, sourceData);
    await persistIndices(upserted, persistPath);

    return {
      status: 'ok',
      source: 'html',
      indices: upserted,
      warnings: [],
    };
  } catch (error) {
    logger.warn(WARN_MESSAGE, error);
    const cached = await readCachedIndices(persistPath);

    return {
      status: 'warning',
      source: 'cache',
      indices: cached,
      warnings: [WARN_MESSAGE],
    };
  }
}

/**
 * Optional adapter seam for a future API-based source.
 * HTML parsing remains the fallback source in case an API is unavailable.
 */
export async function fetchEpxWithOptionalApi(
  apiProvider: EpxProvider | null,
  options: Omit<FetchEpxOptions, 'provider'> = {},
): Promise<EpxFetchResult> {
  if (apiProvider) {
    try {
      return await fetchAndPersistEpxIndices({ ...options, provider: apiProvider });
    } catch (error) {
      (options.logger ?? console).warn('EPX API provider failed; falling back to HTML parser', error);
    }
  }

  return fetchAndPersistEpxIndices(options);
}

export async function fetchFromHtmlSource(htmlInput?: string): Promise<EpxIndex[]> {
  const html = htmlInput ?? (await fetchHtml(EPX_URL));
  const table = extractFirstTable(html);
  const { headers, rows } = parseTable(table);
  const records = toSeries(headers, rows);

  return records;
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      Accept: 'text/html,application/xhtml+xml',
    },
  });

  if (!response.ok) {
    throw new Error(`EPX fetch failed with ${response.status}`);
  }

  return response.text();
}

function extractFirstTable(html: string): string {
  const tableMatch = html.match(/<table[\s\S]*?<\/table>/i);

  if (!tableMatch) {
    throw new Error('EPX table not found in HTML source');
  }

  return tableMatch[0];
}

function parseTable(tableHtml: string): { headers: string[]; rows: string[][] } {
  const rowMatches = [...tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];

  if (rowMatches.length === 0) {
    throw new Error('EPX parser found no table rows');
  }

  const parsedRows = rowMatches
    .map((rowMatch) => [...rowMatch[1].matchAll(/<(td|th)[^>]*>([\s\S]*?)<\/\1>/gi)].map((cell) => stripTags(cell[2])))
    .filter((cells) => cells.length > 0);

  if (parsedRows.length < 2) {
    throw new Error('EPX parser found no data rows');
  }

  return {
    headers: parsedRows[0],
    rows: parsedRows.slice(1),
  };
}

function toSeries(headers: string[], rows: string[][]): EpxIndex[] {
  const normalizedHeaderIndex = new Map<string, number>();

  headers.forEach((header, index) => {
    normalizedHeaderIndex.set(normalizeHeader(header), index);
  });

  const monthIndex = pickMonthColumn(normalizedHeaderIndex);
  const categoryIndices = new Map<EpxCategory, number>();

  for (const [rawName, targetName] of Object.entries(CATEGORY_MAP) as [RawCategory, EpxCategory][]) {
    const headerIndex = findCategoryHeaderIndex(rawName, normalizedHeaderIndex);
    if (headerIndex !== undefined) {
      categoryIndices.set(targetName, headerIndex);
    }
  }

  if (categoryIndices.size !== 3) {
    throw new Error('EPX parser could not map all category columns');
  }

  const series: EpxIndex[] = [];

  for (const row of rows) {
    const month = normalizeMonth(row[monthIndex]);

    if (!month) {
      continue;
    }

    const apartments = parseLocaleNumber(row[categoryIndices.get('apartments') ?? -1]);
    const existingHomes = parseLocaleNumber(row[categoryIndices.get('existingHomes') ?? -1]);
    const newHomes = parseLocaleNumber(row[categoryIndices.get('newHomes') ?? -1]);

    if ([apartments, existingHomes, newHomes].some((value) => Number.isNaN(value))) {
      continue;
    }

    series.push({
      month,
      apartments,
      existingHomes,
      newHomes,
    });
  }

  if (series.length === 0) {
    throw new Error('EPX parser produced no usable index records');
  }

  return upsertByMonth([], series);
}

function pickMonthColumn(normalizedHeaderIndex: Map<string, number>): number {
  const candidates = ['monat', 'datum', 'zeitraum', 'month'];

  for (const candidate of candidates) {
    const index = normalizedHeaderIndex.get(candidate);
    if (index !== undefined) {
      return index;
    }
  }

  throw new Error('EPX parser could not find month column');
}

function findCategoryHeaderIndex(
  category: RawCategory,
  normalizedHeaderIndex: Map<string, number>,
): number | undefined {
  const normalizedTarget = normalizeHeader(category);

  for (const [header, index] of normalizedHeaderIndex.entries()) {
    if (header.includes(normalizedTarget)) {
      return index;
    }
  }

  return undefined;
}

function normalizeHeader(value: string): string {
  return stripTags(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function stripTags(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeMonth(rawMonth: string | undefined): string | null {
  if (!rawMonth) {
    return null;
  }

  const cleaned = rawMonth
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const dotMatch = cleaned.match(/^(\d{1,2})[./-](\d{4})$/);
  if (dotMatch) {
    const month = Number(dotMatch[1]);
    const year = Number(dotMatch[2]);
    if (month >= 1 && month <= 12) {
      return `${year}-${String(month).padStart(2, '0')}`;
    }
  }

  const isoMatch = cleaned.match(/^(\d{4})-(\d{1,2})$/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    if (month >= 1 && month <= 12) {
      return `${year}-${String(month).padStart(2, '0')}`;
    }
  }

  const monthMap: Record<string, number> = {
    januar: 1,
    jan: 1,
    februar: 2,
    feb: 2,
    maerz: 3,
    marz: 3,
    mar: 3,
    april: 4,
    apr: 4,
    mai: 5,
    juni: 6,
    jun: 6,
    juli: 7,
    jul: 7,
    august: 8,
    aug: 8,
    september: 9,
    sep: 9,
    sept: 9,
    oktober: 10,
    okt: 10,
    november: 11,
    nov: 11,
    dezember: 12,
    dez: 12,
  };

  const textMatch = cleaned.toLowerCase().match(/^([a-z]+)\s+(\d{4})$/);
  if (textMatch) {
    const month = monthMap[textMatch[1]];
    const year = Number(textMatch[2]);
    if (month) {
      return `${year}-${String(month).padStart(2, '0')}`;
    }
  }

  return null;
}

function parseLocaleNumber(rawValue: string | undefined): number {
  if (!rawValue) {
    return Number.NaN;
  }

  const normalized = rawValue
    .replace(/\s+/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '');

  return Number.parseFloat(normalized);
}

function upsertByMonth(existing: EpxIndex[], incoming: EpxIndex[]): EpxIndex[] {
  const map = new Map<string, EpxIndex>();

  for (const row of existing) {
    map.set(row.month, row);
  }

  for (const row of incoming) {
    map.set(row.month, row);
  }

  return [...map.values()].sort((a, b) => a.month.localeCompare(b.month));
}

function assertHealth(series: EpxIndex[]): void {
  if (series.length < HEALTH_MIN_ROWS) {
    throw new Error(
      `EPX parser health check failed: expected at least ${HEALTH_MIN_ROWS} rows, got ${series.length}`,
    );
  }
}

async function readCachedIndices(persistPath: string): Promise<EpxIndex[]> {
  try {
    const content = await readFile(persistPath, 'utf8');
    const parsed = JSON.parse(content) as EpxIndex[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (item): item is EpxIndex =>
          Boolean(item) &&
          typeof item.month === 'string' &&
          typeof item.apartments === 'number' &&
          typeof item.existingHomes === 'number' &&
          typeof item.newHomes === 'number',
      )
      .sort((a, b) => a.month.localeCompare(b.month));
  } catch {
    return [];
  }
}

async function persistIndices(series: EpxIndex[], persistPath: string): Promise<void> {
  await mkdir(path.dirname(persistPath), { recursive: true });
  await writeFile(persistPath, `${JSON.stringify(series, null, 2)}\n`, 'utf8');
}
