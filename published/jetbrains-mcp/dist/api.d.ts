export declare class JetBrainsError extends Error {
}
export interface PluginHit {
    id: number;
    xmlId: string;
    name: string;
    preview?: string;
    downloads?: number;
    rating?: number;
}
/** Sort orders the Marketplace search accepts. */
export declare const MARKETPLACE_ORDERS: readonly ["relevance", "downloads", "rating", "name", "updated"];
export declare function searchPlugins(query: string, limit?: number, orderBy?: string): Promise<PluginHit[]>;
export interface PluginDetails extends PluginHit {
    vendor?: string;
    link?: string;
}
/** Top of the Marketplace charts: an empty search ordered by downloads or rating. */
export declare function topPlugins(orderBy: 'downloads' | 'rating', limit?: number): Promise<PluginHit[]>;
export interface PluginVersion {
    version: string;
    date?: string;
    link?: string;
    downloads?: number;
}
/** Recent releases of one plugin, newest first. */
export declare function pluginVersions(id: string, limit?: number): Promise<PluginVersion[]>;
export declare function getPlugin(id: string): Promise<PluginDetails>;
export declare function formatHit(p: PluginHit, index?: number): string;
export interface PluginReview {
    id: string;
    rating?: number;
    date?: string;
    comment: string;
}
/** Recent written reviews for one plugin, newest first. */
export declare function pluginReviews(id: string, limit?: number): Promise<PluginReview[]>;
export interface PluginRating {
    total: number;
    meanRating?: number;
    votes: Array<{
        stars: number;
        count: number;
        share: number;
    }>;
}
/** Review score distribution: how many people gave each star rating. */
export declare function pluginRatings(id: string): Promise<PluginRating>;
export declare function formatReview(review: PluginReview, index?: number): string;
export declare function formatRating(rating: PluginRating): string;
export declare function formatPlugin(p: PluginDetails): string;
export declare function errorMessage(e: unknown): string;
export interface TagRow {
    id: number;
    name: string;
    searchable?: boolean;
    privileged?: boolean;
    families?: string[];
}
/** Marketplace search restricted to plugins that install on a given IDE build. */
export declare function searchByBuild(query: string, build: string, limit?: number, orderBy?: string): Promise<string>;
export declare function listTags(limit?: number, family?: string): Promise<string>;
/** The current release of a JetBrains product, with the exact build number to paste into search_by_build. */
export declare function productRelease(args: {
    product: string;
}): Promise<string>;
/** Which IDE builds each release of a plugin is compatible with, which the version list never shows. */
export declare function pluginCompatibility(args: {
    id: string;
    limit?: number;
}): Promise<string>;
