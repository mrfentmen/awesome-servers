export declare class RybbitError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getOverview(site: string, startDate: string, endDate: string, timeZone?: string): Promise<string>;
export declare function listUsers(site: string, startDate: string, endDate: string, timeZone?: string, limit?: number): Promise<string>;
export declare function getJourneys(site: string, startDate: string, endDate: string, timeZone?: string): Promise<string>;
/**
 * The registry record behind a domain the analytics is attributed to: who holds
 * it, who the registrar is, when it was registered, when it expires and what
 * locks are set on it. A domain registered last week cannot have a history.
 */
export declare function domainProfile(args: {
    domain: string;
}): Promise<string>;
/**
 * Which measurement tags a page actually loads, read from the live HTML: the
 * vendor scripts, the specific container and property ids, and the frameworks
 * that usually decide how a site is built. Anything reporting traffic needs to
 * know what is being counted before it counts it.
 */
export declare function trackingAudit(args: {
    url: string;
    limit?: number;
}): Promise<string>;
