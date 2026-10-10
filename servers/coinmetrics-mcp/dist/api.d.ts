export declare class CoinmetricsError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getAssetMetrics(assets: string, metrics: string, startTime: string, endTime: string, frequency?: string): Promise<string>;
export declare function listMetrics(assets: string): Promise<string>;
/**
 * CoinMetrics publishes a catalogue of every asset it carries, with each one's
 * metrics and the window of history available for them. Nothing else on the
 * server exposes that list, and it is the only way to know which id to ask for.
 */
export declare function assetCatalog(args: {
    search?: string;
    limit?: number;
}): Promise<string>;
export declare function metricCatalog(args: {
    search?: string;
    limit?: number;
}): Promise<string>;
export declare function assetPerformance(args: {
    assets?: string;
    days?: number;
}): Promise<string>;
export declare function institutionCatalog(args: {
    search?: string;
    limit?: number;
}): Promise<string>;
