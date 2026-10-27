export declare class KucoinError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getServerTime(): Promise<string>;
export declare function listSymbols(market?: string): Promise<string>;
export declare function get24hStats(symbol: string): Promise<string>;
export declare function getOrderbook(symbol: string): Promise<string>;
export declare function getKlines(symbol: string, type?: string, startAt?: number, endAt?: number): Promise<string>;
export declare function getFiatPrices(currencies?: string, base?: string): Promise<string>;
