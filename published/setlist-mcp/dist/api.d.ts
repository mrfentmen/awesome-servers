/**
 * Minimal Setlist.fm REST API v1.0 client.
 *
 * Docs: https://api.setlist.fm/docs/1.0/index.html
 * Requires a free API key (https://www.setlist.fm/settings/api) in the
 * SETLISTFM_API_KEY env var.
 */
export declare class SetlistApiError extends Error {
}
export interface Artist {
    mbid: string;
    name: string;
    disambiguation?: string;
    url: string;
}
export interface Setlist {
    id: string;
    eventDate: string;
    tour?: {
        name: string;
    };
    venue?: {
        name: string;
        city?: {
            name: string;
            country?: {
                name: string;
            };
        };
    };
    sets?: {
        set: {
            name?: string;
            song: {
                name: string;
                info?: string;
                cover?: {
                    name: string;
                };
            }[];
        }[];
    };
    url: string;
}
export interface ArtistSearchResult {
    artist: Artist;
}
export interface SetlistsResult {
    setlist: Setlist[];
    total: number;
    page: number;
    itemsPerPage: number;
}
export declare function searchArtists(name: string): Promise<ArtistSearchResult[]>;
export declare function getArtistByMbid(mbid: string): Promise<Artist>;
export declare function getSetlists(artistMbid: string, page?: number, year?: number): Promise<SetlistsResult>;
export declare function getSetlist(id: string): Promise<Setlist>;
/** Search setlists containing a specific song, used to count live plays. */
export declare function searchSetlistsBySong(artistMbid: string, songName: string, page?: number): Promise<SetlistsResult>;
export declare function formatSetlist(s: Setlist): string;
