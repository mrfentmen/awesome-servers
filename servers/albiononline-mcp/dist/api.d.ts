export declare class AlbiononlineError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getPrices(item: string, locations?: string, qualities?: string): Promise<string>;
export declare function getPriceHistory(item: string, date?: string, end_date?: string, timeScale?: string): Promise<string>;
export declare function getPriceCharts(item: string, date?: string, end_date?: string, timeScale?: string): Promise<string>;
export declare function getGoldPrices(date?: string, count?: number): Promise<string>;
export declare function getRecentKills(limit?: number, offset?: number): Promise<string>;
export declare function getKillDetails(eventId: number): Promise<string>;
export interface MarketSummaryArgs {
    item: string;
    quality?: number;
}
export interface PriceTrendArgs {
    item: string;
    quality?: number;
    location?: string;
    timeScale?: string;
    days?: number;
}
export declare function priceTrend(args: PriceTrendArgs): Promise<string>;
