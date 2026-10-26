/**
 * Steam client — keyless store endpoints.
 *  - Store search:   /api/storesearch
 *  - App details:    /api/appdetails   (filtered to keep payloads small)
 *  - News:           ISteamNews/GetNewsForApp (Steamworks Web API, no key
 *                    required for this endpoint)
 */
export declare class SteamError extends Error {
}
export interface StoreItem {
    type: string;
    appid: number;
    name: string;
    price?: {
        currency: string;
        initial: number;
        final: number;
        discount_percent: number;
    };
    tinyImage?: string;
}
export interface AppDetail {
    appid: number;
    name: string;
    type?: string;
    isFree?: boolean;
    price: {
        currency: string;
        initial: number;
        final: number;
        discountPercent: number;
    } | null;
    releaseDate?: string;
    developers: string[];
    genres: string[];
    metacritic?: number;
    description?: string;
    headerImage?: string;
    url: string;
}
export interface NewsItem {
    title: string;
    url: string;
    author?: string;
    date?: string;
    contents?: string;
}
export declare function searchStore(query: string): Promise<StoreItem[]>;
export declare function getAppDetail(appid: number): Promise<AppDetail | null>;
export declare function getNews(appid: number, count: number): Promise<NewsItem[]>;
export declare function fmtPrice(cents: number, currency?: string): string;
export declare function formatStoreItem(i: StoreItem): string;
export declare function formatAppDetail(a: AppDetail): string;
export interface ReviewSummary {
    total: number;
    positive: number;
    negative: number;
    score_desc: string;
}
export declare function getReviewSummary(appid: number): Promise<ReviewSummary>;
export declare function getPlayerCount(appid: number): Promise<number>;
export interface TopSeller {
    id?: number;
    name?: string;
    final_price?: number;
    currency?: string;
    discount_percent?: number;
}
export declare function getTopSellers(count: number): Promise<TopSeller[]>;
/**
 * The front page of the Store: what is discounted right now, what released
 * this week and what is coming. top_sellers is a separate tool; these three
 * slices were never read.
 */
export declare function storeHighlights(args: {
    limit?: number;
}): Promise<string>;
/**
 * Checks a list of app ids for a discount, one request each, which is how a
 * wishlist is reviewed before a sale ends. Steam rejects a multi-id request.
 */
export declare function salesCheck(args: {
    appids: number[];
}): Promise<string>;
/**
 * Live player counts for several games at once, ranked, which is the honest
 * measure of what is actually being played right now.
 */
export declare function playerCountRank(args: {
    appids: number[];
}): Promise<string>;
export interface GameRequirementsArgs {
    appid: number;
}
export interface GameDlcCostArgs {
    appid: number;
}
export interface GameAchievementsArgs {
    appid: number;
}
export declare function game_achievements(args: GameAchievementsArgs): Promise<string>;
