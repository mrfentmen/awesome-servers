export declare class AlpacaError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function account(): Promise<string>;
export declare function positions(): Promise<string>;
export declare function orders(limit?: string): Promise<string>;
export declare function orderDetails(orderId: string): Promise<string>;
export declare function positionDetails(symbol: string): Promise<string>;
export declare function marketClock(): Promise<string>;
export declare function calendar(start?: string, end?: string): Promise<string>;
export declare function listAssets(status?: string): Promise<string>;
export declare function watchlists(): Promise<string>;
export declare function portfolioHistory(period?: string): Promise<string>;
