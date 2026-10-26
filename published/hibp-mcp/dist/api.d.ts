export declare function errorMessage(e: unknown): string;
export declare function breachCatalog(args: {
    domain?: string;
    year?: number;
    limit?: number;
}): Promise<string>;
export declare function breachDetail(args: {
    name: string;
}): Promise<string>;
export declare function recentBreaches(args: {
    days?: number;
    limit?: number;
}): Promise<string>;
export declare function breachStats(args: {
    year?: number;
}): Promise<string>;
export declare function dataClasses(args: {
    limit?: number;
}): Promise<string>;
export declare function passwordExposure(args: {
    password: string;
}): Promise<string>;
export declare function passwordAudit(args: {
    passwords: string[];
}): Promise<string>;
export declare function latestBreach(): Promise<string>;
/**
 * Entropy estimate plus a breach lookup. The maths assumes the password is drawn
 * from the character classes it happens to use; a phrase a human invented has far
 * less real entropy, so the headline number is an upper bound.
 */
export declare function passwordStrength(args: {
    password: string;
    guesses_per_second?: number;
}): Promise<string>;
/** Known advisories against a published package version, from the Open Source Vulnerability database. */
export declare function packageVulnerabilities(args: {
    package: string;
    version?: string;
    ecosystem?: string;
    limit?: number;
}): Promise<string>;
/** CVEs from the NIST vulnerability database, by keyword or by identifier. */
export declare function cveSearch(args: {
    query: string;
    limit?: number;
}): Promise<string>;
