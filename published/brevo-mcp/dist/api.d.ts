export declare class BrevoError extends Error {
}
export declare function accountInfo(): Promise<string>;
export interface Contact {
    email?: string;
    created?: string;
    blacklisted?: boolean;
}
export declare function listContacts(limit?: number): Promise<Contact[]>;
export declare function emailReports(days?: number): Promise<string>;
export declare function formatContact(c: Contact, index?: number): string;
export interface CampaignsArgs {
    status?: string;
    limit?: number;
    type?: string;
}
/**
 * GET /emailCampaigns?statistics=globalStats&excludeHtmlContent=true
 * campaigns[].statistics.globalStats carries sent, delivered, uniqueViews,
 * uniqueClicks, clickers, hardBounces, softBounces, unsubscriptions,
 * complaints and opensRate.
 */
export declare function campaignPerformance(args: CampaignsArgs): Promise<string>;
export interface SendersArgs {
    domain?: string;
}
/** GET /senders - identities, whether each is activated, and any dedicated IPs. */
export declare function senderInventory(args: SendersArgs): Promise<string>;
export interface ListsArgs {
    limit?: number;
}
/**
 * GET /contacts/lists
 * Brevo documents that totalSubscribers and totalBlacklisted are being
 * retired and will read 0, so they are reported as sent with that caveat.
 */
export declare function listInventory(args: ListsArgs): Promise<string>;
