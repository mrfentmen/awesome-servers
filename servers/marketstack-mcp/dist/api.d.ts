export declare class MarketstackError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getLatestEod(symbols: string): Promise<string>;
export declare function getEodOnDate(symbols: string, date: string): Promise<string>;
export declare function searchTickers(query: string, limit?: number): Promise<string>;
export declare function listExchanges(): Promise<string>;
export declare function getDividends(symbols: string): Promise<string>;
