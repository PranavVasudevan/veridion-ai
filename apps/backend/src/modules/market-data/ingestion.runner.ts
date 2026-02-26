import { prisma, connectDatabase, disconnectDatabase } from '../../infrastructure/prisma/client';
import { ingestAssetPrices } from './price-ingestion.service';

/**
 * Main runner script to ingest historical prices for all assets in the database.
 */
async function main() {
    await connectDatabase();

    console.log('--- Starting Market Data Ingestion ---');

    try {
        const assets = await prisma.asset.findMany();

        if (assets.length === 0) {
            console.log('No assets found in the database. Add some assets first.');
        } else {
            console.log(`Found ${assets.length} assets to process.`);

            for (const asset of assets) {
                await ingestAssetPrices(asset.id, asset.ticker);
            }
        }
    } catch (error) {
        console.error('An error occurred during ingestion process:', error);
    } finally {
        console.log('--- Market Data Ingestion Completed ---');
        await disconnectDatabase();
    }
}

main().catch((error: any) => {
    console.error('Fatal error in runner:', error);
    process.exit(1);
});
