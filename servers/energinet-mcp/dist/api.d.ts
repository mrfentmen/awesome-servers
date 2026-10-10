export declare class EnerginetError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getPowerNow(limit?: number): Promise<string>;
export declare function getDataset(dataset: string, limit?: number): Promise<string>;
/**
 * The day-ahead dataset has a different shape from every other Energinet feed:
 * one row per price zone per hour. The generic dataset tool dumps it as JSON,
 * which makes it hard to answer the only question anyone has, which is where
 * power is cheap right now.
 */
export declare function dayAheadPrices(args: {
    hours?: number;
    zone?: string;
}): Promise<string>;
export declare function carbonTrend(args: {
    samples?: number;
}): Promise<string>;
export declare function generationMix(_args: Record<string, never>): Promise<string>;
export declare function exchangeBalance(_args: Record<string, never>): Promise<string>;
