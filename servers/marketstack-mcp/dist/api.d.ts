export declare class MarketstackError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getLatestEod(symbols: string): Promise<string>;
export declare function getEodOnDate(symbols: string, date: string): Promise<string>;
export declare function searchTickers(query: string, limit?: number): Promise<string>;
export declare function listExchanges(): Promise<string>;
export declare function getDividends(symbols: string): Promise<string>;
/** The dividend ledger for a symbol, read from Nasdaq's public dividend endpoint. */
export declare function symbolDividendLedger(args: {
    symbol: string;
    limit?: number;
}): Promise<string>;
/** What a price did over a real date range: sessions, direction, extremes and volume. */
export declare function priceWindowReview(args: {
    symbol: string;
    from?: string;
    to?: string;
    limit?: number;
}): Promise<string>;
