export declare class SourceError extends Error {
}
export declare function getJson(path: string, init?: RequestInit): Promise<any>;
export declare function getText(path: string, init?: RequestInit): Promise<string>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function power_mix(a: {
    country?: string;
    limit?: number;
}): Promise<string>;
export declare function day_ahead_price(a: {
    bzn?: string;
    limit?: number;
}): Promise<string>;
export declare function installed_power(a: {
    country?: string;
    limit?: number;
}): Promise<string>;
export declare function renewable_share(a: {
    country?: string;
}): Promise<string>;
export declare function power_series(a: {
    country?: string;
    start: string;
    end: string;
    limit?: number;
}): Promise<string>;
