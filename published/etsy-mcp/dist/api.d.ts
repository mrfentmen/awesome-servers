export declare class EtsyError extends Error {
}
export interface Shop {
    shopId: number;
    name?: string;
    title?: string;
    listings?: number;
    rating?: number;
    url?: string;
}
export declare function findShop(name: string): Promise<Shop[]>;
export interface Listing {
    id: number;
    title?: string;
    price?: string;
    currency?: string;
    quantity?: number;
    url?: string;
    image?: string;
}
export declare function shopListings(shopId: string, limit?: number): Promise<Listing[]>;
export declare function getListing(id: string): Promise<Listing>;
export declare function formatShop(s: Shop, index?: number): string;
export declare function formatListing(l: Listing, index?: number): string;
export interface ShopCatalogueArgs {
    shop_id: string;
    keywords?: string;
    price_min?: number;
    price_max?: number;
    taxonomy_id?: number;
    sort_on?: string;
    sort_order?: string;
    limit?: number;
    offset?: number;
    analyse?: boolean;
}
/**
 * The active listings of a shop with the documented filters applied, plus a
 * price and stock distribution. The existing shop_listings dumps the first
 * listings in whatever order Etsy returns and caps at 100, so a shop with
 * several hundred products is only ever partly visible and cannot be filtered.
 */
export declare function shopCatalogue(args: ShopCatalogueArgs): Promise<string>;
export interface ListingVariationsArgs {
    listing_id: string;
    only_available?: boolean;
}
/**
 * The per-option matrix for a listing. The existing get_listing reads one price
 * and one quantity from the top level, so a listing offered in five sizes and
 * three colours reports a single figure that may correspond to no purchasable
 * combination at all.
 */
export declare function listingVariations(args: ListingVariationsArgs): Promise<string>;
export interface FeaturedListingsArgs {
    shop_id: string;
    limit?: number;
}
/**
 * The listings a shop has chosen to feature. This is a merchant-curated decision
 * and nothing about price, age or quantity reveals it, so it is not derivable
 * from the active listings endpoint.
 */
export declare function featuredListings(args: FeaturedListingsArgs): Promise<string>;
