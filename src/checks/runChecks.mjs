import { createEntity, updateEntity, deleteEntity, listEntities } from '../server/actions.mjs';
import { csvImportEndpointStub } from '../server/csvImport.mjs';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const realEstateCreate = createEntity('realEstate', {
  id: 're-1',
  label: 'Wohnung Berlin',
  segment: 'residential',
  baselineValue: 320000,
  baselineMonth: '2025-01-01',
  loans: [
    {
      id: 'loan-1',
      name: 'KfW',
      principal: 200000,
      interestRate: 2.5,
      monthlyPayment: 900,
    },
  ],
});
assert(realEstateCreate.ok, 'realEstate create should pass');

const invalidRealEstate = createEntity('realEstate', {
  id: 're-2',
  label: 'Fehlerobjekt',
  baselineValue: 100,
  baselineMonth: '2025-01-01',
  loans: [],
});
assert(!invalidRealEstate.ok, 'missing segment should fail');

const equityCreate = createEntity('equityPosition', {
  id: 'eq-1',
  ticker: 'MSFT',
  quantity: 12,
  marketValue: 4500,
});
assert(equityCreate.ok, 'equity create should pass');

const equityUpdate = updateEntity('equityPosition', 'eq-1', { marketValue: 4600 });
assert(equityUpdate.ok && equityUpdate.data.marketValue === 4600, 'equity update should pass');

const deleteResult = deleteEntity('equityPosition', 'eq-1');
assert(deleteResult.ok, 'delete should pass');
assert(listEntities('equityPosition').length === 0, 'equity list should be empty');

const csvResult = csvImportEndpointStub({
  csv: `equityPosition,eq-2,AAPL,4,888\ncryptoPosition,c-1,BTC,0.2,9000`,
});
assert(csvResult.status === 200, 'csv endpoint should return 200');
assert(csvResult.body.imported.every((x) => x.ok), 'csv imports should pass');

console.log('All checks passed.');
