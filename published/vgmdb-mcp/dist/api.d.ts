/**
 * Video game music database client — backed by the iTunes Catalog API.
 *
 * Why: the original VGMdb.info API went offline in 2024, and MusicBrainz
 * aggressively resets connections from automated IPs. The iTunes Catalog
 * API is free, needs no key, never fingerprints blocks, and catalogs
 * game soundtrack releases (Chrono Trigger OST, NieR, Undertale...) with
 * full tracklists and composers.
 */
export declare class VgmdbError extends Error {
}
export interface AlbumSearchResult {
    id: number;
    title: string;
    artist: string;
    releaseDate?: string;
    trackCount?: number;
    genre?: string;
    url?: string;
    artwork?: string;
}
export interface AlbumDetail {
    id: number;
    title: string;
    artist: string;
    releaseDate?: string;
    genre?: string;
    url?: string;
    artwork?: string;
    tracks: {
        number: number;
        title: string;
        time?: string;
        disc?: number;
    }[];
}
export interface ArtistSearchResult {
    id: number;
    name: string;
    genre?: string;
    url?: string;
}
export interface ArtistDetail {
    id: number;
    name: string;
    albums: AlbumSearchResult[];
}
export declare function searchAlbums(query: string): Promise<AlbumSearchResult[]>;
export declare function getAlbum(id: string): Promise<AlbumDetail | null>;
export declare function searchArtists(query: string): Promise<ArtistSearchResult[]>;
export declare function getArtist(id: string): Promise<ArtistDetail | null>;
export declare function formatAlbumSearch(a: AlbumSearchResult): string;
export declare function formatAlbumDetail(a: AlbumDetail): string;
export declare function formatArtistSearch(a: ArtistSearchResult): string;
export declare function formatArtistDetail(a: ArtistDetail): string;
/** Find a track and the album it sits on, which the album and artist searches cannot do. */
export declare function trackSearch(args: {
    query?: string;
    limit?: number;
}): Promise<string>;
export interface StorefrontArgs {
    id: string;
    storefronts?: string;
    entity?: 'album' | 'artist';
}
