export declare class SourceError extends Error {
}
export declare function getJson(path: string, accept?: string, timeoutMs?: number): Promise<any>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function kpIndex(a: {
    hours?: number;
}): Promise<string>;
export declare function auroraForecast(a: {
    lat?: number;
    lon?: number;
}): Promise<string>;
export declare function alerts(a: {
    limit?: number;
}): Promise<string>;
