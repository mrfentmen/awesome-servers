export declare class SourceError extends Error {
}
export declare function getJson(path: string, init?: RequestInit): Promise<any>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function search(a: {
    term: string;
    media?: string;
    limit?: number;
}): Promise<string>;
export declare function lookup(a: {
    id: number;
    entity?: string;
}): Promise<string>;
export declare function top_songs(a: {
    country?: string;
    limit?: number;
}): Promise<string>;
export declare function top_apps(a: {
    country?: string;
    kind?: string;
    limit?: number;
}): Promise<string>;
export declare function customer_reviews(a: {
    appId: number;
    country?: string;
    limit?: number;
}): Promise<string>;
