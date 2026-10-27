export declare class WaterError extends Error {
}
export declare function streamflow(site: string, parameter?: string, start?: string, end?: string): Promise<any>;
export declare function gauges(bbox: string, limit?: number): Promise<{
    value?: {
        timeSeries?: unknown[];
        queryInfo?: unknown;
        sourceInfo?: unknown[];
    };
}>;
export declare function format(data: any): string;
export interface DailyValuesArgs {
    site: string;
    parameter?: string;
    period?: string;
}
export interface LatestValueArgs {
    site: string;
    parameter?: string;
}
export declare function latestValue(args: LatestValueArgs): Promise<string>;
