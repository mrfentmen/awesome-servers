export declare class GucciError extends Error {
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
/**
 * The condition, price-band and category mix actually in stock, taken from the
 * tags the two stores publish on every listing.
 */
export declare function tagFacets(args: {
    limit?: string;
    sample?: string;
    facet?: string;
}): Promise<string>;
/** How fast stock turns over: how long the current Gucci listings have been up. */
export declare function listingVelocity(args: {
    limit?: string;
    sample?: string;
    days?: string;
}): Promise<string>;
