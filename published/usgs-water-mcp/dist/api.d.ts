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
export declare function siteInfo(a: {
    site: string;
}): Promise<string>;
export declare function dailyValues(a: {
    site: string;
    parameter?: string;
    start?: string;
    end?: string;
}): Promise<string>;
export declare const PARAMETERS: {
    code: string;
    name: string;
    unit: string;
}[];
export declare function parameterCodes(): string;
