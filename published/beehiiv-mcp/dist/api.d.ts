export declare class BeehiivError extends Error {
}
export interface Post {
    id: string;
    title?: string;
    status?: string;
    published?: string;
    url?: string;
}
export declare function listPosts(publicationId: string, limit?: number): Promise<Post[]>;
export interface Subscriber {
    email?: string;
    status?: string;
    tier?: string;
    created?: string;
}
export declare function findSubscriber(publicationId: string, email: string): Promise<Subscriber | null>;
export declare function formatPost(p: Post, index?: number): string;
export interface PublicationsArgs {
    limit?: number;
    order_by?: string;
    order_direction?: string;
}
/**
 * GET /publications?expand[]=stats
 * Fields: data[].id/name/organization_name/referral_program_enabled/created,
 * data[].stats.{active_subscriptions, active_premium_subscriptions,
 * active_free_subscriptions, average_open_rate, average_click_rate, total_sent,
 * total_unique_opened, total_clicked}
 */
export declare function listPublications(args: PublicationsArgs): Promise<string>;
export interface PublicationStatsArgs {
    publication_id: string;
}
/**
 * GET /publications/{publicationId}?expand[]=stats
 */
export declare function publicationStats(args: PublicationStatsArgs): Promise<string>;
export interface TiersArgs {
    publication_id: string;
    limit?: number;
}
/**
 * GET /publications/{publicationId}/tiers?expand[]=stats&expand[]=prices
 * Fields: data[].id/name/status/description/stats.active_subscriptions,
 * data[].prices[].{amount_cents, currency, interval, enabled}
 */
export declare function listTiers(args: TiersArgs): Promise<string>;
