export declare class AdGuardError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
/** What a public AdGuard filter list actually contains, read without any AdGuard Home instance. */
export declare function filterRuleAudit(args: {
    url?: string;
}): Promise<string>;
