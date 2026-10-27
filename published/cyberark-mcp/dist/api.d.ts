export declare function errorMessage(e: unknown): string;
export declare function checkPassword(args: {
    password: string;
}): Promise<string>;
export declare function checkPasswords(args: {
    passwords: string[];
}): Promise<string>;
export interface StrengthResult {
    length: number;
    classes: number;
    entropyBits: number;
    crackSeconds: number;
    findings: string[];
    verdict: string;
}
/** Scores a password locally. Nothing is transmitted. */
export declare function analyzeStrength(password: string): StrengthResult;
export declare function passwordStrength(args: {
    password: string;
}): Promise<string>;
export declare function generatePassword(args: {
    length?: number;
    symbols?: boolean;
    digits?: boolean;
    upperCase?: boolean;
}): Promise<string>;
export declare function breachCatalog(args: {
    domain?: string;
    year?: number;
    limit?: number;
}): Promise<string>;
export declare function breachDetail(args: {
    name: string;
}): Promise<string>;
export declare function domainEmailSecurity(args: {
    domain: string;
}): Promise<string>;
export declare function identifyHash(args: {
    hash: string;
}): Promise<string>;
export declare function hashText(args: {
    text: string;
    algorithm?: string;
}): Promise<string>;
export declare function breachTimeline(args: {
    from?: number;
    to?: number;
}): Promise<string>;
export declare function subdomainInventory(args: {
    domain: string;
    names?: string;
    limit?: number;
}): Promise<string>;
export interface DnsInventoryArgs {
    domain: string;
}
export interface DnssecArgs {
    domain: string;
}
/** Whether a domain is actually DNSSEC-signed and validated, following the chain from DS to DNSKEY to RRSIG. */
export declare function dnssecStatus(args: DnssecArgs): Promise<string>;
export interface VariationAuditArgs {
    base: string;
    year?: number;
    limit?: number;
}
