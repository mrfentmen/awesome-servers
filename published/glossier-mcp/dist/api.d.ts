export declare class GlossierError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function searchProducts(query: string, limit?: string, maxPrice?: string, productType?: string): Promise<string>;
export declare function listNewest(limit?: string, page?: string, productType?: string): Promise<string>;
export declare function getProduct(handle: string): Promise<string>;
export declare function priceOverview(limit?: string): Promise<string>;
export declare function findDeals(limit?: string, sample?: string): Promise<string>;
export declare function listCategories(): Promise<string>;
export declare function listCollections(limit?: string): Promise<string>;
export declare function collectionProducts(handle: string, limit?: string, sort?: string): Promise<string>;
export declare function restockCheck(handles: string): Promise<string>;
/**
 * The storefront's own product sitemap, which is the one surface that says
 * *when* a product page last changed rather than what it costs.
 */
export declare function catalogSitemap(limit?: string, days?: string): Promise<string>;
export declare function collectionDetail(handle: string): Promise<string>;
