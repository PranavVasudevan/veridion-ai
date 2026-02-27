/**
 * Job queue placeholder — will be implemented in Phase 2
 * using BullMQ + Redis for background jobs like:
 *   - daily-risk-job
 *   - montecarlo-refresh-job
 *   - news-fetch-job
 *   - event-processing-job
 *   - rebalancing-check-job
 *   - liquidity-check-job
 */

import { logger } from "../logger/logger";

export interface JobDefinition {
  name: string;
  data: Record<string, unknown>;
  options?: {
    delay?: number;
    repeat?: { cron: string };
  };
}

export async function enqueueJob(job: JobDefinition): Promise<void> {
  // TODO: Replace with BullMQ in Phase 2
  logger.info(job.data, `[JobQueue] Enqueued: ${job.name}`);
}

export async function initJobQueue(): Promise<void> {
  logger.info("Job queue running in stub mode (Phase 2)");
}