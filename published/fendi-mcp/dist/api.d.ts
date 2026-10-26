export declare class FendiError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function searchListings(query: string, limit?: string, maxPrice?: string, condition?: string): Promise<string>;
export declare function listNewest(limit?: string, page?: string, productType?: string, maxPrice?: string, condition?: string): Promise<string>;
export declare function getListing(handle: string, source?: string): Promise<string>;
export declare function priceOverview(limit?: string): Promise<string>;
export declare function comparePrices(query: string, limit?: string): Promise<string>;
export declare function findDeals(limit?: string, sample?: string): Promise<string>;
export declare function brandOverview(): Promise<string>;
export declare function listCollections(query?: string): Promise<string>;
export declare function browseCollection(handle: string, source?: string, limit?: string, maxPrice?: string, condition?: string): Promise<string>;
export declare function find_by_attribute(color?: string, material?: string, condition?: string, maxPrice?: string, limit?: string, sample?: string): Promise<string>;
export interface MatchedListing {
    source: string;
    title: string;
    handle: string;
    price: number | null;
    available: boolean;
    condition: string | null;
    url: string;
    size: string | null;
}
export interface CrossMarketMatchArgs {
    model?: string;
    query?: string;
    pages?: number;
    limit?: number;
}
/**
 * The same model priced on both sites. The join is on the model name inside the
 * title, which is a real limitation: it cannot see that a "Baguette" and a
 * "Baguette II" are different bags, and it will happily treat two colourways of
 * one bag as one comparison.
 */
export declare function crossMarketMatch(args: CrossMarketMatchArgs): Promise<string>;
export interface PriceLadderArgs {
    model?: string;
    query?: string;
    pages?: number;
}
/**
 * The real floor: the cheapest listing that can actually be bought, as opposed to
 * the cheapest listing, which on these sites is often sold out and is therefore
 * not a price at all.
 */
export declare function priceLadder(args: PriceLadderArgs): Promise<string>;
export interface SourceTaxonomyArgs {
    source?: string;
    top?: number;
}
/**
 * The two sites' product types side by side. They are not reconcilable: the
 * catalogs use disjoint vocabularies, so a category filter on one site means
 * nothing on the other and a cross-site count by category is not a like-for-like
 * comparison.
 */
export declare function sourceTaxonomy(args: SourceTaxonomyArgs): Promise<string>;
