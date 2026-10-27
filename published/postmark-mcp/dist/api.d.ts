export declare class PostmarkError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getServer(): Promise<string>;
export declare function listTemplates(count?: string): Promise<string>;
export declare function listOutbound(count?: string): Promise<string>;
/**
 * Whether the servers a domain sends mail from are on any public blocklist.
 * A single listing is enough for a receiving MTA to reject or junk a stream, so
 * this is the first thing to check when transactional mail starts landing in spam.
 */
export declare function blacklistCheck(args: {
    email: string;
    limit?: number;
}): Promise<string>;
/**
 * Whether a sending domain publishes the modern transport-security policies:
 * an MTA-STS policy file that pins which hosts may send for it, a BIMI record
 * for logo display, and a TLS-RPT record for reporting failed handshakes.
 */
export declare function mailPolicyReport(args: {
    domain: string;
}): Promise<string>;
