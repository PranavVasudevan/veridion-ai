import yahooFinance from 'yahoo-finance2';

/**
 * Fetches historical daily prices for a given ticker from Yahoo Finance.
 * Range: 2015-01-01 to today.
 * @param ticker Asset ticker (e.g., 'AAPL', 'BTC-USD')
 * @returns Array of price records
 */
export async function fetchHistoricalPrices(ticker: string) {
    const queryOptions = {
        period1: '2015-01-01',
        interval: '1d' as const,
    };

    try {
        const results = await yahooFinance.historical(ticker, queryOptions);

        return (results as any[])
            .filter((quote: any) => quote.close !== null && quote.close !== undefined)
            .map((quote: any) => ({
                date: new Date(quote.date),
                close: quote.close,
            }));
    } catch (error) {
        console.error(`Error fetching prices for ${ticker}:`, error);
        return [];
    }
}
