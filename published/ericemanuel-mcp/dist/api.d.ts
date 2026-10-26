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
export interface CatalogFacetsArgs {
    facet?: string;
    value?: string;
    limit?: number;
    products?: number;
}
/**
 * The faceted tag taxonomy, which is the only usable way to filter this catalog.
 * The existing tools filter on product_type, and this store leaves that field
 * empty on every one of its 333 products, so anything typed into that filter
 * matches nothing.
 */
export declare function catalogFacets(args: CatalogFacetsArgs): Promise<string>;
export interface VariantMatrixArgs {
    handle: string;
    include_sold_out?: boolean;
}
export interface CollectionCatalogArgs {
    collection?: string;
    limit?: number;
    sort_by?: string;
}
