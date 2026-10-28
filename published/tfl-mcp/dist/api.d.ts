export declare class SourceError extends Error {
}
export declare function getJson(path: string, accept?: string, timeoutMs?: number): Promise<any>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function lineStatus(a: {
    modes?: string;
}): Promise<string>;
export declare function searchStops(a: {
    query: string;
    limit?: number;
}): Promise<string>;
export declare function stationArrivals(a: {
    stopId: string;
    limit?: number;
}): Promise<string>;
