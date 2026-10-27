export declare class MailchimpError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function ping(): Promise<string>;
export declare function listLists(count?: string): Promise<string>;
export declare function listMembers(listId: string, count?: string): Promise<string>;
export declare function listCampaigns(count?: string): Promise<string>;
export declare function listDetails(listId: string): Promise<string>;
export declare function memberDetails(listId: string, email: string): Promise<string>;
export declare function campaignDetails(campaignId: string): Promise<string>;
export declare function automations(): Promise<string>;
export declare function segments(listId: string): Promise<string>;
export declare function campaignReport(campaignId: string): Promise<string>;
/** Whether a pasted address list can be mailed: syntax, duplicates, role accounts and per-domain mail routing. */
export declare function audienceHygieneAudit(args: {
    addresses: string;
    checkDns?: boolean;
}): Promise<string>;
/** Whether a campaign body is sendable: unsubscribe, postal address, tracking and link hygiene. */
export declare function emailComplianceScan(args: {
    html: string;
    limit?: number;
}): Promise<string>;
