export declare class PolygonError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listTickers(limit?: string): Promise<string>;
export declare function getTicker(ticker: string): Promise<string>;
export declare function prevClose(ticker: string): Promise<string>;
export declare function aggregates(ticker: string, from: string, to: string): Promise<string>;
export declare function groupedDaily(date: string): Promise<string>;
export declare function openClose(ticker: string, date: string): Promise<string>;
export declare function rsi(ticker: string): Promise<string>;
export declare function macd(ticker: string): Promise<string>;
export declare function dividends(ticker?: string): Promise<string>;
export declare function splits(ticker?: string): Promise<string>;
export declare function news(ticker: string, limit?: string): Promise<string>;
export declare function gainers(): Promise<string>;
/**
 * What a company has filed with the SEC: the recent filing history behind a
 * ticker, its SIC classification, its state of incorporation and its fiscal
 * year end. This is the disclosure record a price feed never carries.
 */
export declare function secFilings(args: {
    ticker: string;
    limit?: number;
    forms?: string;
}): Promise<string>;
/**
 * A company's reported annual revenue, taken from the XBRL facts the SEC
 * requires it to tag in its own filings rather than from an estimate.
 */
export declare function secRevenue(args: {
    ticker: string;
    years?: number;
}): Promise<string>;
