export declare class SourceError extends Error {
}
export declare function getJson(path: string, init?: RequestInit): Promise<any>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function search(a: {
    query: string;
    type?: string;
    limit?: number;
}): Promise<string>;
export declare function artist(a: {
    artistId: number;
}): Promise<string>;
export declare function album(a: {
    albumId: number;
}): Promise<string>;
export declare function track(a: {
    trackId: number;
}): Promise<string>;
export declare function artist_top_tracks(a: {
    artistId: number;
    limit?: number;
}): Promise<string>;
export declare function chart_tracks(a: {
    limit?: number;
}): Promise<string>;
