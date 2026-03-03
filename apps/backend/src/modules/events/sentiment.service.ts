import { logger } from '../../infrastructure/logger/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SentimentResult {
  score: number;        // –1.0 … +1.0
  label: string;        // 'Bearish' | 'Slightly Bearish' | 'Neutral' | 'Slightly Bullish' | 'Bullish'
  magnitude: number;    // 0.0 … 1.0 (strength, absolute value of score)
  signals: string[];    // which keywords fired
}

// ─── Lexicons ─────────────────────────────────────────────────────────────────

const BULLISH_TERMS: [string, number][] = [
  ['beat', 0.6], ['beats', 0.6], ['surges', 0.7], ['surge', 0.7], ['soars', 0.7],
  ['record high', 0.8], ['all-time high', 0.8], ['upgrades', 0.5], ['upgrade', 0.5],
  ['outperforms', 0.5], ['profit', 0.4], ['growth', 0.4], ['expansion', 0.4],
  ['rally', 0.5], ['rallied', 0.5], ['recovery', 0.45], ['strong', 0.35],
  ['positive', 0.35], ['bullish', 0.7], ['optimistic', 0.5], ['raised guidance', 0.65],
  ['dividend increase', 0.5], ['buyback', 0.45], ['acquisition', 0.3],
];

const BEARISH_TERMS: [string, number][] = [
  ['miss', -0.6], ['misses', -0.6], ['plunges', -0.75], ['plunge', -0.75],
  ['crashes', -0.8], ['crash', -0.8], ['recession', -0.7], ['default', -0.75],
  ['downgrade', -0.55], ['downgrades', -0.55], ['warning', -0.4], ['warned', -0.4],
  ['cut guidance', -0.65], ['missed estimates', -0.65], ['layoffs', -0.55],
  ['bankruptcy', -0.85], ['investigation', -0.5], ['lawsuit', -0.45],
  ['selloff', -0.65], ['sell-off', -0.65], ['decline', -0.4], ['falling', -0.45],
  ['bearish', -0.7], ['pessimistic', -0.5], ['inflation', -0.3], ['rate hike', -0.5],
  ['tariff', -0.4], ['sanctions', -0.55], ['geopolitical', -0.35],
];

// ─── Service ──────────────────────────────────────────────────────────────────

export class SentimentService {
  /**
   * Score a piece of text using a dictionary-based approach.
   * Production enhancement: replace body with a call to a local FinBERT model
   * or a Hugging Face inference endpoint.
   */
  score(text: string): SentimentResult {
    const lower = text.toLowerCase();
    let score = 0;
    const signals: string[] = [];

    for (const [term, weight] of BULLISH_TERMS) {
      if (lower.includes(term)) {
        score += weight;
        signals.push(`+${term}`);
      }
    }

    for (const [term, weight] of BEARISH_TERMS) {
      if (lower.includes(term)) {
        score += weight; // weight is negative
        signals.push(`${term}`);
      }
    }

    // Clamp to [–1, 1]
    const clamped = Math.max(-1, Math.min(1, score));

    return {
      score: parseFloat(clamped.toFixed(4)),
      label: this.toLabel(clamped),
      magnitude: parseFloat(Math.abs(clamped).toFixed(4)),
      signals: [...new Set(signals)].slice(0, 10),
    };
  }

  /**
   * Score multiple texts and return the weighted average.
   * weights default to equal.
   */
  scoreAggregate(texts: string[], weights?: number[]): SentimentResult {
    if (!texts.length) return { score: 0, label: 'Neutral', magnitude: 0, signals: [] };

    const w = weights ?? texts.map(() => 1 / texts.length);
    let totalScore = 0;
    const allSignals: string[] = [];

    texts.forEach((t, i) => {
      const r = this.score(t);
      totalScore += r.score * w[i];
      allSignals.push(...r.signals);
    });

    const clamped = Math.max(-1, Math.min(1, totalScore));
    return {
      score: parseFloat(clamped.toFixed(4)),
      label: this.toLabel(clamped),
      magnitude: parseFloat(Math.abs(clamped).toFixed(4)),
      signals: [...new Set(allSignals)].slice(0, 10),
    };
  }

  // ─── Private ─────────────────────────────────────────────────────────────────

  private toLabel(score: number): string {
    if (score >= 0.5) return 'Bullish';
    if (score >= 0.15) return 'Slightly Bullish';
    if (score <= -0.5) return 'Bearish';
    if (score <= -0.15) return 'Slightly Bearish';
    return 'Neutral';
  }
}
