export declare class SentryError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function listOrgs(): Promise<string>;
export declare function orgProjects(org: string): Promise<string>;
export declare function orgIssues(org: string): Promise<string>;
export declare function issueDetails(org: string, issueId: string): Promise<string>;
export declare function issueEvents(org: string, issueId: string): Promise<string>;
export declare function projectDetails(org: string, project: string): Promise<string>;
export declare function teams(org: string): Promise<string>;
export declare function members(org: string): Promise<string>;
export declare function releases(org: string): Promise<string>;
export declare function eventDetails(org: string, issueId: string, eventId: string): Promise<string>;
/**
 * The release channels a package publishes right now, how fast each one moves,
 * and what the latest release requires of the host. For a client SDK this is the
 * difference between being current and being quietly unsupported.
 */
export declare function releaseFeed(args: {
    package: string;
    limit?: number;
}): Promise<string>;
/**
 * How a package's runtime dependency surface has changed across its recent
 * releases, which is what decides whether an upgrade is safe: what each release
 * added, dropped and moved, and how the transitive count has moved with it.
 */
export declare function dependencyDrift(args: {
    package: string;
    releases?: number;
}): Promise<string>;
