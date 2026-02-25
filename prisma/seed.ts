import { PrismaClient, InstrumentType, RealEstateSegment } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction([
    prisma.loan.deleteMany(),
    prisma.netWorthSnapshot.deleteMany(),
    prisma.priceQuote.deleteMany(),
    prisma.fxRate.deleteMany(),
    prisma.equityPosition.deleteMany(),
    prisma.cryptoPosition.deleteMany(),
    prisma.cashAccount.deleteMany(),
    prisma.epxIndex.deleteMany(),
    prisma.realEstate.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const user = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      passwordHash: '$2b$10$demoHashForLocalAuthOnly',
      displayName: 'Demo User',
    },
  });

  await prisma.equityPosition.createMany({
    data: [
      { ticker: 'AAPL', name: 'Apple Inc.', qty: 15.25, currency: 'USD', avgCost: 172.4, broker: 'IBKR' },
      { ticker: 'SAP', name: 'SAP SE', qty: 20, currency: 'EUR', avgCost: 126.35, broker: 'Trade Republic' },
    ],
  });

  await prisma.cryptoPosition.createMany({
    data: [
      { symbol: 'BTC', name: 'Bitcoin', qty: 0.35, avgCost: 29650 },
      { symbol: 'ETH', name: 'Ethereum', qty: 4.2, avgCost: 1850 },
    ],
  });

  await prisma.cashAccount.createMany({
    data: [
      { name: 'Tagesgeld', balance: 18500, currency: 'EUR' },
      { name: 'Broker USD Cash', balance: 3200, currency: 'USD' },
    ],
  });

  const apartment = await prisma.realEstate.create({
    data: {
      name: 'ETW Berlin Mitte',
      location: 'Berlin',
      segment: RealEstateSegment.APARTMENT,
      baselineValue: 420000,
      baselineMonth: '2025-01',
    },
  });

  const house = await prisma.realEstate.create({
    data: {
      name: 'Bestandshaus Köln',
      location: 'Köln',
      segment: RealEstateSegment.EXISTING_HOME,
      baselineValue: 610000,
      baselineMonth: '2025-01',
    },
  });

  await prisma.loan.createMany({
    data: [
      {
        realEstateId: apartment.id,
        lender: 'DKB',
        remainingPrincipal: 250000,
        interestRate: 2.14,
        monthlyPayment: 1250,
      },
      {
        realEstateId: house.id,
        lender: 'ING',
        remainingPrincipal: 390000,
        interestRate: 3.02,
        monthlyPayment: 1850,
      },
    ],
  });

  await prisma.priceQuote.createMany({
    data: [
      {
        instrumentType: InstrumentType.EQUITY,
        symbol: 'AAPL',
        price: 193.21,
        currency: 'USD',
        changeAbs: 1.12,
        changePct: 0.583,
        asOf: new Date('2026-02-11T10:15:00Z'),
        asOfBucket: new Date('2026-02-11T10:00:00Z'),
      },
      {
        instrumentType: InstrumentType.CRYPTO,
        symbol: 'BTC',
        price: 51234.55,
        currency: 'USD',
        changeAbs: -256.75,
        changePct: -0.498,
        asOf: new Date('2026-02-11T10:16:00Z'),
        asOfBucket: new Date('2026-02-11T10:00:00Z'),
      },
    ],
  });

  await prisma.fxRate.createMany({
    data: [
      { base: 'EUR', quote: 'USD', rate: 1.0925, asOfDate: new Date('2026-02-11T00:00:00Z') },
      { base: 'USD', quote: 'EUR', rate: 0.9153, asOfDate: new Date('2026-02-11T00:00:00Z') },
    ],
  });

  await prisma.epxIndex.createMany({
    data: [
      {
        month: '2025-12',
        apartments: 206.4821,
        existingHomes: 193.771,
        newHomes: 218.3345,
        sourceHash: 'sha256:examplehash-2025-12',
      },
      {
        month: '2026-01',
        apartments: 207.1055,
        existingHomes: 194.1122,
        newHomes: 219.0041,
        sourceHash: 'sha256:examplehash-2026-01',
      },
    ],
  });

  await prisma.netWorthSnapshot.createMany({
    data: [
      {
        date: new Date('2026-01-31T00:00:00Z'),
        assetsTotal: 1142534.15,
        liabilitiesTotal: 640000,
        netWorth: 502534.15,
      },
      {
        date: new Date('2026-02-10T00:00:00Z'),
        assetsTotal: 1150400.9,
        liabilitiesTotal: 638450,
        netWorth: 511950.9,
      },
    ],
  });

  console.log(`Seed complete for ${user.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
