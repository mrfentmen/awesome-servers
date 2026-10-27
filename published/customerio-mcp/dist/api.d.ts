export declare class CustomerioError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listCustomers(limit?: string): Promise<string>;
export declare function getCustomer(identifier: string): Promise<string>;
export declare function listSegments(): Promise<string>;
export declare function segmentDetails(segmentId: string): Promise<string>;
export declare function campaigns(): Promise<string>;
export declare function campaignDetails(campaignId: string): Promise<string>;
export declare function newsletters(): Promise<string>;
export declare function activities(): Promise<string>;
export declare function customerActivities(identifier: string): Promise<string>;
export declare function customerMessages(identifier: string): Promise<string>;
export interface BroadcastMetricsArgs {
    broadcast_id: string;
    period?: string;
    steps?: number;
    type?: string;
}
/** Delivery, open and click metrics for one broadcast, computed the way Customer.io documents, with human clicks separated from machine ones. */
export declare function broadcastMetrics(args: BroadcastMetricsArgs): Promise<string>;
export interface CampaignMetricsArgs {
    campaign_id: string;
    period?: string;
    steps?: number;
}
/** The same delivery, open and click metrics for one automation, which is what tells you whether a journey is working. */
export declare function campaignMetrics(args: CampaignMetricsArgs): Promise<string>;
export interface SegmentMembersArgs {
    segment_id: string;
    limit?: number;
    start?: string;
}
/** Who is actually inside a segment, which is the membership behind every segment size you see in the dashboard. */
export declare function segmentMembers(args: SegmentMembersArgs): Promise<string>;
