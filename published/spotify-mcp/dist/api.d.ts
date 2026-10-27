export declare class SpotifyError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function search(query: string, type?: string, limit?: string): Promise<string>;
export declare function getArtist(artistId: string): Promise<string>;
export declare function getAlbum(albumId: string): Promise<string>;
export declare function getTrack(trackId: string): Promise<string>;
export declare function artistTop(artistId: string): Promise<string>;
export declare function artistAlbums(artistId: string): Promise<string>;
export declare function newReleases(limit?: string): Promise<string>;
export declare function getEpisode(episodeId: string): Promise<string>;
export declare function getShow(showId: string): Promise<string>;
export declare function browseCategories(limit?: string): Promise<string>;
/**
 * Which artist a name actually refers to. MusicBrainz keeps the disambiguation
 * hint, the aliases, the life span and the begin area that decide whether a name
 * is one performer or thirty, which is the question behind every "is this the same
 * artist" mistake made against a streaming catalogue.
 */
export declare function artistIdentity(args: {
    name: string;
    limit?: number;
}): Promise<string>;
/**
 * What is charting, editorially rather than by play count. Spotify's Web API
 * exposes no trending endpoint to a client-credentials app, so this reads the
 * service that does publish one, alongside the album and artist charts.
 */
export declare function musicCharts(args: {
    kind?: string;
    limit?: number;
    genre?: string;
}): Promise<string>;
