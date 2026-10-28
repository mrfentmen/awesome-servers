export declare class SourceError extends Error {
}
export declare function getJson(path: string): Promise<any>;
export declare function getText(path: string, accept?: string): Promise<string>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function lookupAirport(a: {
    code: string;
}): Promise<string>;
export declare function searchAirports(a: {
    query: string;
    limit: number;
    country?: string;
}): Promise<string>;
export declare function airportsNear(a: {
    latitude: number;
    longitude: number;
    radiusKm: number;
    limit: number;
}): Promise<string>;
export declare function airportRunways(a: {
    code: string;
    limit: number;
}): Promise<string>;
export declare function airportFrequencies(a: {
    code: string;
    limit: number;
}): Promise<string>;
export declare function airportStats(a: {
    country?: string;
}): Promise<string>;
