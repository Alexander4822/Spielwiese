export type YearMonth = `${number}-${number}`;

export interface EpxIndex {
  month: YearMonth;
  index: number;
}

export interface RealEstate {
  baselineValue: number;
  baselineMonth: YearMonth;
  marketValue?: number;
}

export interface Loan {
  remainingPrincipal: number;
}

export interface ValuationDto {
  marketValue: number;
  boundEquity: number;
  assetsTotal: number;
  liabilitiesTotal: number;
  netWorth: number;
  allocationByClass: Record<string, number>;
  marketValueFormatted: string;
  boundEquityFormatted: string;
  assetsTotalFormatted: string;
  liabilitiesTotalFormatted: string;
  netWorthFormatted: string;
}

const EUR_FORMATTER = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
});

const ROUNDING_EPSILON = 1e-8;

export function formatEUR(value: number): string {
  return EUR_FORMATTER.format(normalizeAmount(value));
}

/**
 * marketValue = baselineValue * (indexCurrent / indexBaseline)
 */
export function calculateRealEstateMarketValue(
  realEstate: RealEstate,
  epxSeries: EpxIndex[],
): number {
  const baselineIndex = epxSeries.find((entry) => entry.month === realEstate.baselineMonth);
  if (!baselineIndex) {
    throw new Error(`Baseline-Monat ${realEstate.baselineMonth} fehlt in der EpxIndex-Reihe.`);
  }

  const currentIndex = resolveCurrentIndex(epxSeries);
  if (!currentIndex) {
    throw new Error('Aktueller Index fehlt in der EpxIndex-Reihe.');
  }

  if (baselineIndex.index === 0) {
    throw new Error('Baseline-Index darf nicht 0 sein.');
  }

  const marketValue = realEstate.baselineValue * (currentIndex.index / baselineIndex.index);
  return normalizeAmount(marketValue);
}

export function calculateBoundEquity(
  realEstate: Pick<RealEstate, 'marketValue'>,
  loans: Loan[],
): number {
  const marketValue = normalizeAmount(realEstate.marketValue ?? 0);
  const outstandingDebt = loans.reduce(
    (sum, loan) => sum + normalizeAmount(loan.remainingPrincipal),
    0,
  );

  return normalizeAmount(marketValue - outstandingDebt);
}

export function calculateAssetsTotal(...assetValues: number[]): number {
  return normalizeAmount(assetValues.reduce((sum, value) => sum + normalizeAmount(value), 0));
}

export function calculateLiabilitiesTotal(...liabilityValues: number[]): number {
  return normalizeAmount(
    liabilityValues.reduce((sum, value) => sum + normalizeAmount(value), 0),
  );
}

export function calculateNetWorth(assetsTotal: number, liabilitiesTotal: number): number {
  return normalizeAmount(assetsTotal - liabilitiesTotal);
}

export function calculateAllocationByClass(
  assetsByClass: Record<string, number>,
): Record<string, number> {
  const totalAssets = Object.values(assetsByClass).reduce(
    (sum, value) => sum + normalizeAmount(value),
    0,
  );

  if (Math.abs(totalAssets) <= ROUNDING_EPSILON) {
    return Object.fromEntries(Object.keys(assetsByClass).map((assetClass) => [assetClass, 0]));
  }

  return Object.fromEntries(
    Object.entries(assetsByClass).map(([assetClass, value]) => [
      assetClass,
      normalizeAmount((normalizeAmount(value) / totalAssets) * 100),
    ]),
  );
}

/**
 * Serverseitiger Aggregator: Client erhält nur fertige DTO-Werte.
 */
export function buildValuationDto(input: {
  realEstate: RealEstate;
  epxSeries: EpxIndex[];
  loans: Loan[];
  liquidAssets: number;
  securities: number;
  otherAssets: number;
  otherLiabilities: number;
}): ValuationDto {
  const marketValue = calculateRealEstateMarketValue(input.realEstate, input.epxSeries);
  const boundEquity = calculateBoundEquity({ marketValue }, input.loans);

  const assetsTotal = calculateAssetsTotal(
    boundEquity,
    input.liquidAssets,
    input.securities,
    input.otherAssets,
  );
  const liabilitiesTotal = calculateLiabilitiesTotal(
    ...input.loans.map((loan) => loan.remainingPrincipal),
    input.otherLiabilities,
  );
  const netWorth = calculateNetWorth(assetsTotal, liabilitiesTotal);

  const allocationByClass = calculateAllocationByClass({
    gebundenesEigenkapital: boundEquity,
    liquiditaet: input.liquidAssets,
    wertpapiere: input.securities,
    sonstiges: input.otherAssets,
  });

  return {
    marketValue,
    boundEquity,
    assetsTotal,
    liabilitiesTotal,
    netWorth,
    allocationByClass,
    marketValueFormatted: formatEUR(marketValue),
    boundEquityFormatted: formatEUR(boundEquity),
    assetsTotalFormatted: formatEUR(assetsTotal),
    liabilitiesTotalFormatted: formatEUR(liabilitiesTotal),
    netWorthFormatted: formatEUR(netWorth),
  };
}

function resolveCurrentIndex(series: EpxIndex[]): EpxIndex | undefined {
  if (series.length === 0) {
    return undefined;
  }

  return [...series].sort((a, b) => a.month.localeCompare(b.month)).at(-1);
}

function normalizeAmount(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const normalized = Object.is(value, -0) ? 0 : value;
  return Math.abs(normalized) < ROUNDING_EPSILON ? 0 : normalized;
}
