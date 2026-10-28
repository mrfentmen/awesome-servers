export declare class SourceError extends Error {
}
export declare function getJson(path: string, init?: RequestInit): Promise<any>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function search_shows(a: {
    query: string;
    limit?: number;
}): Promise<string>;
export declare function show(a: {
    showId: number;
}): Promise<string>;
export declare function schedule(a: {
    country?: string;
    date?: string;
}): Promise<string>;
export declare function cast(a: {
    showId: number;
}): Promise<string>;
export declare function episode_by_number(a: {
    showId: number;
    season: number;
    number: number;
}): Promise<string>;
