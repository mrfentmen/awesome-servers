export declare class GoatcounterError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getTotals(start?: string, end?: string): Promise<string>;
export declare function getHits(limit?: number): Promise<string>;
export declare function getBreakdown(page: string): Promise<string>;
