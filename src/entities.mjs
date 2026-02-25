export const ENTITY_NAMES = [
  'equityPosition',
  'cryptoPosition',
  'cashAccount',
  'realEstate',
  'loan',
];

/**
 * In-memory stores to keep the example self-contained.
 * Replace with database repositories in production.
 */
export const stores = {
  equityPosition: new Map(),
  cryptoPosition: new Map(),
  cashAccount: new Map(),
  realEstate: new Map(),
  loan: new Map(),
};
