export declare class DiorError extends Error {
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
export interface LineCatalogueArgs {
    sample?: number;
    min_items?: number;
    limit?: number;
}
export interface SourceCoverageArgs {
    sample?: number;
}
export interface InventoryDigestArgs {
    sample?: number;
    limit?: number;
}
/** The combined Dior inventory right now: how much there is, how much is sellable, how wide the price range is, and what arrived most recently. */
export declare function inventoryDigest(args?: InventoryDigestArgs): Promise<string>;
