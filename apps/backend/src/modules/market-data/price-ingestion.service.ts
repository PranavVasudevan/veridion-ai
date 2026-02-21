import { prisma } from '../../infrastructure/prisma/client';
import { fetchHistoricalPrices } from './price-fetcher';

/**
 * Ingests historical daily prices for a given asset into the database.
 * @param assetId Database ID of the asset
 * @param ticker Asset ticker for Yahoo Finance
 */
export async function ingestAssetPrices(assetId: number, ticker: string) {
    console.log(`Starting ingestion for ${ticker} (ID: ${assetId})...`);

    const prices = await fetchHistoricalPrices(ticker);

    if (prices.length === 0) {
        console.log(`No historical prices found for ${ticker}.`);
        return;
    }

    let count = 0;
    for (const record of prices) {
        if (record.close === null || record.close === undefined) continue;

        try {
            await prisma.assetPrice.upsert({
                where: {
                    assetId_priceDate: {
                        assetId: assetId,
                        priceDate: record.date,
                    },
                },
                update: {
                    price: record.close,
                },
                create: {
                    assetId: assetId,
                    priceDate: record.date,
                    price: record.close,
                },
            });
            count++;
        } catch (error) {
            console.error(`Error storing price for ${ticker} on ${record.date.toISOString()}:`, error);
        }
    }

    console.log(`Successfully stored ${count} price records for ${ticker}.`);
}
