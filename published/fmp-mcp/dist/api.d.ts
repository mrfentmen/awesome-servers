export declare class FmpError extends Error {
}
export declare function stockQuote(symbol: string): Promise<string>;
export declare function companyProfile(symbol: string): Promise<string>;
export declare function incomeStatement(symbol: string, limit?: number): Promise<string>;
export interface FxRatesArgs {
    base: string;
    symbols: string[];
}
export interface FxHistoryArgs {
    pair: string;
    start: string;
    end: string;
    limit: number;
}
export interface PriceHistoryArgs {
    symbol: string;
    range: string;
    interval: string;
    limit: number;
}
