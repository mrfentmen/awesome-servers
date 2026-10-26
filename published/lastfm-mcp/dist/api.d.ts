export declare class LastfmError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function topArtists(limit?: string): Promise<string>;
export declare function topTracks(limit?: string): Promise<string>;
export declare function artistInfo(artist: string): Promise<string>;
/** The canonical artist record from MusicBrainz: MBID, aliases, area, life span, tags and discography size. */
export declare function musicbrainzArtist(args: {
    artist: string;
    limit?: number;
}): Promise<string>;
/** Cover art for a release from the Cover Art Archive, with every published size. */
export declare function coverArt(args: {
    mbid: string;
}): Promise<string>;
/** How many release groups an artist has, with their first dates: the discography view Last.fm never gives. */
export declare function artistDiscography(args: {
    artist: string;
    limit?: number;
}): Promise<string>;
