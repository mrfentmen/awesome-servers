export declare class SourceError extends Error {
}
export declare function getJson(path: string, init?: RequestInit): Promise<any>;
export declare function getText(path: string, init?: RequestInit): Promise<string>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function departures(a: {
    station: string;
}): Promise<string>;
export declare function stations(a: Record<string, never>): Promise<string>;
export declare function routes(a: Record<string, never>): Promise<string>;
export declare function advisories(a: Record<string, never>): Promise<string>;
export declare function station_info(a: {
    station: string;
}): Promise<string>;
