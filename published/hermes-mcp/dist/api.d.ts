export declare class HermesError extends Error {
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
/** Condition by product type, with the asking price in each cell: what the stock actually looks like. */
export declare function conditionMatrix(args: {
    sample?: string;
    types?: string;
    limit?: string;
}): Promise<string>;
/** Where the asking prices sit: a histogram of bands, plus the median and spread. */
export declare function priceDistribution(args: {
    sample?: string;
    bands?: string;
}): Promise<string>;
