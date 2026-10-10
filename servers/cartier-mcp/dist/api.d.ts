export declare class CartierError extends Error {
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
export interface CollectionsArgs {
    query?: string;
    limit?: string;
}
export interface CollectionItemsArgs {
    handle: string;
    source?: string;
    limit?: string;
    max_price?: string;
    condition?: string;
}
export interface LineMixArgs {
    sample?: string;
    min_items?: string;
}
/** Which Cartier product line the sample is mostly made of, with prices per line. */
export declare function lineFamilyMix(args: LineMixArgs): Promise<string>;
