export declare class SourceError extends Error {
}
export declare function getJson(path: string, init?: RequestInit): Promise<any>;
export declare function clampLimit(n: number | undefined, fallback: number, max: number): number;
export declare function clean(s: unknown): string;
export declare function bullet(label: string, value: unknown): string;
export declare function section(title: string, rows: string[]): string;
export declare function search_artworks(a: {
    query: string;
    limit?: number;
}): Promise<string>;
export declare function artwork(a: {
    artworkId: number;
}): Promise<string>;
export declare function artist_search(a: {
    query: string;
    limit?: number;
}): Promise<string>;
export declare function artist(a: {
    artistId: number;
}): Promise<string>;
export declare function artwork_image_url(a: {
    artworkId: number;
    width?: number;
}): Promise<string>;
