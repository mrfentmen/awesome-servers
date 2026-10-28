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
