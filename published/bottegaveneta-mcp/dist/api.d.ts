export declare class BottegaVenetaError extends Error {
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
export interface FreshnessArgs {
    sample?: string;
}
export interface VariantArgs {
    sample?: string;
}
/** How many options each listing offers, and how prices spread inside one item. */
export declare function variantDepth(sample?: string): Promise<string>;
export interface TypeLadderArgs {
    sample?: string;
    min_items?: string;
}
