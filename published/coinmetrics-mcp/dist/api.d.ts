export declare class CoinmetricsError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getAssetMetrics(assets: string, metrics: string, startTime: string, endTime: string, frequency?: string): Promise<string>;
export declare function listMetrics(assets: string): Promise<string>;
export declare function metricDefinitions(args: {
    search?: string;
    limit?: number;
}): Promise<string>;
export declare function candlePairs(args: {
    search?: string;
    limit?: number;
}): Promise<string>;
