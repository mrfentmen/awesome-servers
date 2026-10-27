export declare class ItunesError extends Error {
}
export declare function searchMusic(term: string, entity: string, limit: number): Promise<string>;
export declare function artistAlbums(artistId: number, limit: number): Promise<string>;
export declare function albumTracks(collectionId: number): Promise<string>;
export declare function searchPodcasts(term: string, limit: number): Promise<string>;
export declare function searchApps(term: string, limit: number): Promise<string>;
export declare function searchBooks(term: string, limit: number): Promise<string>;
