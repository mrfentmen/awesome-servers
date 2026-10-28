export declare class SourceError extends Error {
}
export declare function getJson(path: string, init?: RequestInit): Promise<any>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function search_artists(a: {
    query: string;
    limit?: number;
}): Promise<string>;
export declare function artist_releases(a: {
    artistId: string;
    limit?: number;
}): Promise<string>;
export declare function search_recordings(a: {
    query: string;
    limit?: number;
}): Promise<string>;
export declare function search_releases(a: {
    query: string;
    limit?: number;
}): Promise<string>;
export declare function search_labels(a: {
    query: string;
    limit?: number;
}): Promise<string>;
