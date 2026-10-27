export declare class StoreError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function searchProducts(query: string, limit?: string, maxPrice?: string, productType?: string): Promise<string>;
export declare function listNewest(limit?: string, page?: string, productType?: string): Promise<string>;
export declare function getProduct(handle: string): Promise<string>;
export declare function priceOverview(limit?: string): Promise<string>;
export declare function findDeals(limit?: string, sample?: string): Promise<string>;
export declare function listCategories(): Promise<string>;
/**
 * The store's collection index: every merchandising collection with the number
 * of products it holds, so a shop can see the shape of the range before
 * drilling into one of them.
 */
export declare function listCollections(args: {
    sort?: string;
    limit?: number;
}): Promise<string>;
