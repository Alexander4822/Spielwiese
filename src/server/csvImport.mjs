import { createEntity } from './actions.mjs';

function parseLine(line) {
  return line
    .split(',')
    .map((value) => value.trim())
    .map((value) => value.replace(/^"|"$/g, ''));
}

/**
 * Stub endpoint logic for CSV imports.
 * Supported format (first column): entity,id,<entity specific fields...>
 */
export function importPositionsCsv(csvRaw) {
  const lines = csvRaw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const report = [];

  for (const line of lines) {
    const [entity, id, a, b, c, d] = parseLine(line);
    if (!entity || !id) {
      report.push({ line, ok: false, reason: 'entity oder id fehlt' });
      continue;
    }

    let payload;

    switch (entity) {
      case 'equityPosition':
        payload = { id, ticker: a, quantity: b, marketValue: c };
        break;
      case 'cryptoPosition':
        payload = { id, symbol: a, amount: b, marketValue: c };
        break;
      case 'cashAccount':
        payload = { id, institution: a, balance: b, currency: c };
        break;
      case 'loan':
        payload = { id, name: a, principal: b, interestRate: c, monthlyPayment: d };
        break;
      default:
        report.push({ line, ok: false, reason: `entity ${entity} nicht unterstützt` });
        continue;
    }

    const result = createEntity(entity, payload);
    report.push(result.ok ? { line, ok: true } : { line, ok: false, reason: result.errors.join('; ') });
  }

  return report;
}

export function csvImportEndpointStub(requestBody) {
  if (!requestBody || typeof requestBody.csv !== 'string') {
    return { status: 400, body: { error: 'csv payload fehlt' } };
  }

  return {
    status: 200,
    body: {
      imported: importPositionsCsv(requestBody.csv),
      note: 'Stub-Endpoint: aktuell synchron & in-memory.',
    },
  };
}
