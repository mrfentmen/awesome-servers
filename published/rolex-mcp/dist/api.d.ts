export declare class RolexError extends Error {
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
 * The Rolex range as a watch rather than a price list: grouped by case material
 * and case diameter, with the model line, the reference number, the asking range
 * and the median for each cell.
 */
export declare function watchSpecMatrix(args: {
    limit?: string;
    line?: string;
}): Promise<string>;
/**
 * The reference number behind a listing, plus the specification that goes with
 * it, so a reference can be matched against a watch already in hand.
 */
export declare function referenceLookup(args: {
    handle: string;
}): Promise<string>;
