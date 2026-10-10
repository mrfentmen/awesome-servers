export declare class KithError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function searchProducts(query: string, limit?: string, maxPrice?: string, productType?: string): Promise<string>;
export declare function listNewest(limit?: string, page?: string, productType?: string): Promise<string>;
export declare function getProduct(handle: string): Promise<string>;
export declare function priceOverview(limit?: string): Promise<string>;
export declare function findDeals(limit?: string, sample?: string): Promise<string>;
export declare function listCategories(): Promise<string>;
export declare function listCollections(query?: string): Promise<string>;
export declare function browseCollection(handle: string, limit?: string, maxPrice?: string, size?: string): Promise<string>;
export declare function find_by_size(size: string, limit?: string, maxPrice?: string): Promise<string>;
/**
 * A size run: for every option axis the store sells on, how many sizes exist, how
 * many are actually buyable right now, and the price each in-stock size carries.
 * The product tools only ever print the first variant.
 */
export declare function sizeRunMatrix(args: {
    sample?: string;
    limit?: string;
    axis?: string;
}): Promise<string>;
/** Which collaborations the shop is actually carrying, counted from the live catalog titles. */
export declare function collaborationCensus(args: {
    sample?: string;
    limit?: string;
}): Promise<string>;
