export declare class IceboxError extends Error {
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
 * The option axes the catalog actually sells on - metal, diamond type, ring
 * size - with the price each value carries, which the product tools never show
 * because a listing only prints its first variant.
 */
export declare function optionPriceMatrix(args: {
    axis?: string;
    limit?: string;
    sample?: string;
}): Promise<string>;
/**
 * The storefront's own product sitemap: every product page with the date it
 * last changed, which is the only place the store says what it edited.
 */
export declare function catalogSitemap(args: {
    limit?: string;
    days?: string;
}): Promise<string>;
