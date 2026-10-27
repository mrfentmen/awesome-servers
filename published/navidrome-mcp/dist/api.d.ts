export declare class NavidromeError extends Error {
}
export declare function ping(): Promise<string>;
export interface Artist {
    id: string;
    name: string;
    albums?: number;
}
export declare function listArtists(): Promise<Artist[]>;
export interface Album {
    id: string;
    name: string;
    artist?: string;
    year?: number;
    songs?: number;
}
export declare function searchLibrary(query: string, limit?: number): Promise<{
    artists: Artist[];
    albums: Album[];
}>;
export declare function streamUrl(songId: string): string;
export declare function formatAlbum(a: Album, index?: number): string;
