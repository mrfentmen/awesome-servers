export declare class SaintLaurentError extends Error {
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
 * The Saint Laurent range by line, not by price: every named silhouette in the
 * listings, with how many are listed and what each line asks.
 */
export declare function lineMatrix(args: {
    limit?: string;
    material?: string;
}): Promise<string>;
/**
 * The execution behind each piece, which is what decides a Saint Laurent's
 * price: monogram canvas against plain leather, real crocodile embossing
 * against a printed crocodile, and which of those is actually on the shelf.
 */
export declare function materialCensus(args: {
    limit?: string;
    line?: string;
}): Promise<string>;
