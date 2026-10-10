export declare class EbayError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function searchItems(query: string, limit?: string): Promise<string>;
export declare function getItem(itemId: string): Promise<string>;
export declare function getItemGroup(itemGroupId: string): Promise<string>;
export declare function getLegacyItem(legacyId: string): Promise<string>;
export declare function dealItems(limit?: string): Promise<string>;
export declare function searchExtended(query: string, limit?: string): Promise<string>;
export declare function searchEndingSoon(query: string, limit?: string): Promise<string>;
export declare function searchLowestPrice(query: string, limit?: string): Promise<string>;
export declare function searchNewlyListed(query: string, limit?: string): Promise<string>;
export declare function searchByCategory(query: string, categoryId: string, limit?: string): Promise<string>;
export interface ShippingOptionsArgs {
    item_id: string;
    item_price?: string;
}
/** Renders the shipping table for one listing and computes landed cost, which is the price that actually decides a purchase. */
export declare function shippingOptions(args: ShippingOptionsArgs): Promise<string>;
export interface FindItemGroupArgs {
    item_ids: string;
    with_listings?: boolean;
    limit?: number;
}
/** Finds which listings share an item group, so a cheaper duplicate of a listing you already found can be found. */
export declare function findItemGroup(args: FindItemGroupArgs): Promise<string>;
export interface MarketPriceContextArgs {
    query: string;
    limit?: number;
}
/** Derived from a search: price distribution and how competitive the cheapest listing actually is. */
export declare function marketPriceContext(args: MarketPriceContextArgs): Promise<string>;
