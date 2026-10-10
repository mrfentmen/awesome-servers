export declare class StadiumGoodsError extends Error {
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
 * Who the shop actually stocks. For every brand it reports how many products sit
 * under it, its price band, how much of that is in stock, and how it ranks against
 * the rest of the assortment, which is what a buyer reorders on.
 */
export declare function brandCensus(args: {
    pages?: number;
    limit?: number;
}): Promise<string>;
