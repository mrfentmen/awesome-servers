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
 * What the store has published as policy, plus the shop facts those policies are
 * read against. Two shoppers get different answers about returns and shipping, and
 * the answer is written down here rather than inferred from product data.
 */
export declare function storePolicies(args: {
    limit?: number;
    chars?: number;
}): Promise<string>;
