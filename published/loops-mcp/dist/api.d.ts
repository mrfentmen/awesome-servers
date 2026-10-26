export declare class LoopsError extends Error {
}
type Raw = Record<string, any>;
export interface Contact {
    id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
}
export declare function findContact(email: string): Promise<Contact | null>;
export declare function createContact(email: string, firstName?: string, lastName?: string): Promise<string>;
export declare function sendEvent(email: string, eventName: string, properties?: Raw): Promise<string>;
export declare function formatContact(c: Contact): string;
/**
 * Everything a domain publishes about its own mail: where mail is delivered,
 * what SPF authorises, and what DMARC demands of senders.
 */
export declare function sendingDomainDns(args: {
    domain: string;
}): Promise<string>;
/** Check that the links in a campaign are reachable, and where they end up. */
export declare function campaignLinkAudit(args: {
    links: string;
    limit?: number;
}): Promise<string>;
export {};
