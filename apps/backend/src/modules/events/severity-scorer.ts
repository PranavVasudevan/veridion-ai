import { EventType } from '../../../../../shared/types/event.types';
import { Severity } from '@prisma/client';
import { SentimentResult } from './sentiment.service';

// ─── Base severity per event type ─────────────────────────────────────────────

const TYPE_BASE_SCORES: Record<EventType, number> = {
  geopolitical: 70,
  central_bank: 65,
  commodity_shock: 55,
  macro_event: 45,
  regulatory: 50,
  earnings_report: 40,
  sector_rotation: 35,
  corporate_action: 30,
};

// ─── Scorer ───────────────────────────────────────────────────────────────────

export interface SeverityScorerInput {
  eventType: EventType;
  sentiment: SentimentResult;
  portfolioExposureFraction: number; // 0–1: how much of the portfolio is exposed
  affectedSectorsCount: number;
  tickersInPortfolio: number;         // how many held tickers are mentioned
}

export class SeverityScorer {
  /**
   * Compute a 0–100 severity score and bucket it into a label.
   *
   * Score components:
   *  - 40 pts  base score from event type
   *  - 25 pts  sentiment magnitude
   *  - 20 pts  portfolio exposure
   *  - 10 pts  breadth (sectors / tickers impacted)
   *   5 pts  portfolio direct ticker overlap
   */
  score(input: SeverityScorerInput): { severity: Severity; numericScore: number } {
    const base = (TYPE_BASE_SCORES[input.eventType] ?? 40) * 0.4;

    // 0-25 from sentiment magnitude
    const sentimentPts = input.sentiment.magnitude * 25;

    // 0-20 from exposure fraction
    const exposurePts = input.portfolioExposureFraction * 20;

    // 0-10 from sector breadth (max 5 sectors → 10pts)
    const breadthPts = Math.min(input.affectedSectorsCount * 2, 10);

    // 0-5 from direct ticker overlap (max 3+)
    const tickerPts = Math.min(input.tickersInPortfolio * 1.5, 5);

    const total = parseFloat((base + sentimentPts + exposurePts + breadthPts + tickerPts).toFixed(2));
    const clamped = Math.min(100, Math.max(0, total));

    return {
      numericScore: clamped,
      severity: this.toLabel(clamped),
    };
  }

  private toLabel(score: number): Severity {
    if (score >= 75) return Severity.CRITICAL;
    if (score >= 55) return Severity.HIGH;
    if (score >= 35) return Severity.MEDIUM;
    return Severity.LOW;
  }
}
