export declare class AdGuardError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
/** What a public AdGuard filter list actually contains, read without any AdGuard Home instance. */
export declare function filterRuleAudit(args: {
    url?: string;
}): Promise<string>;
export declare function domainCoverage(args: {
    domain: string;
    url?: string;
}): Promise<string>;
export declare function filterCatalog(args: {
    query?: string;
    limit?: number;
}): Promise<string>;
