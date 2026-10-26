export declare class TiingoError extends Error {
}
export declare function stockMeta(symbol: string): Promise<string>;
export declare function stockPrices(symbol: string, days?: number): Promise<string>;
export declare function cryptoMeta(symbol: string): Promise<string>;
/** The risk numbers, computed from real daily closes. */
export declare function riskMetrics(args: {
    symbol?: string;
    range?: string;
}): Promise<string>;
/** Every peak-to-trough episode in the sample, not just the worst one. */
export declare function drawdownProfile(args: {
    symbol?: string;
    range?: string;
    top?: number;
}): Promise<string>;
/** How several tickers actually moved together, over real returns. */
export declare function returnCorrelation(args: {
    symbols?: string;
    range?: string;
    baseline?: string;
}): Promise<string>;
