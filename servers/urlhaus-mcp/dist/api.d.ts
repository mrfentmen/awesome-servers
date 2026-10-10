export declare class UrlhausError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function recentUrls(limit?: string): Promise<string>;
export declare function lookupUrl(url: string): Promise<string>;
export declare function lookupPayload(sha256: string): Promise<string>;
export declare function searchTag(tag: string, limit?: string): Promise<string>;
/**
 * abuse.ch's own published dump, read as a whole rather than queried one URL at a
 * time: how many entries it carries, when they were added, what kind of payload
 * they serve, which hosts keep coming back, and who is reporting them. This is the
 * shape of the last day's activity, which no single lookup can show.
 */
export declare function feedDigest(args: {
    limit?: number;
    threat?: string;
}): Promise<string>;
/**
 * A domain's standing on abuse.ch's public DNS blocklist, read as a DNS lookup
 * rather than an API call, so it works anywhere a resolver does. The answer is
 * decoded rather than passed through: each return code names a different reason
 * the domain is listed.
 */
export declare function domainReputation(args: {
    domain: string;
    checkMx?: boolean;
}): Promise<string>;
