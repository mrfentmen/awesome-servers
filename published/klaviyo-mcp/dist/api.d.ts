export declare class KlaviyoError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listProfiles(): Promise<string>;
export declare function listLists(): Promise<string>;
export declare function listCampaigns(): Promise<string>;
export declare function profileDetails(profileId: string): Promise<string>;
export declare function listDetails(listId: string): Promise<string>;
export declare function campaignDetails(campaignId: string): Promise<string>;
export declare function metrics(): Promise<string>;
export declare function events(): Promise<string>;
export declare function flows(): Promise<string>;
export declare function segments(): Promise<string>;
/** Would this signup address land in a throwaway inbox? The disposable domain blocklist says so before you send a welcome email. */
export declare function disposableCheck(args: {
    email: string;
    related?: string[];
}): Promise<string>;
/** Is this sending domain set up to be delivered? MX, SPF, DKIM selectors and DMARC, read live from DNS. */
export declare function sendingReadiness(args: {
    domain: string;
    dkim_selectors?: string[];
}): Promise<string>;
