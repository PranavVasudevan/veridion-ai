import { PrismaClient } from '@prisma/client';
import { ExposureReport, SectorExposureItem } from '../../../../../shared/types/event.types';
import { logger } from '../../infrastructure/logger/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Holding {
  ticker: string;
  sector: string;
  currentValue: number;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class ExposureMapper {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Compute sector-level event exposure for a given portfolio.
   *
   * Algorithm:
   *   For each sector in the portfolio:
   *     exposure_fraction = (# recent events touching this sector) / max(events, 1) * 0.8
   *                        + (weight_in_sector) * 0.2
   *
   * The overall exposure is the weighted average of sector exposures.
   */
  async computeExposure(userId: number): Promise<ExposureReport> {
    logger.debug({ userId }, '[ExposureMapper] Computing exposure');

    const [holdings, recentEvents] = await Promise.all([
      this.getHoldings(userId),
      this.getRecentEvents(48), // last 48 hours
    ]);

    if (!holdings.length) {
      return this.emptyReport(userId);
    }

    const totalPortfolioValue = holdings.reduce((s, h) => s + h.currentValue, 0);

    // Build sector → weight map
    const sectorWeightMap = new Map<string, number>();
    for (const h of holdings) {
      const prev = sectorWeightMap.get(h.sector) ?? 0;
      sectorWeightMap.set(h.sector, prev + h.currentValue / totalPortfolioValue);
    }

    // Count events per sector
    const sectorEventCounts = new Map<string, number>();
    const criticalEventIds: number[] = [];

    for (const ev of recentEvents) {
      const sectors: string[] = ev.affectedSectors as string[];
      for (const sec of sectors) {
        sectorEventCounts.set(sec, (sectorEventCounts.get(sec) ?? 0) + 1);
      }
      if (ev.severity === 'CRITICAL') criticalEventIds.push(ev.id);
    }

    const maxEventCount = Math.max(...Array.from(sectorEventCounts.values()), 1);

    // Build sector exposure array (only sectors where portfolio has weight)
    const sectorExposure: SectorExposureItem[] = [];

    for (const [sector, weight] of sectorWeightMap.entries()) {
      const eventCount = sectorEventCounts.get(sector) ?? 0;
      const eventFraction = eventCount / maxEventCount;

      // Exposure = 80% driven by event activity in sector, 20% by portfolio weight
      const exposure = parseFloat((eventFraction * 0.8 + weight * 0.2).toFixed(4));

      sectorExposure.push({ sector, exposure, weight: parseFloat(weight.toFixed(4)), eventCount });
    }

    sectorExposure.sort((a, b) => b.exposure - a.exposure);

    // Overall exposure = weighted average of sector exposures
    const overallExposure = parseFloat(
      sectorExposure
        .reduce((sum, s) => sum + s.exposure * s.weight, 0)
        .toFixed(4),
    );

    return {
      userId,
      overallExposure,
      sectorExposure,
      criticalEventIds,
      generatedAt: new Date().toISOString(),
    };
  }

  // ─── Private ─────────────────────────────────────────────────────────────────

  private async getHoldings(userId: number) {
    const rows = await this.prisma.holding.findMany({
      where: { userId },
      select: {
        quantity: true,
        avgCost: true,
        asset: {
          select: {
            ticker: true,
            sector: true,
          },
        },
      },
    });

    return rows.map((h) => {
      const currentValue = h.quantity * (h.avgCost ?? 0);

      return {
        ticker: h.asset.ticker,
        sector: h.asset.sector ?? 'Unknown',
        currentValue,
      };
    });
  }
  
  private async getRecentEvents(hours: number) {
    const since = new Date(Date.now() - hours * 60 * 60_000);
    return this.prisma.newsEvent.findMany({
      where: { publishedAt: { gte: since } },
      select: { id: true, severity: true, affectedSectors: true },
    });
  }

  private emptyReport(userId: number): ExposureReport {
    return {
      userId,
      overallExposure: 0,
      sectorExposure: [],
      criticalEventIds: [],
      generatedAt: new Date().toISOString(),
    };
  }
}
