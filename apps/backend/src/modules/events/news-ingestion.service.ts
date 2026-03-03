import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../infrastructure/logger/logger';
import { env } from '../../config/env';

export interface RawArticle {
  headline: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: Date;
  tickers?: string[];
  sectors?: string[];
}

/**
 * NewsIngestionService
 *
 * Responsibilities:
 *   1. Fetch articles from the configured news API (Polygon.io / Alpaca / NewsAPI).
 *   2. De-duplicate against the database by URL.
 *   3. Persist raw articles so downstream processors can enrich them.
 */
export class NewsIngestionService {
  constructor(private readonly prisma: PrismaClient) {}

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Fetch recent market news and upsert into DB.
   * Called by `news-fetch-job.ts` on a schedule.
   */
  async ingestLatest(options: { tickers?: string[]; limit?: number } = {}): Promise<RawArticle[]> {
    const { tickers, limit = 50 } = options;

    logger.info({ tickers, limit }, '[NewsIngestion] Starting ingestion run');

    const articles = await this.fetchFromProvider(tickers, limit);
    const fresh = await this.deduplicateAndPersist(articles);
    logger.info({ total: articles.length }, 'Massive returned articles');

    logger.info({ total: articles.length, fresh: fresh.length }, '[NewsIngestion] Ingestion complete');
    return fresh;
  }

  // ─── Internal helpers ────────────────────────────────────────────────────────

  private async fetchFromProvider(tickers?: string[], limit = 50): Promise<RawArticle[]> {
    const provider = env.NEWS_PROVIDER ?? 'massive'; // 'massive' | 'alpaca' | 'newsapi'

    switch (provider) {
      case 'massive':
        return this.fetchMassive(tickers, limit);
      case 'alpaca':
        return this.fetchAlpaca(tickers, limit);
      case 'newsapi':
        return this.fetchNewsAPI(limit);
      default:
        logger.warn(`[NewsIngestion] Unknown provider "${provider}", falling back to demo data`);
        return this.demoArticles();
    }
  }

  // ── Polygon.io ──────────────────────────────────────────────────────────────

  private async fetchMassive(tickers?: string[], limit = 50): Promise<RawArticle[]> {
    try {
      const params: Record<string, string | number> = {
        limit,
        order: 'desc',
        sort: 'published_utc',
        apiKey: env.MASSIVE_API_KEY,
      };
      if (tickers?.length) params['ticker.any_of'] = tickers.join(',');

      const { data } = await axios.get('https://api.massive.com/v2/reference/news', { params, timeout: 10_000 });

      return (data.results ?? []).map((r: any): RawArticle => ({
        headline: r.title ?? '',
        summary: r.description ?? r.title ?? '',
        source: r.publisher?.name ?? 'Massive',
        url: r.article_url ?? '',
        publishedAt: new Date(r.published_utc),
        tickers: r.tickers ?? [],
        sectors: [],
      }));
    } catch (err) {
      logger.error({ err }, '[NewsIngestion] Massive fetch failed');
      return this.demoArticles();
    }
  }

  // ── Alpaca Markets ───────────────────────────────────────────────────────────

  private async fetchAlpaca(tickers?: string[], limit = 50): Promise<RawArticle[]> {
    try {
      const params: Record<string, string | number> = { limit };
      if (tickers?.length) params.symbols = tickers.join(',');

      const { data } = await axios.get('https://data.alpaca.markets/v1beta1/news', {
        params,
        headers: {
          'APCA-API-KEY-ID': env.ALPACA_API_KEY,
          'APCA-API-SECRET-KEY': env.ALPACA_API_SECRET,
        },
        timeout: 10_000,
      });

      return (data.news ?? []).map((r: any): RawArticle => ({
        headline: r.headline ?? '',
        summary: r.summary ?? r.headline ?? '',
        source: r.source ?? 'Alpaca',
        url: r.url ?? '',
        publishedAt: new Date(r.created_at),
        tickers: r.symbols ?? [],
        sectors: [],
      }));
    } catch (err) {
      logger.error({ err }, '[NewsIngestion] Alpaca fetch failed');
      return this.demoArticles();
    }
  }

  // ── NewsAPI ──────────────────────────────────────────────────────────────────

  private async fetchNewsAPI(limit = 50): Promise<RawArticle[]> {
    try {
      const { data } = await axios.get('https://newsapi.org/v2/top-headlines', {
        params: { category: 'business', pageSize: limit, apiKey: env.NEWSAPI_KEY },
        timeout: 10_000,
      });

      return (data.articles ?? []).map((r: any): RawArticle => ({
        headline: r.title ?? '',
        summary: r.description ?? r.title ?? '',
        source: r.source?.name ?? 'NewsAPI',
        url: r.url ?? '',
        publishedAt: new Date(r.publishedAt),
        tickers: [],
        sectors: [],
      }));
    } catch (err) {
      logger.error({ err }, '[NewsIngestion] NewsAPI fetch failed');
      return this.demoArticles();
    }
  }

  // ── De-duplication & persistence ─────────────────────────────────────────────

  private async deduplicateAndPersist(articles: RawArticle[]): Promise<RawArticle[]> {
    const freshArticles: RawArticle[] = [];

    for (const article of articles) {
      if (!article.url) continue;

      const existing = await this.prisma.newsEvent.findFirst({
        where: { url: article.url },
        select: { id: true },
      });

      if (existing) continue;

      await this.prisma.newsEvent.create({
        data: {
          headline: article.headline,
          summary: article.summary,
          source: article.source,
          url: article.url,
          publishedAt: article.publishedAt,
          affectedTickers: article.tickers ?? [],
          affectedSectors: article.sectors ?? [],
          processed: false,
          // severity / eventType / sentiment filled in by downstream processors
          severity: 'LOW',
          eventType: 'macro_event',
          sentiment: 0,
          sentimentLabel: 'Neutral',
        },
      });

      freshArticles.push(article);
    }

    return freshArticles;
  }

  // ── Demo / fallback data ─────────────────────────────────────────────────────

  private demoArticles(): RawArticle[] {
    const now = new Date();
    return [
      {
        headline: 'Fed signals potential rate cut amid cooling inflation data',
        summary: 'Federal Reserve officials hinted at an upcoming pivot in monetary policy as the latest CPI reading came in below expectations at 2.8%.',
        source: 'Reuters',
        url: `https://example.com/fed-rate-cut-${Date.now()}`,
        publishedAt: new Date(now.getTime() - 30 * 60_000),
        tickers: [],
        sectors: ['Financials', 'Real Estate', 'Utilities'],
      },
      {
        headline: 'NVDA beats Q2 earnings by 18%; data-center revenue surges',
        summary: 'NVIDIA reported Q2 EPS of $6.40 vs estimates of $5.42, driven by AI accelerator demand from hyperscalers.',
        source: 'Bloomberg',
        url: `https://example.com/nvda-earnings-${Date.now()}`,
        publishedAt: new Date(now.getTime() - 2 * 60 * 60_000),
        tickers: ['NVDA', 'AMD', 'INTC'],
        sectors: ['Technology', 'Semiconductors'],
      },
      {
        headline: 'Oil prices drop 4% on surprise OPEC+ output increase',
        summary: 'Brent crude fell to $78/bbl after Saudi Arabia and the UAE agreed to add 500k bpd to global supply starting next quarter.',
        source: 'FT',
        url: `https://example.com/opec-output-${Date.now()}`,
        publishedAt: new Date(now.getTime() - 4 * 60 * 60_000),
        tickers: ['XOM', 'CVX', 'SLB'],
        sectors: ['Energy'],
      },
    ];
  }
}
