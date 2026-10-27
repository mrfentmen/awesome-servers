export declare class BitError extends Error {
}
export interface Release {
    slug: string;
    title: string;
    description?: string;
    url: string;
}
/** '520414-sievert-chips-dips-and-facerips' -> 'Sievert: Chips, Dips and Facerips' */
export declare function titleFromSlug(slug: string): string;
/** The info anchors look like: 8BP142<br> Random: Arpeggio Springs. */
export declare function parseListing(html: string): Release[];
export declare function listReleases(page?: number): Promise<Release[]>;
export declare function getRelease(slug: string): Promise<Release | null>;
export declare function formatRelease(r: Release, index?: number): string;
export interface Artist {
    slug: string;
    name: string;
    url: string;
}
/** The /artists index repeats every artist for its "Read more" link, so key by slug. */
export declare function parseArtists(html: string): Artist[];
export declare function listArtists(limit?: number): Promise<string>;
/** Artist pages link their releases as /products/<id>-<slug>, twice each. */
export declare function parseArtistReleases(html: string, limit: number): Release[];
export interface ReleaseTracks {
    catalog?: string;
    title?: string;
    tracks: string[];
}
