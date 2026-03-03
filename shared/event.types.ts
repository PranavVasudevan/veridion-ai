// ─── Enums ────────────────────────────────────────────────────────────────────

export type EventSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type EventType =
  | 'earnings_report'
  | 'macro_event'
  | 'geopolitical'
  | 'regulatory'
  | 'central_bank'
  | 'commodity_shock'
  | 'sector_rotation'
  | 'corporate_action';

// ─── Core Event ───────────────────────────────────────────────────────────────

export interface MarketEvent {
  id: number;
  headline: string;
  summary: string;
  source: string;
  url: string | null;
  publishedAt: string; // ISO-8601
  severity: EventSeverity;
  eventType: EventType;
  sentiment: number;       // –1.0 … +1.0
  sentimentLabel: string;  // 'Bearish' | 'Neutral' | 'Bullish'
  affectedSectors: string[];
  affectedTickers: string[];
  processed: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Exposure ─────────────────────────────────────────────────────────────────

export interface SectorExposureItem {
  sector: string;
  exposure: number;  // 0–1  (fraction of portfolio value exposed to this sector's events)
  weight: number;    // 0–1  (portfolio weight in this sector)
  eventCount: number;
}

export interface ExposureReport {
  overallExposure: number; // 0–1
  sectorExposure: SectorExposureItem[];
  criticalEventIds: number[];
  generatedAt: string;
}

// ─── Shock Simulation ─────────────────────────────────────────────────────────

export interface ExposedHolding {
  ticker: string;
  name: string;
  weight: number;
  estimatedImpact: number; // % change e.g. –0.04 = –4 %
}

export interface ShockSimulationResult {
  eventId: number;
  estimatedDrawdown: number;       // 0–1
  volatilityProjection: number;    // annualised vol change
  exposedHoldings: ExposedHolding[];
  recoveryDays: number | null;
  confidenceInterval: { lower: number; upper: number };
  simulatedAt: string;
}

// ─── API Contracts ────────────────────────────────────────────────────────────

export interface GetEventsQuery {
  severity?: EventSeverity | EventSeverity[];
  eventType?: EventType | EventType[];
  since?: string;       // ISO-8601
  limit?: number;
  offset?: number;
}

export interface GetEventsResponse {
  events: MarketEvent[];
  total: number;
  limit: number;
  offset: number;
}

export interface GetExposureResponse {
  exposure: ExposureReport;
}

export interface SimulateShockRequest {
  eventId: number;
}
