import { PrismaClient } from '@prisma/client';
import {
  ShockSimulationResult,
  ExposedHolding,
} from '../../../../../shared/types/event.types';
import { logger } from '../../infrastructure/logger/logger';

// ─── Severity → baseline shock coefficients ────────────────────────────────

const SEVERITY_DRAWDOWN: Record<string, number> = {
  CRITICAL: 0.08,
  HIGH: 0.045,
  MEDIUM: 0.02,
  LOW: 0.008,
};

const SEVERITY_VOL_BUMP: Record<string, number> = {
  CRITICAL: 0.12,
  HIGH: 0.07,
  MEDIUM: 0.03,
  LOW: 0.01,
};

const SEVERITY_RECOVERY_DAYS: Record<string, number> = {
  CRITICAL: 90,
  HIGH: 45,
  MEDIUM: 20,
  LOW: 7,
};

// ─── Simulator ─────────────────────────────────────────────────────────────

export class ShockSimulator {
  constructor(private readonly prisma: PrismaClient) {}

  async simulate(
    eventId: number,
    userId: number
  ): Promise<ShockSimulationResult> {
    logger.debug({ eventId, userId }, '[ShockSimulator] Running simulation');

    // 1️⃣ Fetch event + holdings
    const [event, rawHoldings] = await Promise.all([
      this.prisma.newsEvent.findUniqueOrThrow({
        where: { id: eventId },
      }),
      this.prisma.holding.findMany({
        where: { userId },
        select: {
          quantity: true,
          avgCost: true,
          asset: {
            select: {
              ticker: true,
              name: true,
              sector: true,
            },
          },
        },
      }),
    ]);

    if (!rawHoldings.length) {
      return {
        eventId,
        userId,
        estimatedDrawdown: 0,
        volatilityProjection: 0,
        exposedHoldings: [],
        recoveryDays: 0,
        confidenceInterval: { lower: 0, upper: 0 },
        simulatedAt: new Date().toISOString(),
      };
    }

    // 2️⃣ Normalize holdings
    const holdings = rawHoldings.map((h) => {
      const currentValue = h.quantity * (h.avgCost ?? 0);

      return {
        ticker: h.asset.ticker,
        name: h.asset.name ?? h.asset.ticker,
        sector: h.asset.sector ?? 'Unknown',
        currentValue,
      };
    });

    const totalValue = holdings.reduce(
      (sum, h) => sum + h.currentValue,
      0
    );

    if (totalValue === 0) {
      return {
        eventId,
        userId,
        estimatedDrawdown: 0,
        volatilityProjection: 0,
        exposedHoldings: [],
        recoveryDays: 0,
        confidenceInterval: { lower: 0, upper: 0 },
        simulatedAt: new Date().toISOString(),
      };
    }

    // 3️⃣ Prepare event context
    const affectedSectors = new Set<string>(
      (event.affectedSectors as string[]) ?? []
    );
    const affectedTickers = new Set<string>(
      (event.affectedTickers as string[]) ?? []
    );

    const baseDrawdown =
      SEVERITY_DRAWDOWN[event.severity] ?? 0.01;

    const baseVol =
      SEVERITY_VOL_BUMP[event.severity] ?? 0.01;

    const sentimentMagnitude =
      0.5 + Math.abs(Number(event.sentiment ?? 0));

    // 4️⃣ Compute exposed holdings
    const exposedHoldings: ExposedHolding[] = holdings
      .filter(
        (h) =>
          affectedSectors.has(h.sector) ||
          affectedTickers.has(h.ticker)
      )
      .map((h) => {
        const weight = h.currentValue / totalValue;

        const sectorSpecificity =
          affectedSectors.has(h.sector) ? 1.2 : 0.6;

        const estimatedImpact = parseFloat(
          (
            -baseDrawdown *
            sentimentMagnitude *
            sectorSpecificity *
            weight
          ).toFixed(4)
        );

        return {
          ticker: h.ticker,
          name: h.name,
          weight: parseFloat(weight.toFixed(4)),
          estimatedImpact,
        };
      });

    const exposedWeight = exposedHoldings.reduce(
      (sum, h) => sum + h.weight,
      0
    );

    // 5️⃣ Portfolio-level metrics
    const estimatedDrawdown = parseFloat(
      Math.min(
        baseDrawdown *
          sentimentMagnitude *
          (0.4 + exposedWeight * 0.6),
        0.4
      ).toFixed(4)
    );

    const volatilityProjection = parseFloat(
      (
        baseVol *
        (0.5 + sentimentMagnitude * 0.5)
      ).toFixed(4)
    );

    const lower = parseFloat(
      (estimatedDrawdown * 0.6).toFixed(4)
    );
    const upper = parseFloat(
      (estimatedDrawdown * 1.4).toFixed(4)
    );

    return {
      eventId,
      userId,
      estimatedDrawdown,
      volatilityProjection,
      exposedHoldings,
      recoveryDays:
        SEVERITY_RECOVERY_DAYS[event.severity] ?? 14,
      confidenceInterval: { lower, upper },
      simulatedAt: new Date().toISOString(),
    };
  }
}