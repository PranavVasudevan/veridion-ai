-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holding" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "assetId" INTEGER NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "avgCost" DECIMAL(65,30),
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Holding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioSnapshot" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "snapshotDate" DATE NOT NULL,
    "totalValue" DECIMAL(65,30),
    "cashValue" DECIMAL(65,30),

    CONSTRAINT "PortfolioSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioReturn" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "returnDate" DATE NOT NULL,
    "dailyReturn" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "PortfolioReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" SERIAL NOT NULL,
    "ticker" TEXT NOT NULL,
    "name" TEXT,
    "assetType" TEXT,
    "sector" TEXT,
    "country" TEXT,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetPrice" (
    "assetId" INTEGER NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "priceDate" DATE NOT NULL,

    CONSTRAINT "AssetPrice_pkey" PRIMARY KEY ("assetId","priceDate")
);

-- CreateTable
CREATE TABLE "EtfConstituent" (
    "etfAssetId" INTEGER NOT NULL,
    "underlyingAssetId" INTEGER NOT NULL,
    "weight" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "EtfConstituent_pkey" PRIMARY KEY ("etfAssetId","underlyingAssetId")
);

-- CreateTable
CREATE TABLE "OptimizationRun" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "riskTolerance" DECIMAL(65,30),
    "expectedReturnAssumption" DECIMAL(65,30),
    "volatilityAssumption" DECIMAL(65,30),
    "objectiveType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OptimizationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioAllocation" (
    "id" SERIAL NOT NULL,
    "optimizationRunId" INTEGER NOT NULL,
    "assetId" INTEGER NOT NULL,
    "weight" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "PortfolioAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskMetricsHistory" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "volatility" DECIMAL(65,30),
    "sharpeRatio" DECIMAL(65,30),
    "sortinoRatio" DECIMAL(65,30),
    "maxDrawdown" DECIMAL(65,30),
    "var95" DECIMAL(65,30),
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskMetricsHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskContribution" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "assetId" INTEGER NOT NULL,
    "contributionPercent" DECIMAL(65,30) NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialGoal" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "goalName" TEXT NOT NULL,
    "targetAmount" DECIMAL(65,30) NOT NULL,
    "targetDate" DATE NOT NULL,
    "priority" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonteCarloResult" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "goalId" INTEGER NOT NULL,
    "numberOfSimulations" INTEGER NOT NULL,
    "driftAssumption" DECIMAL(65,30),
    "volatilityAssumption" DECIMAL(65,30),
    "goalProbability" DECIMAL(65,30),
    "medianProjection" DECIMAL(65,30),
    "worstCaseProjection" DECIMAL(65,30),
    "inflationAdjusted" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonteCarloResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "category" TEXT,
    "transactionType" TEXT,
    "description" TEXT,
    "transactionDate" DATE NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiquidityStatus" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "liquidityRatio" DECIMAL(65,30),
    "emergencyFundMonths" DECIMAL(65,30),
    "stressLevel" TEXT,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiquidityStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyCashflowSummary" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "month" DATE NOT NULL,
    "totalIncome" DECIMAL(65,30),
    "totalExpenses" DECIMAL(65,30),
    "netSavings" DECIMAL(65,30),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonthlyCashflowSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpendingMetric" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "monthlyBurnRate" DECIMAL(65,30),
    "savingsRate" DECIMAL(65,30),
    "expenseVolatility" DECIMAL(65,30),
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpendingMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BehavioralScore" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "adaptiveRiskScore" DECIMAL(65,30),
    "panicSellScore" DECIMAL(65,30),
    "recencyBiasScore" DECIMAL(65,30),
    "riskChasingScore" DECIMAL(65,30),
    "liquidityStressScore" DECIMAL(65,30),
    "featureSnapshot" JSONB,
    "modelWeights" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BehavioralScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsEvent" (
    "id" SERIAL NOT NULL,
    "headline" TEXT NOT NULL,
    "source" TEXT,
    "sentimentScore" DECIMAL(65,30),
    "eventType" TEXT,
    "severityScore" DECIMAL(65,30),
    "metadata" JSONB,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "NewsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventAssetMapping" (
    "eventId" INTEGER NOT NULL,
    "assetId" INTEGER NOT NULL,
    "impactWeight" DECIMAL(65,30),

    CONSTRAINT "EventAssetMapping_pkey" PRIMARY KEY ("eventId","assetId")
);

-- CreateTable
CREATE TABLE "PortfolioEventImpact" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "eventId" INTEGER NOT NULL,
    "estimatedDrawdown" DECIMAL(65,30),
    "volatilitySpike" DECIMAL(65,30),
    "impactScore" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioEventImpact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioDrift" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "driftScore" DECIMAL(65,30),
    "maxAssetDeviation" DECIMAL(65,30),
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioDrift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RebalancingAction" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "triggerType" TEXT,
    "reason" TEXT,
    "executed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RebalancingAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioState" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "state" TEXT NOT NULL,
    "healthIndex" DECIMAL(65,30),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "alertType" TEXT,
    "severity" TEXT,
    "message" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "decisionType" TEXT,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DecisionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Holding_userId_assetId_key" ON "Holding"("userId", "assetId");

-- CreateIndex
CREATE INDEX "PortfolioSnapshot_userId_snapshotDate_idx" ON "PortfolioSnapshot"("userId", "snapshotDate");

-- CreateIndex
CREATE INDEX "PortfolioReturn_userId_returnDate_idx" ON "PortfolioReturn"("userId", "returnDate");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_ticker_key" ON "Asset"("ticker");

-- CreateIndex
CREATE INDEX "AssetPrice_priceDate_idx" ON "AssetPrice"("priceDate");

-- CreateIndex
CREATE INDEX "RiskMetricsHistory_userId_calculatedAt_idx" ON "RiskMetricsHistory"("userId", "calculatedAt");

-- CreateIndex
CREATE INDEX "RiskContribution_userId_idx" ON "RiskContribution"("userId");

-- CreateIndex
CREATE INDEX "MonteCarloResult_userId_goalId_idx" ON "MonteCarloResult"("userId", "goalId");

-- CreateIndex
CREATE INDEX "Transaction_userId_transactionDate_idx" ON "Transaction"("userId", "transactionDate");

-- CreateIndex
CREATE INDEX "LiquidityStatus_userId_idx" ON "LiquidityStatus"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyCashflowSummary_userId_month_key" ON "MonthlyCashflowSummary"("userId", "month");

-- CreateIndex
CREATE INDEX "SpendingMetric_userId_idx" ON "SpendingMetric"("userId");

-- CreateIndex
CREATE INDEX "BehavioralScore_userId_idx" ON "BehavioralScore"("userId");

-- CreateIndex
CREATE INDEX "NewsEvent_publishedAt_idx" ON "NewsEvent"("publishedAt");

-- CreateIndex
CREATE INDEX "PortfolioEventImpact_userId_idx" ON "PortfolioEventImpact"("userId");

-- CreateIndex
CREATE INDEX "PortfolioDrift_userId_idx" ON "PortfolioDrift"("userId");

-- CreateIndex
CREATE INDEX "RebalancingAction_userId_idx" ON "RebalancingAction"("userId");

-- CreateIndex
CREATE INDEX "PortfolioState_userId_idx" ON "PortfolioState"("userId");

-- CreateIndex
CREATE INDEX "Alert_userId_idx" ON "Alert"("userId");

-- CreateIndex
CREATE INDEX "DecisionLog_userId_idx" ON "DecisionLog"("userId");

-- AddForeignKey
ALTER TABLE "Holding" ADD CONSTRAINT "Holding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Holding" ADD CONSTRAINT "Holding_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetPrice" ADD CONSTRAINT "AssetPrice_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimizationRun" ADD CONSTRAINT "OptimizationRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioAllocation" ADD CONSTRAINT "PortfolioAllocation_optimizationRunId_fkey" FOREIGN KEY ("optimizationRunId") REFERENCES "OptimizationRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioAllocation" ADD CONSTRAINT "PortfolioAllocation_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskContribution" ADD CONSTRAINT "RiskContribution_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialGoal" ADD CONSTRAINT "FinancialGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonteCarloResult" ADD CONSTRAINT "MonteCarloResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonteCarloResult" ADD CONSTRAINT "MonteCarloResult_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "FinancialGoal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiquidityStatus" ADD CONSTRAINT "LiquidityStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpendingMetric" ADD CONSTRAINT "SpendingMetric_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BehavioralScore" ADD CONSTRAINT "BehavioralScore_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAssetMapping" ADD CONSTRAINT "EventAssetMapping_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "NewsEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAssetMapping" ADD CONSTRAINT "EventAssetMapping_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioEventImpact" ADD CONSTRAINT "PortfolioEventImpact_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "NewsEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioState" ADD CONSTRAINT "PortfolioState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
