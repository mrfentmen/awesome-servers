export declare class ChanelError extends Error {
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
export interface LineArgs {
    sample?: string;
    min_items?: string;
}
export interface GridArgs {
    sample?: string;
    min_cells?: string;
}
export interface ArbitrageArgs {
    sample?: string;
    min_gap_pct?: string;
    limit?: string;
    title_words?: number;
}
/** Models listed on both stores at once, with the price gap between them. */
export declare function crossStoreArbitrage(args: ArbitrageArgs): Promise<string>;
