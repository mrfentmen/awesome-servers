export declare class AlphaVantageError extends Error {
}
export declare function stockQuote(symbol: string): Promise<string>;
export declare function fxRate(from: string, to: string): Promise<string>;
export declare function cryptoPrice(symbol: string, market?: string): Promise<string>;
export declare function symbolSearch(keywords: string): Promise<string[]>;
/**
 * A symbol's own price history, read from the daily or intraday series: the
 * window's high, low, close and range, a mean and how far the last close sits from
 * it, the traded volume, and the most recent days. A quote says where the price is;
 * this says where it has been and how wide the range has been.
 */
export declare function priceHistory(args: {
    symbol: string;
    days?: number;
    interval?: string;
}): Promise<string>;
export declare function companyProfile(symbol: string): Promise<string>;
