/**
 * Sun and Moon Almanac — keyless public API client.
 */
export declare class SourceError extends Error {
}
export declare function clean(s: unknown): string;
export declare function solarTimes(a: {
    lat: number;
    lon: number;
    date?: string;
    utcOffset?: number;
}): Promise<string>;
export declare function sunPosition(a: {
    lat: number;
    lon: number;
    datetime?: string;
}): Promise<string>;
export declare function moonPhase(a: {
    datetime?: string;
}): Promise<string>;
