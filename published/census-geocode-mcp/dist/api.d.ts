export declare class SourceError extends Error {
}
export declare function getJson(path: string, init?: RequestInit): Promise<any>;
export declare function getText(path: string, init?: RequestInit): Promise<string>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function geocode_oneline(a: {
    address: string;
    limit?: number;
}): Promise<string>;
export declare function geocode_address(a: {
    street: string;
    city: string;
    state: string;
    zip?: string;
}): Promise<string>;
export declare function congressional_district(a: {
    lat: number;
    lon: number;
}): Promise<string>;
export declare function geographies(a: {
    lat: number;
    lon: number;
    layers?: number;
}): Promise<string>;
export declare function benchmarks(a: Record<string, never>): Promise<string>;
