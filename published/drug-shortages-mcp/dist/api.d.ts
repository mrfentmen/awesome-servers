export declare class SourceError extends Error {
}
export declare function getJson(path: string, init?: RequestInit): Promise<any>;
export declare function getText(path: string, init?: RequestInit): Promise<string>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function asList(v: unknown): string[];
export declare function search_shortages(a: {
    term: string;
    limit?: number;
}): Promise<string>;
export declare function shortages_by_status(a: {
    status: string;
    limit?: number;
}): Promise<string>;
export declare function shortages_by_manufacturer(a: {
    manufacturer: string;
    limit?: number;
}): Promise<string>;
export declare function shortage_by_ndc(a: {
    ndc: string;
}): Promise<string>;
export declare function search_by_brand(a: {
    brand: string;
    limit?: number;
}): Promise<string>;
export declare function shortage_stats(a: Record<string, never>): Promise<string>;
