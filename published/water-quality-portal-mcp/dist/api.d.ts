export declare class SourceError extends Error {
}
export declare function getJson(path: string, init?: RequestInit): Promise<any>;
export declare function getText(path: string, init?: RequestInit): Promise<string>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function stations_near(a: {
    lat: number;
    lon: number;
    within?: number;
    limit?: number;
}): Promise<string>;
export declare function station_detail(a: {
    siteId: string;
}): Promise<string>;
export declare function results_by_site(a: {
    siteId: string;
    limit?: number;
}): Promise<string>;
export declare function results_by_characteristic(a: {
    siteId: string;
    characteristic: string;
    limit?: number;
}): Promise<string>;
export declare function activities_by_site(a: {
    siteId: string;
    limit?: number;
}): Promise<string>;
