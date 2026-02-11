const segments = ['residential', 'commercial', 'mixed'];

function createResult(success, data, errors) {
  return { success, data, errors };
}

function requireString(field, value, errors) {
  if (typeof value !== 'string' || !value.trim()) {
    errors.push(`${field} ist erforderlich.`);
    return null;
  }

  return value.trim();
}

function requireNumber(field, value, errors) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    errors.push(`${field} muss eine Zahl sein.`);
    return null;
  }

  return parsed;
}

function requireDateString(field, value, errors) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    errors.push(`${field} muss das Format YYYY-MM-DD haben.`);
    return null;
  }

  return value;
}

export function validateLoan(input) {
  const errors = [];
  const id = requireString('id', input.id, errors);
  const name = requireString('name', input.name, errors);
  const principal = requireNumber('principal', input.principal, errors);
  const interestRate = requireNumber('interestRate', input.interestRate, errors);
  const monthlyPayment = requireNumber('monthlyPayment', input.monthlyPayment, errors);

  return errors.length
    ? createResult(false, null, errors)
    : createResult(true, { id, name, principal, interestRate, monthlyPayment }, []);
}

export function validateEquityPosition(input) {
  const errors = [];
  const id = requireString('id', input.id, errors);
  const ticker = requireString('ticker', input.ticker, errors);
  const quantity = requireNumber('quantity', input.quantity, errors);
  const marketValue = requireNumber('marketValue', input.marketValue, errors);

  return errors.length
    ? createResult(false, null, errors)
    : createResult(true, { id, ticker, quantity, marketValue }, []);
}

export function validateCryptoPosition(input) {
  const errors = [];
  const id = requireString('id', input.id, errors);
  const symbol = requireString('symbol', input.symbol, errors);
  const amount = requireNumber('amount', input.amount, errors);
  const marketValue = requireNumber('marketValue', input.marketValue, errors);

  return errors.length
    ? createResult(false, null, errors)
    : createResult(true, { id, symbol, amount, marketValue }, []);
}

export function validateCashAccount(input) {
  const errors = [];
  const id = requireString('id', input.id, errors);
  const institution = requireString('institution', input.institution, errors);
  const balance = requireNumber('balance', input.balance, errors);
  const currency = requireString('currency', input.currency, errors);

  return errors.length
    ? createResult(false, null, errors)
    : createResult(true, { id, institution, balance, currency }, []);
}

export function validateRealEstate(input) {
  const errors = [];
  const id = requireString('id', input.id, errors);
  const label = requireString('label', input.label, errors);
  const segment = requireString('segment', input.segment, errors);
  const baselineValue = requireNumber('baselineValue', input.baselineValue, errors);
  const baselineMonth = requireDateString('baselineMonth', input.baselineMonth, errors);

  if (segment && !segments.includes(segment)) {
    errors.push('segment muss residential, commercial oder mixed sein.');
  }

  const rawLoans = Array.isArray(input.loans) ? input.loans : [];
  const loans = [];

  rawLoans.forEach((loanInput, index) => {
    const validation = validateLoan(loanInput);
    if (!validation.success) {
      validation.errors.forEach((e) => errors.push(`loans[${index}].${e}`));
      return;
    }
    loans.push(validation.data);
  });

  return errors.length
    ? createResult(false, null, errors)
    : createResult(true, { id, label, segment, baselineValue, baselineMonth, loans }, []);
}

export const validators = {
  equityPosition: validateEquityPosition,
  cryptoPosition: validateCryptoPosition,
  cashAccount: validateCashAccount,
  realEstate: validateRealEstate,
  loan: validateLoan,
};
