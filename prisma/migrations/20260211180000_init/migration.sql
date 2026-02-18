-- Create enums
CREATE TYPE "RealEstateSegment" AS ENUM ('APARTMENT', 'EXISTING_HOME', 'NEW_HOME');
CREATE TYPE "InstrumentType" AS ENUM ('EQUITY', 'CRYPTO');

-- Create tables
CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "displayName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EquityPosition" (
  "id" TEXT NOT NULL,
  "ticker" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "qty" DECIMAL(18,8) NOT NULL,
  "currency" TEXT NOT NULL,
  "avgCost" DECIMAL(18,8),
  "broker" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EquityPosition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CryptoPosition" (
  "id" TEXT NOT NULL,
  "symbol" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "qty" DECIMAL(28,10) NOT NULL,
  "avgCost" DECIMAL(18,8),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CryptoPosition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CashAccount" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "balance" DECIMAL(18,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'EUR',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CashAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RealEstate" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "segment" "RealEstateSegment" NOT NULL,
  "baselineValue" DECIMAL(18,2) NOT NULL,
  "baselineMonth" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RealEstate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Loan" (
  "id" TEXT NOT NULL,
  "realEstateId" TEXT NOT NULL,
  "lender" TEXT NOT NULL,
  "remainingPrincipal" DECIMAL(18,2) NOT NULL,
  "interestRate" DECIMAL(7,4),
  "monthlyPayment" DECIMAL(18,2),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PriceQuote" (
  "id" TEXT NOT NULL,
  "instrumentType" "InstrumentType" NOT NULL,
  "symbol" TEXT NOT NULL,
  "price" DECIMAL(18,8) NOT NULL,
  "currency" TEXT NOT NULL,
  "changeAbs" DECIMAL(18,8),
  "changePct" DECIMAL(9,6),
  "asOf" TIMESTAMP(3) NOT NULL,
  "asOfBucket" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PriceQuote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FxRate" (
  "id" TEXT NOT NULL,
  "base" TEXT NOT NULL,
  "quote" TEXT NOT NULL,
  "rate" DECIMAL(18,8) NOT NULL,
  "asOfDate" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FxRate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EpxIndex" (
  "id" TEXT NOT NULL,
  "month" TEXT NOT NULL,
  "apartments" DECIMAL(18,4) NOT NULL,
  "existingHomes" DECIMAL(18,4) NOT NULL,
  "newHomes" DECIMAL(18,4) NOT NULL,
  "sourceHash" TEXT,
  "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EpxIndex_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NetWorthSnapshot" (
  "id" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "assetsTotal" DECIMAL(18,2) NOT NULL,
  "liabilitiesTotal" DECIMAL(18,2) NOT NULL,
  "netWorth" DECIMAL(18,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NetWorthSnapshot_pkey" PRIMARY KEY ("id")
);

-- Create indexes / constraints
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "EquityPosition_ticker_idx" ON "EquityPosition"("ticker");
CREATE INDEX "CryptoPosition_symbol_idx" ON "CryptoPosition"("symbol");
CREATE INDEX "RealEstate_segment_idx" ON "RealEstate"("segment");
CREATE INDEX "RealEstate_baselineMonth_idx" ON "RealEstate"("baselineMonth");
CREATE INDEX "Loan_realEstateId_idx" ON "Loan"("realEstateId");
CREATE INDEX "PriceQuote_symbol_asOf_idx" ON "PriceQuote"("symbol", "asOf");
CREATE UNIQUE INDEX "PriceQuote_instrumentType_symbol_asOfBucket_key" ON "PriceQuote"("instrumentType", "symbol", "asOfBucket");
CREATE INDEX "FxRate_base_quote_asOfDate_idx" ON "FxRate"("base", "quote", "asOfDate");
CREATE UNIQUE INDEX "FxRate_base_quote_asOfDate_key" ON "FxRate"("base", "quote", "asOfDate");
CREATE UNIQUE INDEX "EpxIndex_month_key" ON "EpxIndex"("month");
CREATE UNIQUE INDEX "NetWorthSnapshot_date_key" ON "NetWorthSnapshot"("date");

-- Add foreign key
ALTER TABLE "Loan"
  ADD CONSTRAINT "Loan_realEstateId_fkey"
  FOREIGN KEY ("realEstateId") REFERENCES "RealEstate"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
