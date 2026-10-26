export declare class IfAndCoError extends Error {
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
/** What the catalogue is actually made of, counted from the titles, tags and variant names. */
export declare function materialCensus(args: {
    sample?: string;
    limit?: string;
}): Promise<string>;
/** The personalisation the house offers, which the product tools only reveal one listing at a time. */
export declare function personalisationCensus(args: {
    sample?: string;
    limit?: string;
}): Promise<string>;
