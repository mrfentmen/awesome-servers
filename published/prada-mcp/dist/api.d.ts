export declare class PradaError extends Error {
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
 * Which Prada sizes are actually on the shelf right now, and what they cost.
 * Size is the one attribute the storefront tags consistently and the existing
 * filters ignore, and it is the attribute that decides whether a piece is
 * buyable at all.
 */
export declare function sizeMatrix(args: {
    sample?: string;
    productType?: string;
}): Promise<string>;
/**
 * The merchandising flags the two storefronts attach to their Prada stock:
 * which pieces are outlet, final sale, new arrivals or promo eligible, and what
 * those pieces cost against the rest of the sample.
 */
export declare function flagReport(args: {
    sample?: string;
    limit?: string;
}): Promise<string>;
