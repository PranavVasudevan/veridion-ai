import { EventType } from '../../../../../shared/types/event.types';

// ─── Classification Rule ──────────────────────────────────────────────────────

interface ClassificationRule {
  type: EventType;
  keywords: string[];
  sectorHints: string[];
}

// ─── Rules Table ──────────────────────────────────────────────────────────────

const RULES: ClassificationRule[] = [
  {
    type: 'earnings_report',
    keywords: ['earnings', 'eps', 'revenue', 'quarterly results', 'beat estimates', 'missed estimates', 'guidance'],
    sectorHints: [],
  },
  {
    type: 'central_bank',
    keywords: ['federal reserve', 'fed', 'fomc', 'rate hike', 'rate cut', 'interest rate', 'boe', 'ecb', 'boj', 'central bank', 'monetary policy'],
    sectorHints: ['Financials', 'Real Estate', 'Utilities'],
  },
  {
    type: 'geopolitical',
    keywords: ['war', 'conflict', 'sanctions', 'invasion', 'military', 'geopolitical', 'nato', 'un security council', 'tariff', 'trade war', 'trade dispute'],
    sectorHints: ['Energy', 'Defense', 'Materials'],
  },
  {
    type: 'regulatory',
    keywords: ['regulation', 'sec', 'investigation', 'lawsuit', 'antitrust', 'compliance', 'fine', 'penalty', 'ruling', 'legislation', 'ban'],
    sectorHints: ['Financials', 'Technology', 'Healthcare'],
  },
  {
    type: 'commodity_shock',
    keywords: ['oil', 'crude', 'opec', 'natural gas', 'wheat', 'corn', 'gold', 'copper', 'commodity', 'supply chain', 'shortage'],
    sectorHints: ['Energy', 'Materials', 'Consumer Staples'],
  },
  {
    type: 'sector_rotation',
    keywords: ['rotation', 'sector shift', 'growth to value', 'defensive', 'cyclical', 'risk-off', 'risk-on', 'flight to safety'],
    sectorHints: [],
  },
  {
    type: 'corporate_action',
    keywords: ['merger', 'acquisition', 'ipo', 'spinoff', 'dividend', 'buyback', 'bankruptcy', 'restructuring', 'layoffs'],
    sectorHints: [],
  },
  // default fallthrough
  {
    type: 'macro_event',
    keywords: ['gdp', 'inflation', 'cpi', 'ppi', 'unemployment', 'jobs report', 'nonfarm', 'consumer confidence', 'pmi', 'recession', 'economy'],
    sectorHints: [],
  },
];

// ─── Sector Keyword Map ───────────────────────────────────────────────────────

const SECTOR_KEYWORDS: [string, string][] = [
  ['technology', 'Technology'], ['software', 'Technology'], ['semiconductor', 'Technology'],
  ['chip', 'Technology'], ['ai ', 'Technology'], ['cloud', 'Technology'],
  ['bank', 'Financials'], ['finance', 'Financials'], ['insurance', 'Financials'],
  ['fintech', 'Financials'], ['credit', 'Financials'], ['mortgage', 'Financials'],
  ['oil', 'Energy'], ['gas', 'Energy'], ['opec', 'Energy'], ['energy', 'Energy'],
  ['healthcare', 'Healthcare'], ['pharma', 'Healthcare'], ['biotech', 'Healthcare'],
  ['drug', 'Healthcare'], ['fda', 'Healthcare'],
  ['retail', 'Consumer Discretionary'], ['auto', 'Consumer Discretionary'],
  ['travel', 'Consumer Discretionary'], ['airline', 'Consumer Discretionary'],
  ['food', 'Consumer Staples'], ['beverage', 'Consumer Staples'],
  ['real estate', 'Real Estate'], ['reit', 'Real Estate'],
  ['utility', 'Utilities'], ['electric', 'Utilities'],
  ['materials', 'Materials'], ['mining', 'Materials'], ['steel', 'Materials'],
  ['industrial', 'Industrials'], ['manufacturing', 'Industrials'], ['defense', 'Defense'],
];

// ─── Classifier ───────────────────────────────────────────────────────────────

export class EventClassifier {
  /**
   * Classify a market event by scanning headline + summary for known keywords.
   * Returns the best-matching EventType and a list of affected sectors.
   */
  classify(headline: string, summary: string): { eventType: EventType; affectedSectors: string[] } {
    const text = `${headline} ${summary}`.toLowerCase();

    const eventType = this.detectEventType(text);
    const affectedSectors = this.detectSectors(text, eventType);

    return { eventType, affectedSectors };
  }

  // ─── Private ─────────────────────────────────────────────────────────────────

  private detectEventType(text: string): EventType {
    let bestType: EventType = 'macro_event';
    let bestScore = 0;

    for (const rule of RULES) {
      const hits = rule.keywords.filter((kw) => text.includes(kw)).length;
      if (hits > bestScore) {
        bestScore = hits;
        bestType = rule.type;
      }
    }

    return bestType;
  }

  private detectSectors(text: string, eventType: EventType): string[] {
    const detected = new Set<string>();

    // keyword scan
    for (const [kw, sector] of SECTOR_KEYWORDS) {
      if (text.includes(kw)) detected.add(sector);
    }

    // add sector hints from the matched rule
    const rule = RULES.find((r) => r.type === eventType);
    if (rule) rule.sectorHints.forEach((s) => detected.add(s));

    return Array.from(detected).slice(0, 5);
  }
}
