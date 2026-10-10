export declare class FingridError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listDatasets(): Promise<string>;
export declare function getRecords(datasetId: string, startTime?: string, endTime?: string): Promise<string>;
export declare function dayAheadPrices(args: {
    area?: string;
    hours?: number;
    start?: string;
}): Promise<string>;
export declare function bestCheapWindow(args: {
    area?: string;
    hours?: number;
    start?: string;
    window_hours?: number;
    consumption_kwh?: number;
}): Promise<string>;
